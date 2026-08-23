#![cfg(test)]
extern crate std;
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    Address, Env, Symbol, IntoVal,
};

fn setup() -> (Env, Address, HelloWorldClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(HelloWorld, (&admin,));
    let client = HelloWorldClient::new(&env, &contract_id);
    (env, admin, client)
}

#[test]
fn test_initial_state() {
    let (_, _, client) = setup();
    assert_eq!(client.get_count(), 0);
}

#[test]
fn test_increment() {
    let (_, _, client) = setup();
    let result = client.increment();
    assert_eq!(result, Ok(1));
    assert_eq!(client.get_count(), 1);
}

#[test]
fn test_increment_multiple() {
    let (_, _, client) = setup();
    assert_eq!(client.increment(), Ok(1));
    assert_eq!(client.increment(), Ok(2));
    assert_eq!(client.increment(), Ok(3));
    assert_eq!(client.get_count(), 3);
}

#[test]
fn test_increment_auth_required() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(HelloWorld, (&admin,));
    let client = HelloWorldClient::new(&env, &contract_id);
    // No mock_all_auths — admin requires real auth
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.increment();
    }));
    assert!(result.is_err());
}

#[test]
fn test_storage_ttl_extended_on_write() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(HelloWorld, (&admin,));
    let client = HelloWorldClient::new(&env, &contract_id);

    let ttl_before = env.storage().instance().get_ttl(&DataKey::Counter);
    assert_eq!(client.increment(), Ok(1));
    let ttl_after = env.storage().instance().get_ttl(&DataKey::Counter);
    assert!(ttl_after >= ttl_before);
}

#[test]
fn test_events_emitted() {
    let (env, _, client) = setup();
    client.increment();

    let events = env.events().all();
    assert!(!events.is_empty());

    let (_, topics, _data) = &events[0];
    assert_eq!(topics.get(0).unwrap(), Symbol::new(&env, "Incremented"));
}
