#![cfg(test)]
extern crate std;
use super::*;
use soroban_sdk::{
    contract, contractimpl, contracttype, testutils::{Address as _, Ledger, LedgerInfo},
    vec,
    Address, Bytes, BytesN, Env, Symbol, Vec,
};

#[contracttype]
enum TKey {
    Bal(Address),
    Supply,
    Admin,
    Sym,
    Dec,
}

#[contract]
struct TestToken;

#[contractimpl]
impl TestToken {
    pub fn __constructor(env: Env, admin: Address, symbol: Symbol, decimals: u32) {
        env.storage().instance().set(&TKey::Admin, &admin);
        env.storage().instance().set(&TKey::Sym, &symbol);
        env.storage().instance().set(&TKey::Dec, &decimals);
        env.storage().instance().set(&TKey::Supply, &0i128);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let bal = Self::balance(env.clone(), to.clone());
        env.storage().instance().set(&TKey::Supply, &(Self::total_supply(env.clone()) + amount));
        env.storage().instance().set(&TKey::Bal(to), &(bal + amount));
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        let fb = Self::balance(env.clone(), from.clone());
        if fb < amount {
            panic!("insufficient balance");
        }
        let fb = fb - amount;
        let tb = Self::balance(env.clone(), to.clone()) + amount;
        env.storage().instance().set(&TKey::Bal(from), &fb);
        env.storage().instance().set(&TKey::Bal(to), &tb);
    }

    pub fn balance(env: Env, who: Address) -> i128 {
        env.storage().instance().get(&TKey::Bal(who)).unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&TKey::Supply).unwrap_or(0)
    }

    pub fn symbol(env: Env) -> Symbol {
        env.storage().instance().get(&TKey::Sym).unwrap()
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&TKey::Dec).unwrap()
    }
}

fn key_of(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

fn sha256(env: &Env, b: u8) -> BytesN<32> {
    env.crypto().sha256(&Bytes::from_array(env, &[b; 32])).to_bytes()
}

fn setup() -> (Env, Address, Address, Address, Address, Address, Vec<(i128, BytesN<32>)>) {
    let env = Env::default();
    env.mock_all_auths();
    let depositor = Address::generate(&env);
    let recipient = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let token = env.register(TestToken, (Address::generate(&env), Symbol::new(&env, "VLT"), 7u32));
    let milestones = vec![
        &env,
        (100_i128, sha256(&env, 1)),
        (50_i128, sha256(&env, 2)),
    ];
    let vault = env.register_contract(None, VaultContract);
    VaultContractClient::new(&env, &vault).initialize(
        &depositor,
        &recipient,
        &arbiter,
        &token,
        &milestones,
        &(env.ledger().sequence() + 1000),
    );
    (env, vault, depositor, recipient, arbiter, token, milestones)
}

fn fund_and_deposit(env: &Env, token: &Address, depositor: &Address, vault: &Address, amount: i128) {
    TestTokenClient::new(env, token).mint(depositor, &amount);
    VaultContractClient::new(env, vault).deposit(depositor);
}

#[test]
fn happy_path_claim_all_milestones() {
    let (env, vault, depositor, recipient, _arbiter, token, _ms) = setup();
    fund_and_deposit(&env, &token, &depositor, &vault, 150);
    assert_eq!(VaultContractClient::new(&env, &vault).balance(), 150);

    VaultContractClient::new(&env, &vault).claim_milestone(&0, &key_of(&env, 1));
    assert_eq!(TestTokenClient::new(&env, &token).balance(&recipient), 100);
    assert_eq!(VaultContractClient::new(&env, &vault).balance(), 50);

    VaultContractClient::new(&env, &vault).claim_milestone(&1, &key_of(&env, 2));
    assert_eq!(TestTokenClient::new(&env, &token).balance(&recipient), 150);
    assert_eq!(VaultContractClient::new(&env, &vault).balance(), 0);
}

#[test]
fn wrong_proof_rejected() {
    let (env, vault, depositor, _recipient, _arbiter, token, _ms) = setup();
    fund_and_deposit(&env, &token, &depositor, &vault, 150);
    let res = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        VaultContractClient::new(&env, &vault).claim_milestone(&0, &key_of(&env, 99));
    }));
    assert!(res.is_err());
    assert_eq!(VaultContractClient::new(&env, &vault).balance(), 150);
}

#[test]
fn claim_twice_rejected() {
    let (env, vault, depositor, _recipient, _arbiter, token, _ms) = setup();
    fund_and_deposit(&env, &token, &depositor, &vault, 150);
    VaultContractClient::new(&env, &vault).claim_milestone(&0, &key_of(&env, 1));
    let res = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        VaultContractClient::new(&env, &vault).claim_milestone(&0, &key_of(&env, 1));
    }));
    assert!(res.is_err());
}

#[test]
fn arbiter_release_skips_proof() {
    let (env, vault, depositor, recipient, _arbiter, token, _ms) = setup();
    fund_and_deposit(&env, &token, &depositor, &vault, 150);
    VaultContractClient::new(&env, &vault).release(&0);
    assert_eq!(TestTokenClient::new(&env, &token).balance(&recipient), 100);
}

#[test]
fn refund_returns_unclaimed_to_depositor() {
    let (env, vault, depositor, recipient, _arbiter, token, _ms) = setup();
    fund_and_deposit(&env, &token, &depositor, &vault, 150);
    VaultContractClient::new(&env, &vault).claim_milestone(&0, &key_of(&env, 1));
    VaultContractClient::new(&env, &vault).refund();
    assert_eq!(TestTokenClient::new(&env, &token).balance(&recipient), 100);
    assert_eq!(TestTokenClient::new(&env, &token).balance(&depositor), 50);
}

#[test]
fn recover_after_deadline() {
    let (env, vault, depositor, _recipient, _arbiter, token, _ms) = setup();
    fund_and_deposit(&env, &token, &depositor, &vault, 150);
    env.ledger().set_sequence_number(env.ledger().sequence() + 1001);
    VaultContractClient::new(&env, &vault).recover();
    assert_eq!(TestTokenClient::new(&env, &token).balance(&depositor), 150);
}

#[test]
fn recover_before_deadline_rejected() {
    let (env, vault, depositor, _recipient, _arbiter, token, _ms) = setup();
    fund_and_deposit(&env, &token, &depositor, &vault, 150);
    let res = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        VaultContractClient::new(&env, &vault).recover();
    }));
    assert!(res.is_err());
}

#[test]
fn non_depositor_cannot_deposit() {
    let (env, vault, depositor, _recipient, _arbiter, token, _ms) = setup();
    TestTokenClient::new(&env, &token).mint(&depositor, &150);
    let attacker = Address::generate(&env);
    let res = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        VaultContractClient::new(&env, &vault).deposit(&attacker);
    }));
    assert!(res.is_err());
    assert_eq!(VaultContractClient::new(&env, &vault).balance(), 0);
}

#[test]
fn underfunded_deposit_then_topup() {
    let (env, vault, depositor, recipient, _arbiter, token, _ms) = setup();
    TestTokenClient::new(&env, &token).mint(&depositor, &50);
    let res = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        VaultContractClient::new(&env, &vault).deposit(&depositor);
    }));
    assert!(res.is_err());
    TestTokenClient::new(&env, &token).mint(&depositor, &100);
    VaultContractClient::new(&env, &vault).deposit(&depositor);
    VaultContractClient::new(&env, &vault).claim_milestone(&0, &key_of(&env, 1));
    assert_eq!(TestTokenClient::new(&env, &token).balance(&recipient), 100);
}