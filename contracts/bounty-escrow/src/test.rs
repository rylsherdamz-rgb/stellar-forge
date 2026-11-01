#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events as _, Ledger, MockAuth, MockAuthInvoke},
    token, Address, BytesN, Env, Event, IntoVal,
};

fn create_token<'a>(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (addr.clone(), token::StellarAssetClient::new(env, &addr))
}

struct Setup<'a> {
    env: Env,
    client: BountyEscrowClient<'a>,
    token: Address,
    token_admin: token::StellarAssetClient<'a>,
    admin: Address,
    creator: Address,
    developer: Address,
}

fn setup() -> Setup<'static> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_sequence_number(1000);

    let contract_id = env.register(BountyEscrow, ());
    let client = BountyEscrowClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let token_issuer = Address::generate(&env);
    let (token, token_admin) = create_token(&env, &token_issuer);

    let creator = Address::generate(&env);
    let developer = Address::generate(&env);
    token_admin.mint(&creator, &1_000_000);
    client.set_token_allowed(&token, &true);

    Setup {
        env,
        client,
        token,
        token_admin,
        admin,
        creator,
        developer,
    }
}

fn meta(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[7u8; 32])
}
fn sub(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[9u8; 32])
}

fn balance(env: &Env, token: &Address, who: &Address) -> i128 {
    token::Client::new(env, token).balance(who)
}

#[test]
fn happy_path_create_claim_submit_approve() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &500, &5000, &meta(&s.env));
    assert_eq!(id, 0);
    assert_eq!(balance(&s.env, &s.token, &s.creator), 1_000_000 - 500);

    let b = s.client.get_bounty(&id);
    assert_eq!(b.status, Status::Open);

    s.client.claim_bounty(&id, &s.developer);
    assert_eq!(s.client.get_bounty(&id).status, Status::Claimed);

    s.client.submit_bounty(&id, &s.developer, &sub(&s.env));
    assert_eq!(s.client.get_bounty(&id).status, Status::Submitted);

    s.client.approve_bounty(&id);
    let b = s.client.get_bounty(&id);
    assert_eq!(b.status, Status::Completed);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 500);
}

#[test]
fn release_payment_alias_pays_developer() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &300, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.submit_bounty(&id, &s.developer, &sub(&s.env));
    s.client.release_payment(&id);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 300);
    assert_eq!(s.client.get_bounty(&id).status, Status::Completed);
}

#[test]
fn ids_are_monotonic() {
    let s = setup();
    let a = s.client.create_bounty(&s.creator, &s.token, &10, &5000, &meta(&s.env));
    let b = s.client.create_bounty(&s.creator, &s.token, &20, &5000, &meta(&s.env));
    assert_eq!(a, 0);
    assert_eq!(b, 1);
    assert_eq!(s.client.next_id(), 2);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")] // ZeroAmount
fn zero_amount_rejected() {
    let s = setup();
    s.client.create_bounty(&s.creator, &s.token, &0, &5000, &meta(&s.env));
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")] // InvalidDeadline
fn past_deadline_creation_rejected() {
    let s = setup();
    // current sequence is 1000
    s.client.create_bounty(&s.creator, &s.token, &10, &1000, &meta(&s.env));
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")] // AlreadyClaimed
fn double_claim_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    let other = Address::generate(&s.env);
    s.client.claim_bounty(&id, &other);
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")] // NotClaimed
fn submit_before_claim_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.submit_bounty(&id, &s.developer, &sub(&s.env));
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")] // NotDeveloper
fn submit_by_non_claimer_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    let imposter = Address::generate(&s.env);
    s.client.submit_bounty(&id, &imposter, &sub(&s.env));
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")] // NotSubmitted
fn approve_before_submit_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.approve_bounty(&id);
}

#[test]
fn cancel_open_bounty_refunds_creator() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &400, &5000, &meta(&s.env));
    assert_eq!(balance(&s.env, &s.token, &s.creator), 1_000_000 - 400);
    s.client.cancel_bounty(&id);
    assert_eq!(balance(&s.env, &s.token, &s.creator), 1_000_000);
    assert_eq!(s.client.get_bounty(&id).status, Status::Cancelled);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")] // BadStatus
fn cancel_claimed_bounty_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.cancel_bounty(&id);
}

