## Description

Describe the change and which issue it fixes. Include motivation and context.

Closes # (issue)

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Components Affected

- [ ] Contract: `contracts/bounty-escrow/*`
- [ ] GitHub verification: `packages/github/*`
- [ ] Wallet / Stellar client: `packages/stellar/*`
- [ ] Web app: `apps/web/*` or `site/*`
- [ ] Docs: `README.md`, `SPEC.md`, `SECURITY.md`

## Verification

- [ ] `cargo test --manifest-path contracts/bounty-escrow/Cargo.toml` passes (for contract changes)
- [ ] `npm test` passes (for package changes)
- [ ] The frontend never moves funds — only the contract does
- [ ] No hardcoded secrets or private keys

## How Has This Been Tested?

Describe the tests you ran.

## Additional Context
