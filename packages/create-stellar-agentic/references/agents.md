# Specialist Agent Registry

6 specialist agents, each with loaded skills and Memory Scope.

| Agent | Role | Skills Loaded | Memory |
|-------|------|--------------|--------|
| `@stellar-contracts` | Build & test Rust smart contracts | smart-contracts, assets, zk-proofs | Read evals/ + data/, write project/contracts/, append to data/logs/ |
| `@stellar-frontend` | Build Next.js dApp frontend | dapp, data, frontend-design | Read evals/ + data/ + templates/frontend/, write project/frontend/ |
| `@stellar-backend` | Build API servers & indexers | data, agentic-payments | Read evals/ + data/, write project/backend/ |
| `@stellar-payments` | Configure x402/MPP payment flows | agentic-payments, assets | Read evals/ + data/ + templates/backend/, write project/backend/ |
| `@stellar-ops` | DevOps, CI/CD, deployment | (none) | Read evals/, write .github/ + project/ops/ |
| `@stellar-zk` | Zero-knowledge integration | zk-proofs | Read evals/ + data/, write project/zk/ |
