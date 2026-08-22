#![cfg(test)]
extern crate std;
use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env, String, Symbol,
};

fn setup() -> (Env, Address, Address, Address, TokenClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(
        Token,
        (
            admin.clone(),
            String::from_str(&env, "MyToken"),
            Symbol::new(&env, "MTK"),
            7u32,
        ),
    );
    let client = TokenClient::new(&env, &contract_id);
    (env, admin, user, recipient, client)
}

fn setup_with_spender() -> (Env, Address, Address, Address, Address, TokenClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let spender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let contract_id = env.register(
        Token,
        (
            admin.clone(),
            String::from_str(&env, "MyToken"),
            Symbol::new(&env, "MTK"),
            7u32,
        ),
    );
    let client = TokenClient::new(&env, &contract_id);
    (env, admin, user, spender, recipient, client)
}

#[test]
fn test_metadata() {
    let (env, _, _, _, client) = setup();
    assert_eq!(client.name(), String::from_str(&env, "MyToken"));
    assert_eq!(client.symbol(), Symbol::new(&env, "MTK"));
    assert_eq!(client.decimals(), 7);
}

#[test]
fn test_balance_defaults_to_zero() {
    let (_, _, user, _, client) = setup();
    assert_eq!(client.balance(&user), 0i128);
}

#[test]
fn test_total_supply_initial() {
    let (_, _, _, _, client) = setup();
    assert_eq!(client.total_supply(), 0i128);
}

#[test]
fn test_mint() {
    let (_, _, user, _, client) = setup();
    client.mint(&user, &1000i128);
    assert_eq!(client.balance(&user), 1000i128);
    assert_eq!(client.total_supply(), 1000i128);
}

#[test]
fn test_mint_multiple_recipients() {
    let (_, _, user, recipient, client) = setup();
    client.mint(&user, &500i128);
    client.mint(&recipient, &500i128);
    assert_eq!(client.balance(&user), 500i128);
    assert_eq!(client.balance(&recipient), 500i128);
    assert_eq!(client.total_supply(), 1000i128);
}

#[test]
fn test_mint_invalid_amount_rejected() {
    let (_, _, user, _, client) = setup();
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.mint(&user, &0i128);
    }));
    assert!(result.is_err());
}

#[test]
fn test_mint_auth_required() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(
        Token,
        (
            admin.clone(),
            String::from_str(&env, "MyToken"),
            Symbol::new(&env, "MTK"),
            7u32,
        ),
    );
    let client = TokenClient::new(&env, &contract_id);
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.mint(&user, &100i128);
    }));
    assert!(result.is_err());
}

#[test]
fn test_transfer() {
    let (_, _, user, recipient, client) = setup();
    client.mint(&user, &1000i128);
    client.transfer(&user, &recipient, &300i128);
    assert_eq!(client.balance(&user), 700i128);
    assert_eq!(client.balance(&recipient), 300i128);
}

#[test]
fn test_transfer_insufficient_balance() {
    let (_, _, user, recipient, client) = setup();
    client.mint(&user, &50i128);
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.transfer(&user, &recipient, &100i128);
    }));
    assert!(result.is_err());
}

#[test]
fn test_approve() {
    let (_, _, user, spender, _, client) = setup_with_spender();
    client.approve(&user, &spender, &500i128);
    assert_eq!(client.allowance(&user, &spender), 500i128);
}

#[test]
fn test_transfer_from() {
    let (_, _, user, spender, recipient, client) = setup_with_spender();
    client.mint(&user, &1000i128);
    client.approve(&user, &spender, &500i128);
    client.transfer_from(&spender, &user, &recipient, &300i128);
    assert_eq!(client.balance(&user), 700i128);
    assert_eq!(client.balance(&recipient), 300i128);
    assert_eq!(client.allowance(&user, &spender), 200i128);
}

#[test]
fn test_burn() {
    let (_, admin, _, _, client) = setup();
    client.mint(&admin, &500i128);
    client.burn(&admin, &200i128);
    assert_eq!(client.balance(&admin), 300i128);
    assert_eq!(client.total_supply(), 300i128);
}

#[test]
fn test_burn_insufficient_balance() {
    let (_, _, user, _, client) = setup();
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.burn(&user, &100i128);
    }));
    assert!(result.is_err());
}