#[test]
fn refund_after_deadline_returns_funds() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &600, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    // advance past deadline
    s.env.ledger().set_sequence_number(6000);
    s.client.refund_bounty(&id);
    assert_eq!(balance(&s.env, &s.token, &s.creator), 1_000_000);
    assert_eq!(s.client.get_bounty(&id).status, Status::Refunded);
}

#[test]
#[should_panic(expected = "Error(Contract, #14)")] // BeforeDeadline
fn refund_before_deadline_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.refund_bounty(&id);
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")] // PastDeadline
fn claim_after_deadline_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.env.ledger().set_sequence_number(6000);
    s.client.claim_bounty(&id, &s.developer);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")] // NotFound
fn get_missing_bounty_rejected() {
    let s = setup();
    s.client.get_bounty(&999);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")] // AlreadyInitialized
fn double_initialize_rejected() {
    let s = setup();
    let admin2 = Address::generate(&s.env);
    s.client.initialize(&admin2);
}

#[test]
fn full_cycle_does_not_touch_unrelated_bounty() {
    let s = setup();
    let a = s.client.create_bounty(&s.creator, &s.token, &100, &5000, &meta(&s.env));
    let b = s.client.create_bounty(&s.creator, &s.token, &200, &5000, &meta(&s.env));
    s.client.claim_bounty(&a, &s.developer);
    s.client.submit_bounty(&a, &s.developer, &sub(&s.env));
    s.client.approve_bounty(&a);
    // b is untouched
    assert_eq!(s.client.get_bounty(&b).status, Status::Open);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 100);
    // silence unused warning
    let _ = &s.token_admin;
}

// ---- helpers for the v0.2 lifecycle ----

fn submitted(s: &Setup) -> u64 {
    let id = s.client.create_bounty(&s.creator, &s.token, &700, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.submit_bounty(&id, &s.developer, &sub(&s.env));
    id
}

// ---- #29: disputes close the Submitted funds-lock ----

#[test]
fn developer_dispute_resolved_in_developer_favour() {
    let s = setup();
    let id = submitted(&s);
    s.client.dispute_bounty(&id, &s.developer);
    assert_eq!(s.client.get_bounty(&id).status, Status::Disputed);
    s.client.resolve_dispute(&id, &true);
    assert_eq!(s.client.get_bounty(&id).status, Status::Completed);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 700);
}

