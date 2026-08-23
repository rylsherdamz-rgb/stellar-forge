---
name: smart-contracts
description: >
  Stellar smart contract development (Rust, soroban-sdk). Covers project setup,
  contract anatomy, storage/TTL, authorization, cross-contract calls, events,
  errors, upgrades, and comprehensive testing strategies.
version: 0.3.0
author: rylsherdamz-rgb
tags:
  - stellar
  - soroban
  - rust
  - smart-contracts
  - testing
  - wasm
---

# Smart Contracts (Soroban)

## Source Files

| File | Contents |
|------|----------|
| `contracts/hello-world/src/lib.rs` | Minimal contract scaffold |
| `contracts/hello-world/src/test.rs` | Unit + auth + event tests |
| `contracts/token/src/lib.rs` | Full SEP-41 token |
| `contracts/token/src/test.rs` | Token unit + integration tests |

---

## Testing Guide

### Setup

```rust
#![cfg(test)]
extern crate std;
use soroban_sdk::{
    testutils::{Address as _, Events},
    Address, Env, String, Symbol,
};
```

### Pattern 1: Unit Test with Setup Helper

Extract shared setup into a helper function:

```rust
fn setup() -> (Env, Address, Address, MyContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let contract_id = env.register(MyContract, (&admin, 1000u32));
    let client = MyContractClient::new(&env, &contract_id);
    (env, admin, user, client)
}

#[test]
fn test_initial_state() {
    let (_, _, _, client) = setup();
    assert_eq!(client.get_count(), 0);
}
```

### Pattern 2: Auth Testing (without mock_all_auths)

Test that only authorized callers can invoke privileged functions:

```rust
#[test]
fn test_auth_required() {
    let env = Env::default();
    // Do NOT call mock_all_auths() — test auth failures
    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);
    let contract_id = env.register(MyContract, (&admin,));
    let client = MyContractClient::new(&env, &contract_id);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.admin_only(&attacker); // attacker has no auth
    }));
    assert!(result.is_err());
}

#[test]
fn test_auth_passes() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(MyContract, (&admin,));
    let client = MyContractClient::new(&env, &contract_id);

    client.admin_only(&admin); // should not panic
}
```

### Pattern 3: Event Assertions

```rust
#[test]
fn test_events_emitted() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(MyContract, (&admin,));
    let client = MyContractClient::new(&env, &contract_id);

    client.do_thing();

    let events = env.events().all();
    assert!(!events.is_empty());

    let (event_contract, topics, data) = &events[0];
    assert_eq!(*event_contract, contract_id);
    // topics[0] is the event type symbol
    assert_eq!(topics.get(0).unwrap(), Symbol::new(&env, "DONE"));
}
```

### Pattern 4: Error / Panic Testing

```rust
#[test]
#[should_panic(expected = "HostError")]
fn test_rejects_invalid_input() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, client) = setup();

    client.try_v1(); // intentionally bad input
}
```

### Pattern 5: Contract Storage / TTL Testing

```rust
#[test]
fn test_storage_ttl() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _, client) = setup();

    let key = DataKey::Counter;
    let ttl = env.storage().instance().get_ttl(&key);
    assert!(ttl > 0);

    // Extend TTL
    client.touch();
    let new_ttl = env.storage().instance().get_ttl(&key);
    assert!(new_ttl >= ttl);
}
```

### Pattern 6: Cross-Contract Call Testing

```rust
#[test]
fn test_cross_contract() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    let token_id = env.register(Token, (&admin, String::from_str(&env, "TKN"), Symbol::new(&env, "TKN"), 7u32));
    let aggregator_id = env.register(Aggregator, (&admin,));
    let token = TokenClient::new(&env, &token_id);
    let aggregator = AggregatorClient::new(&env, &aggregator_id);

    token.mint(&admin, &1000);
    aggregator.deposit(&admin, &token_id, &500);

    assert_eq!(token.balance(&admin), 500);
    assert_eq!(token.balance(&aggregator_id), 500);
}
```

### Pattern 7: Snapshot / Rollback Testing

```rust
#[test]
fn test_rollback_on_failure() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, admin, client) = setup();
    let snapshot = env.clone();

    // Try an operation that should fail
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.fail_operation(&admin);
    }));

    // Restore snapshot and verify state unchanged
    let env = snapshot;
    // env.restore() is not a direct API, use the snapshot approach
}
```

---

## Build & Test Commands

```bash
# Build
cd contracts/my-contract
cargo build --release --target wasm32v1-none

# Run all tests
cargo test

# Run a specific test
cargo test test_transfer

# Run tests with output
cargo test -- --nocapture

# Check WASM size
wasm-strip target/wasm32v1-none/release/my_contract.wasm -o my_contract.optimized.wasm
ls -lh my_contract.optimized.wasm

# Manual deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/my_contract.wasm \
  --source-account deployer \
  --network testnet
```

### Tests Must Pass First — The Gate

Deployment is **gated on all tests passing**. If any test fails, the agent aborts and reports which tests failed. Only green tests → deploy.

```
cargo test  →  FAIL → fix & retry
           →  PASS → deploy
```

### Auto-Deploy (First Time)

**If no prior contract has been deployed on the target network**, the contracts agent auto-deploys without prompting. This is the first-deploy rule:

1. Agent checks `data/deployments/testnet.json`
2. If missing → first deploy → silent auto-deploy
3. If exists → ask user before deploying

### Record & Env Update

Every deploy must record the contract ID in two places:

```bash
# data/deployments/<network>.json — deployment tracker
{
  "network": "testnet",
  "deployer": "deployer",
  "contracts": [
    {
      "name": "my_contract",
      "contract_id": "CA...",
      "wasm_hash": "<sha256>",
      "deployed_at": "2026-07-29T12:00:00Z"
    }
  ]
}

# .env — for frontend/backend reference
NEXT_PUBLIC_MY_CONTRACT_CONTRACT_ID=CA...
```

### Helper Script

```bash
./scripts/deploy-contract.sh \
  target/wasm32v1-none/release/my_contract.wasm \
  my_contract \
  testnet
```

This script handles build check, deploy, tracker update, and `.env` update in one step.

---

## Strict Rules

1. Always run `cargo test` before deploying
2. Test auth failures explicitly — do not rely on `mock_all_auths()` alone
3. Test both happy path and error paths
4. Verify events are emitted with correct topics and data
5. Check TTL extension on persistent storage writes
6. Never deploy with failing tests — deploy is gated on `cargo test` passing 100%
7. Always record deployed contract IDs in `data/deployments/<network>.json` and `.env`
8. First deployment on a network auto-deploys (no prior deploy file found)
9. Run `cargo test` before `cargo build --release` to fail fast on test failures
