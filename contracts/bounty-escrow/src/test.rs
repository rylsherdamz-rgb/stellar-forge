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
    let expected = BountyCompleted { id, developer: s.developer.clone(), amount: 700 };
    let all = s.env.events().all();
    let ours = all.filter_by_contract(&s.client.address);
    assert_eq!(ours.events().last().unwrap(), &expected.to_xdr(&s.env, &s.client.address));
}
