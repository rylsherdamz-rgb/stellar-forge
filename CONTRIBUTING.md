# Contributing

## Branch Model

```
dev  ──PR──▶  staging  ──PR──▶  master
```

| Branch | Direct pushes | Purpose |
|--------|--------------|---------|
| `dev` | ✅ allowed | Active development. Commit often, push freely. |
| `staging` | ❌ PRs only | Integration testing. CI must pass before merge. |
| `master` | ❌ PRs only, admin-enforced | Production. Never push directly. |

**Never push directly to `master`.** Branch protection enforces this even for
admins; all changes arrive via pull request.

## Required Checks (staging + master)

PRs cannot merge until these CI jobs pass:

- **Validate Framework** — skills/agents/evals/CLI packaging integrity (`scripts/validate.mjs`)
- **Node Tests** — gateway unit tests + framework suite
- **CLI Package Smoke Test** — packs the CLI tarball, installs it globally,
  scaffolds a project, asserts every README claim exists on disk
- **Contract Template Tests** — `cargo test` matrix over hello-world/token/vault (master only)

## Release Flow

1. Land changes on `dev`, open PR → `staging`, verify.
2. PR `staging` → `master`.
3. Tag on `master`: `git tag v<semver> && git push origin v<semver>`.
4. `publish-npm.yml` verifies tag == package version and publishes;
   `deploy-site.yml` deploys the site.

## Local Validation

```bash
node scripts/validate.mjs   # what CI checks
npm test                    # framework suite
npm test -w forge-gateway   # gateway units
cd templates/contracts/token && cargo test
```