#[test]
fn creator_dispute_resolved_as_refund() {
    let s = setup();
    let id = submitted(&s);
    s.client.dispute_bounty(&id, &s.creator);
    s.client.resolve_dispute(&id, &false);
    assert_eq!(s.client.get_bounty(&id).status, Status::Refunded);
    assert_eq!(balance(&s.env, &s.token, &s.creator), 1_000_000);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #20)")] // NotParty
fn outsider_cannot_dispute() {
    let s = setup();
    let id = submitted(&s);
    let outsider = Address::generate(&s.env);
    s.client.dispute_bounty(&id, &outsider);
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")] // NotSubmitted
fn cannot_dispute_unsubmitted_bounty() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.dispute_bounty(&id, &s.developer);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")] // BadStatus
fn creator_cannot_refund_disputed_after_deadline() {
    let s = setup();
    let id = submitted(&s);
    s.client.dispute_bounty(&id, &s.developer);
    s.env.ledger().set_sequence_number(6000);
    s.client.refund_bounty(&id);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")] // BadStatus
fn creator_cannot_refund_submitted_after_deadline() {
    let s = setup();
    let id = submitted(&s);
    s.env.ledger().set_sequence_number(6000);
    s.client.refund_bounty(&id);
}

#[test]
#[should_panic(expected = "Error(Contract, #21)")] // NotDisputed
fn resolve_requires_dispute() {
    let s = setup();
    let id = submitted(&s);
    s.client.resolve_dispute(&id, &true);
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")] // PastDeadline
fn submit_after_deadline_rejected() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &50, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.env.ledger().set_sequence_number(5000);
    s.client.submit_bounty(&id, &s.developer, &sub(&s.env));
}

// ---- #30: admin controls ----

#[test]
fn pause_blocks_new_activity_but_not_exits() {
    let s = setup();
    let open = s.client.create_bounty(&s.creator, &s.token, &100, &5000, &meta(&s.env));
    let live = submitted(&s);
    s.client.pause();
    assert!(s.client.is_paused());

    assert_eq!(
        s.client.try_create_bounty(&s.creator, &s.token, &10, &5000, &meta(&s.env)),
        Err(Ok(BountyError::Paused))
    );
    assert_eq!(
        s.client.try_claim_bounty(&open, &s.developer),
        Err(Ok(BountyError::Paused))
    );

    // exits still work while paused
    s.client.cancel_bounty(&open);
    s.client.approve_bounty(&live);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 700);

    s.client.unpause();
    assert!(!s.client.is_paused());
    s.client.create_bounty(&s.creator, &s.token, &10, &5000, &meta(&s.env));
}

#[test]
fn pause_requires_admin_auth() {
    let s = setup();
    s.client.pause();
    assert_eq!(
        s.env.auths()[0].0,
        s.admin,
        "pause must be authorized by the stored admin"
    );
}

#[test]
fn non_admin_cannot_pause() {
    let s = setup();
    let mallory = Address::generate(&s.env);
    // Only mallory signs; the stored admin does not.
    s.env.mock_auths(&[MockAuth {
        address: &mallory,
        invoke: &MockAuthInvoke {
            contract: &s.client.address,
            fn_name: "pause",
            args: ().into_val(&s.env),
            sub_invokes: &[],
        },
    }]);
    assert!(s.client.try_pause().is_err());
    // mock_auths is per-invocation; is_paused needs no auth.
    assert!(!s.client.is_paused());
}

#[test]
fn unlisted_token_rejected_and_delisting_keeps_existing_escrow_safe() {
    let s = setup();
    let issuer = Address::generate(&s.env);
    let (rogue, rogue_admin) = create_token(&s.env, &issuer);
    rogue_admin.mint(&s.creator, &1_000);
    assert!(!s.client.is_token_allowed(&rogue));
    assert_eq!(
        s.client.try_create_bounty(&s.creator, &rogue, &10, &5000, &meta(&s.env)),
        Err(Ok(BountyError::TokenNotAllowed))
    );

    // Delisting after creation must not strand funds.
    let id = s.client.create_bounty(&s.creator, &s.token, &250, &5000, &meta(&s.env));
    s.client.set_token_allowed(&s.token, &false);
    assert!(!s.client.is_token_allowed(&s.token));
    s.client.cancel_bounty(&id);
    assert_eq!(balance(&s.env, &s.token, &s.creator), 1_000_000);
}

#[test]
fn admin_rotation() {
    let s = setup();
    let next = Address::generate(&s.env);
    s.client.set_admin(&next);
    // Both old and new admin signed (check before any other invocation).
    let signers: std::vec::Vec<Address> = s.env.auths().iter().map(|a| a.0.clone()).collect();
    assert!(signers.contains(&s.admin));
    assert!(signers.contains(&next));
    assert_eq!(s.client.admin(), next);
}

// ---- #31: developer lifecycle ----

#[test]
fn unclaim_reopens_for_another_developer() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &90, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.unclaim_bounty(&id, &s.developer);
    let b = s.client.get_bounty(&id);
    assert_eq!(b.status, Status::Open);
    assert_eq!(b.developer, None);

    let other = Address::generate(&s.env);
    s.client.claim_bounty(&id, &other);
    assert_eq!(s.client.get_bounty(&id).developer, Some(other));
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")] // NotDeveloper
fn only_claimer_can_unclaim() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &90, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    let other = Address::generate(&s.env);
    s.client.unclaim_bounty(&id, &other);
}

#[test]
#[should_panic(expected = "Error(Contract, #19)")] // SelfClaim
fn creator_cannot_claim_own_bounty() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &90, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.creator);
}

#[test]
fn extend_deadline_lets_developer_submit_later() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &90, &5000, &meta(&s.env));
    s.client.claim_bounty(&id, &s.developer);
    s.client.extend_deadline(&id, &9000);
    assert_eq!(s.client.get_bounty(&id).deadline, 9000);
    s.env.ledger().set_sequence_number(6000);
    s.client.submit_bounty(&id, &s.developer, &sub(&s.env));
    assert_eq!(
        s.client.try_refund_bounty(&id),
        Err(Ok(BountyError::BadStatus))
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")] // InvalidDeadline
fn deadline_cannot_be_shortened() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &90, &5000, &meta(&s.env));
    s.client.extend_deadline(&id, &4000);
}

