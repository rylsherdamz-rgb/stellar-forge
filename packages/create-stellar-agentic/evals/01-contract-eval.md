[CAPABILITY EVAL: stellar-contracts]
Task: Build a Stellar smart contract in Rust (soroban-sdk) that compiles, passes tests, and follows security best practices.
Success Criteria:
  - [ ] Contract compiles with `cargo build --release --target wasm32v1-none`
  - [ ] All unit tests pass with `cargo test`
  - [ ] Contract size under 128KB (check with `ls -la target/wasm32v1-none/release/*.wasm`)
  - [ ] `#![no_std]` declared at lib.rs top
  - [ ] Constructor uses `__constructor` (not `initialize`)
  - [ ] Auth required via `require_auth()` on all privileged functions
  - [ ] Storage keys use `#[contracttype]` enum (no raw strings)
  - [ ] TTL extended on writes via `extend_ttl()`
  - [ ] Events emitted via `#[contractevent]` for state changes
  - [ ] Error types use `#[contracterror]` with `#[repr(u32)]`
  - [ ] Release profile has `opt-level = "z"`, `overflow-checks = true`, `lto = true`
  - [ ] No `std` macro usage (println, assert, etc.)
  - [ ] No `instance()` storage for per-user data (uses `persistent()`)
Expected Output: A contracts/ directory with valid soroban-sdk contract(s), Cargo.toml, lib.rs, test.rs, and passing test suite.

[REGRESSION EVAL: contract-security]
Baseline: soroban-sdk security best practices
Tests:
  - missing-auth: PASS/FAIL — every privileged path must call require_auth()
  - storage-collision: PASS/FAIL — no raw string keys, all typed enums
  - overflow-check: PASS/FAIL — overflow-checks=true in release profile
  - reinit-guard: PASS/FAIL — constructor pattern used, no double-initialize
  - ttl-management: PASS/FAIL — TTL extended on every write
  - deploy-gate: PASS/FAIL — deploy only runs after all tests pass
  - deploy-record: PASS/FAIL — contract ID recorded in data/deployments/ and .env
  - auto-deploy: PASS/FAIL — first deploy on network auto-deployed, subsequent asks
Result: X/Y passed
