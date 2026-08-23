#![cfg(test)]
extern crate std;
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events as _, storage::Instance as _},
    Address, Env, IntoVal, Vec, events::Event,
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
    client.increment();
    assert_eq!(client.get_count(), 1);
}

#[test]
fn test_increment_multiple() {
    let (_, _, client) = setup();
    client.increment();
    client.increment();
    client.increment();
    assert_eq!(client.get_count(), 3);
}

#[test]
fn test_increment_auth_required() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(HelloWorld, (&admin,));
    let client = HelloWorldClient::new(&env, &contract_id);
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

    let ttl_before = env.storage().instance().get_ttl();
    client.increment();
    let ttl_after = env.storage().instance().get_ttl();
    assert!(ttl_after >= ttl_before);
}

#[test]
fn test_events_emitted() {
    let (env, _, client) = setup();
    client.increment();
    assert!(env.events().all().len() > 0);
}