// ---- #32: typed events ----

#[test]
fn create_emits_typed_event_with_id_topic() {
    let s = setup();
    let id = s.client.create_bounty(&s.creator, &s.token, &123, &5000, &meta(&s.env));
    let expected = BountyCreated {
        id,
        creator: s.creator.clone(),
        token: s.token.clone(),
        amount: 123,
        deadline: 5000,
    };
    let all = s.env.events().all();
    let ours = all.filter_by_contract(&s.client.address);
    assert_eq!(ours.events().last().unwrap(), &expected.to_xdr(&s.env, &s.client.address));
}

#[test]
fn approve_emits_completed_event() {
    let s = setup();
    let id = submitted(&s);
    s.client.approve_bounty(&id);
    let expected = BountyCompleted { id, developer: s.developer.clone(), amount: 700, fee: 0 };
    let all = s.env.events().all();
    let ours = all.filter_by_contract(&s.client.address);
    assert_eq!(ours.events().last().unwrap(), &expected.to_xdr(&s.env, &s.client.address));
}

// ---- #34: reject + resubmit ----

#[test]
fn reject_then_resubmit_then_approve() {
    let s = setup();
    let id = submitted(&s);
    let reason = BytesN::from_array(&s.env, &[3u8; 32]);
    s.client.reject_submission(&id, &reason);
    let b = s.client.get_bounty(&id);
    assert_eq!(b.status, Status::Claimed);
    assert_eq!(b.submission_hash, None);
    assert_eq!(b.developer, Some(s.developer.clone()));

    s.client.submit_bounty(&id, &s.developer, &sub(&s.env));
    s.client.approve_bounty(&id);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 700);
}

#[test]
fn reject_emits_reason_hash() {
    let s = setup();
    let id = submitted(&s);
    let reason = BytesN::from_array(&s.env, &[3u8; 32]);
    s.client.reject_submission(&id, &reason);
    let expected = SubmissionRejected { id, reason_hash: reason };
    let all = s.env.events().all();
    let ours = all.filter_by_contract(&s.client.address);
    assert_eq!(ours.events().last().unwrap(), &expected.to_xdr(&s.env, &s.client.address));
}

#[test]
fn reject_after_deadline_rejected() {
    let s = setup();
    let id = submitted(&s);
    s.env.ledger().set_sequence_number(5000);
    assert_eq!(
        s.client.try_reject_submission(&id, &sub(&s.env)),
        Err(Ok(BountyError::PastDeadline))
    );
}

// ---- #35: review window ----

#[test]
fn developer_paid_after_review_window_lapses() {
    let s = setup();
    let id = submitted(&s); // submitted at ledger 1000
    let terms = s.client.get_terms(&id);
    assert_eq!(terms.submitted_at, 1000);
    assert_eq!(terms.review_period, DAY_LEDGERS * 7);

    s.env.ledger().set_sequence_number(1000 + DAY_LEDGERS * 7 - 1);
    assert_eq!(
        s.client.try_claim_after_review(&id, &s.developer),
        Err(Ok(BountyError::ReviewPending))
    );

    s.env.ledger().set_sequence_number(1000 + DAY_LEDGERS * 7);
    s.client.claim_after_review(&id, &s.developer);
    assert_eq!(s.client.get_bounty(&id).status, Status::Completed);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 700);
}

#[test]
fn dispute_inside_window_blocks_review_claim() {
    let s = setup();
    let id = submitted(&s);
    s.client.dispute_bounty(&id, &s.creator);
    s.env.ledger().set_sequence_number(1000 + DAY_LEDGERS * 30);
    assert_eq!(
        s.client.try_claim_after_review(&id, &s.developer),
        Err(Ok(BountyError::NotSubmitted))
    );
}

#[test]
fn only_claimer_can_claim_after_review() {
    let s = setup();
    let id = submitted(&s);
    s.env.ledger().set_sequence_number(1000 + DAY_LEDGERS * 7);
    let other = Address::generate(&s.env);
    assert_eq!(
        s.client.try_claim_after_review(&id, &other),
        Err(Ok(BountyError::NotDeveloper))
    );
}

