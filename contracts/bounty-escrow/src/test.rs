#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, BytesN, Env,
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

    Setup {
        env,
        client,
        token,
        token_admin,
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