#[test]
fn review_period_is_bounded_and_snapshotted() {
    let s = setup();
    let early = s.client.create_bounty(&s.creator, &s.token, &10, &5000, &meta(&s.env));
    assert_eq!(
        s.client.try_set_review_period(&10),
        Err(Ok(BountyError::InvalidReviewPeriod))
    );
    assert_eq!(
        s.client.try_set_review_period(&(DAY_LEDGERS * 91)),
        Err(Ok(BountyError::InvalidReviewPeriod))
    );
    s.client.set_review_period(&DAY_LEDGERS);
    assert_eq!(s.client.review_period(), DAY_LEDGERS);
    let late = s.client.create_bounty(&s.creator, &s.token, &10, &5000, &meta(&s.env));
    assert_eq!(s.client.get_terms(&early).review_period, DAY_LEDGERS * 7);
    assert_eq!(s.client.get_terms(&late).review_period, DAY_LEDGERS);
}

// ---- #36: platform fee ----

#[test]
fn fee_split_is_exact_and_snapshotted() {
    let s = setup();
    let treasury = Address::generate(&s.env);
    let before = s.client.create_bounty(&s.creator, &s.token, &1_000, &5000, &meta(&s.env));

    s.client.set_fee(&250, &Some(treasury.clone())); // 2.5%
    assert_eq!(s.client.get_fee().fee_bps, 250);
    let after = s.client.create_bounty(&s.creator, &s.token, &1_001, &5000, &meta(&s.env));

    // pre-fee bounty pays in full
    s.client.claim_bounty(&before, &s.developer);
    s.client.submit_bounty(&before, &s.developer, &sub(&s.env));
    s.client.approve_bounty(&before);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 1_000);
    assert_eq!(balance(&s.env, &s.token, &treasury), 0);

    // post-fee bounty: fee rounds down, nothing lost
    s.client.claim_bounty(&after, &s.developer);
    s.client.submit_bounty(&after, &s.developer, &sub(&s.env));
    s.client.approve_bounty(&after);
    // events() reflects the last invocation, so check before any balance reads.
    let expected = BountyCompleted { id: after, developer: s.developer.clone(), amount: 976, fee: 25 };
    let all = s.env.events().all();
    let ours = all.filter_by_contract(&s.client.address);
    assert_eq!(ours.events().last().unwrap(), &expected.to_xdr(&s.env, &s.client.address));
    assert_eq!(balance(&s.env, &s.token, &treasury), 25); // floor(1001*0.025)
    assert_eq!(balance(&s.env, &s.token, &s.developer), 1_000 + 976);
    assert_eq!(balance(&s.env, &s.token, &s.client.address), 0);

}

#[test]
fn fee_never_applies_to_refunds() {
    let s = setup();
    let treasury = Address::generate(&s.env);
    s.client.set_fee(&1_000, &Some(treasury.clone()));
    let id = s.client.create_bounty(&s.creator, &s.token, &500, &5000, &meta(&s.env));
    s.client.cancel_bounty(&id);
    assert_eq!(balance(&s.env, &s.token, &s.creator), 1_000_000);
    assert_eq!(balance(&s.env, &s.token, &treasury), 0);
}

#[test]
fn fee_applies_when_dispute_pays_developer() {
    let s = setup();
    let treasury = Address::generate(&s.env);
    s.client.set_fee(&1_000, &Some(treasury.clone()));
    let id = submitted(&s);
    s.client.dispute_bounty(&id, &s.developer);
    s.client.resolve_dispute(&id, &true);
    assert_eq!(balance(&s.env, &s.token, &treasury), 70);
    assert_eq!(balance(&s.env, &s.token, &s.developer), 630);
}

#[test]
fn invalid_fee_configs_rejected() {
    let s = setup();
    let treasury = Address::generate(&s.env);
    assert_eq!(
        s.client.try_set_fee(&1_001, &Some(treasury)),
        Err(Ok(BountyError::InvalidFee))
    );
    assert_eq!(
        s.client.try_set_fee(&100, &None),
        Err(Ok(BountyError::InvalidFee))
    );
    s.client.set_fee(&0, &None); // disabling is fine
}

#[test]
fn split_fee_never_loses_dust() {
    for amount in [1i128, 7, 999, 10_001, 123_456_789] {
        for bps in [0u32, 1, 250, 999, 1_000] {
            let (net, fee) = split_fee(amount, bps);
            assert_eq!(net + fee, amount);
            assert!(fee >= 0 && net >= 0);
        }
    }
}
