# Instawards Statement of Work — Stellar Forge

## 1. Project & Team Information

| Field | Value |
|---|---|
| Project Name | Stellar Forge |
| Builder / Team Name | Richie Christian De Guzman |
| Primary Contact | Richie Christian De Guzman, richiechristiandeguzman11@gmail.com |
| Ambassador Chapter | Philippines |
| Ambassador Chapter Lead | — |
| Date Submitted | — |
| Suggested Sprint Start Date | — |
| Project Repository URL | https://github.com/rylsherdamz-rgb/stellar-forge |
| XLM Mainnet Wallet | GCJJ7WCTRWLR7YLOWZH6VGCYKZ62HG2N7US7AUQPT762GDN7HFA4Y7Q5 |

## 2. Instawards Overview & Intent

### 2.1 Instawards Purpose (for Builder Context)

Instawards are designed to support short, clearly scoped, execution-focused work that helps a project make tangible progress toward building on Stellar. Instawards are meant to fund specific, achievable outcomes that can be completed and demonstrated within 30 days or less.

This SOW represents a shared commitment between the Builder and the Ambassador Chapter Lead on what will be delivered, why it matters, and how success will be verified.

## 3. Problem Statement & Objective

### Problem Being Addressed

Software teams need a reliable way to fund small development tasks. Existing bounty platforms separate work verification from payment, so developers cannot confirm that rewards are funded and project owners cannot enforce release conditions. Stellar Forge solves this with a Soroban escrow contract: the reward is funded before work begins, a GitHub Pull Request provides proof of work, and the contract controls release or refund.

### Objective of This Instaward

Within 30 days, Stellar Forge will publish an open-source Soroban bounty escrow reference implementation with:

- A Soroban escrow smart contract implementing the core bounty lifecycle: create, fund, claim, submit, approve/release, cancel, and refund.
- A minimal web application with Stellar wallet connection that lets a project owner create and fund a bounty, and lets a developer browse, claim, and submit proof of completed work.
- A lightweight backend/metadata layer that stores bounty descriptions and submission records and links them to on-chain contract state.
- Documentation and a reproducible example demonstrating the complete bounty lifecycle validated on Stellar Testnet, using XLM as the required settlement asset.

The sprint validates one reproducible Stellar Testnet bounty workflow. It does not deliver a production marketplace, hosted payment platform, or dispute-resolution system.

### 3.1 Key Outcome

At the end of this 30-day sprint, a project owner and a developer will be able to:

- Connect a Stellar wallet to the Stellar Forge web application.
- Create a bounty with a title, description, requirements, acceptance criteria, and reward amount.
- Deposit the reward (XLM) into the Soroban escrow contract, funding the bounty on-chain.
- Browse publicly listed, funded bounties.
- Claim an open bounty as a developer.
- Submit a GitHub Pull Request URL as proof of completed work.
- Approve a submission as the project owner and trigger release of the escrowed reward via the Soroban contract.
- Capture the resulting Stellar Testnet transaction as durable proof of settlement.
- Reproduce the complete bounty lifecycle from clean documentation.

**Escrow definition & State Machine:** The Soroban contract holds the reward and enforces the bounty lifecycle: `OPEN → FUNDED → CLAIMED → SUBMITTED → APPROVED → RELEASED`. It also includes cancellation paths (`FUNDED → CANCELLED/EXPIRED → REFUNDED`) and deadline rules for claimed bounties. The creator may cancel a funded bounty before it is claimed; once claimed, cancellation is only permitted according to the contract's documented expiry rules. The frontend and backend cannot release funds.

### The Gap

Existing platforms separate payment from work verification. Stellar Forge closes that gap by holding the reward in a Soroban contract, using a GitHub Pull Request as proof of work, and recording settlement on Stellar Testnet.

### 3.2 Why Stellar Forge Is Different

Unlike platforms where a reward promise is only a database entry, Stellar Forge deposits the reward into a Soroban contract before a developer starts work. The contract — not the frontend, not the backend database — decides whether funds can be released, refunded, or remain locked. This reference implementation demonstrates how:

- A Soroban contract can hold a software bounty reward in escrow and enforce valid state transitions.
- A minimal web application can provide bounty creation, browsing, claiming, and submission without taking custody of funds.
- GitHub can serve as a lightweight, verifiable proof-of-work interface for a claimed bounty.
- A project owner's wallet-signed approval, validated by the contract, is the only path to releasing escrowed funds.
- Developers can reproduce the full bounty lifecycle and validate it on Stellar Testnet.

The 30-day MVP excludes dispute arbitration, reputation systems, and AI-controlled fund decisions. The MIT-licensed contract, web application, documentation, and Testnet example will provide a reusable foundation for bounty, grant, and milestone-payment applications.

### 3.3 Why Stellar & Ecosystem Impact

Stellar provides fast, low-cost settlement, while Soroban enforces escrow rules without a centralized custodian — an effective fit for small, cross-border software bounties. Stellar Forge combines Soroban, the Stellar SDK, and Stellar Wallets Kit in a reproducible Testnet workflow for funding, claiming, and settling bounties.

**Stellar Technologies Demonstrated:** Soroban, Stellar SDK, Stellar Wallets Kit, Soroban RPC, Stellar Testnet.

### 3.4 Existing Approaches

| Platform | Primary Focus |
|---|---|
| Upwork / Fiverr | Centralized freelance marketplace; platform holds and controls payment; high fees; not crypto-native. |
| GitHub Sponsors | Recurring or one-off sponsorship; no task-scoped escrow or proof-of-work verification. |
| Gitcoin / BountySource-style | Bounty listing with crypto rewards, typically on other chains, without a bounded, reproducible escrow reference implementation on Stellar. |
| Manual multisig escrow | Enforceable on-chain, but not integrated into any bounty marketplace UI or GitHub-based proof-of-work flow. |
| Stellar Forge | Open-source reference implementation pairing a Soroban escrow contract with a minimal bounty marketplace UI and GitHub-based proof-of-work, validated on Stellar Testnet. |

### 3.5 Validation Scope

This Instaward validates one reproducible software-bounty lifecycle using a Soroban contract, a minimal web application, and a GitHub Pull Request as proof of work:

1. Connect a Stellar wallet to the web application.
2. Create a bounty and deposit the reward (XLM) into the Soroban escrow contract.
3. Publish the bounty and browse open bounties.
4. Claim an open bounty as a developer.
5. Submit a GitHub Pull Request URL as proof of completed work.
6. Review and approve the submission as the project owner.
7. Release the escrowed reward via the Soroban contract and capture Testnet evidence.
8. Validate the refund/expiry path for an unclaimed or cancelled bounty.
9. Publish the contract, web application, documentation, and example under the MIT License.

This sprint does not build dispute arbitration, a reputation system, notifications, an AI bounty assistant, multi-reviewer support, a platform fee mechanism, or a production deployment.

### 3.6 How It Works — Reference Workflow

1. **Connect Wallet** — connect a Stellar wallet via Stellar Wallets Kit. No private keys, seed phrases, or secrets are requested or stored.
2. **Create & Fund** — the owner enters title/description/requirements/acceptance criteria/reward, then signs a transaction depositing the reward (XLM) into the Soroban escrow contract. On-chain storage is limited to state, IDs, balances, and deadlines; detailed metadata remains off-chain.
3. **Publish & Browse** — funded bounties appear on the public listing with verified escrow status.
4. **Claim** — a developer claims an open bounty; the contract prevents double-claims.
5. **Submit Proof of Work** — the developer submits a GitHub Pull Request URL; the submission is recorded and linked to the bounty.
6. **Review & Approve** — the owner signs an approval; the contract validates state and authorization.
7. **Settle on Testnet** — on approval, the contract releases the reward to the developer; the transaction hash is durable proof.
8. **Refund / Expiry** — unclaimed or cancelled bounties can be refunded to the creator through the contract.

**Framework Execution Model:** The Soroban contract is the only custodian of funds. State machine: `OPEN → FUNDED → CLAIMED → SUBMITTED → APPROVED → RELEASED`, with fallback `FUNDED → CANCELLED/EXPIRED → REFUNDED`.

### 3.7 Extensibility

- Milestone-based bounties via additional partial-release states.
- A second reviewer role by extending the approval check beyond a single creator address.
- Reputation/rating as an off-chain additive layer.
- New proof-of-work integrations following the PR-URL submission-record pattern.
- Additional assets (e.g., USDC) using the same asset-verification pattern already used for XLM.

## 4. Scope of Work (30-Day Deliverables)

### 4.1 In-Scope Deliverables

| Deliverable | Description | Why this matters |
|---|---|---|
| Deliverable 1 | Build, test, publish, and deploy the Soroban escrow contract on Stellar Testnet: create, fund, claim, submit, approve/release, cancel, refund, with tests for authorization, state transitions, double claims, and expiry. | A reproducible, contract-enforced escrow core independent of the frontend, backend, or operator. |
| Deliverable 2 | Build the web application with wallet connection, bounty creation and funding, public listings, claim and submission flows, creator approval, Soroban integration, and a lightweight metadata database. | A concrete path from bounty creation to funded, claimed, submitted, and settled work with Testnet proof. |
| Deliverable 3 | Publish the MIT-licensed project with installation, architecture, contract, environment-variable, deployment, setup, troubleshooting, and reproducible Testnet documentation. | Makes the escrow workflow independently reproducible with durable evidence. |

### Out-of-Scope

Dispute arbitration; reputation/rating; notifications; AI bounty-generation/analysis; multi-reviewer or org/DAO accounts; platform fee; non-XLM assets (XLM is sole settlement asset); GitHub merge-status auto-release; milestone/partial-release bounties; analytics dashboard; Mainnet deployment; production hosting/monitoring/scaling; third-party audits; autonomous signing/custody; multi-chain support.

### 4.2 Budget Request — $5,000

| Category | Amount |
|---|---|
| Labor (160 engineering hours) | $4,000 |
| Hosting/Infra ($250), CI/CD ($150), Docs/demo assets ($200), Testing/tooling ($150), Contingency ($250) | $1,000 |
| **Total** | **$5,000** (paid in XLM) |

**Basis of Estimate:** 30 days / ~160 hours / ~$25/hour blended.

**Cost by Deliverable (Labor $4,000):**
- Deliverable 1 — Soroban Escrow Contract — $1,600 (64 hrs)
- Deliverable 2 — Web App, Wallet & GitHub Integration — $1,800 (72 hrs)
- Deliverable 3 — Documentation & Open-Source Release — $600 (24 hrs)

## 5. 30-Day Execution Plan & Timeline

| Week | Planned Work | Verifiable Acceptance Criteria |
|---|---|---|
| Week 1 — Foundation | Design state machine + contract architecture; implement create/claim/submit/approve/cancel with unit tests; scaffold Next.js app; wallet connect + metadata schema. | Contract compiles and unit tests pass; wallet connects; list/detail pages scaffolded. |
| Week 2 — Testnet Thin Slice | Deploy to Testnet; wire frontend for wallet-signed deposits; end-to-end create-and-fund; claim + PR submission capture. | A bounty can be created, funded on Testnet, claimed, and a submission recorded, with a captured contract ID/tx hash. |
| Week 3 — Evaluation & Reproducibility | Approve/release end to end with Testnet evidence; refund/expiry/cancel path; edge-case tests (double-claim, unauthorized approval, insufficient funds); clean-env docs. | A new developer can reproduce the full lifecycle — including release and refund — from a clean setup. |
| Week 4 — Release Quality | Fix bugs; verify CI; polish pages/contract/docs; finalize Testnet evidence; tag release; demo + final report. | MIT-licensed public release tagged and demonstrated with test output, repo evidence, and Testnet proof. |

## 6. Evidence of Completion

| Deliverable | Evidence Type | Description |
|---|---|---|
| Deliverable 1 | Public repo, contract source, unit test output, Testnet contract ID | Soroban escrow contract, state machine, authorization, and refund/expiry logic. |
| Deliverable 2 | Public repo, web app source, screenshots, demo video, Testnet tx hashes | Wallet connection, create/fund, claim, PR submission, approval, and release on Testnet. |
| Deliverable 3 | MIT-licensed repo, docs, install guide, architecture docs, demo video | Developers can install, configure, use, and extend Stellar Forge from published docs. |

### 6.3 Success Metrics

| Objective | Success Metric |
|---|---|
| Escrow Contract | Contract correctly creates, funds, claims, approves/releases, cancels, and refunds per its documented state machine. |
| Wallet Integration | A user can connect a Stellar wallet and sign deposit, claim, and approval transactions. |
| Bounty Creation & Funding | An owner can create a bounty and deposit the reward into escrow on Testnet. |
| Claim & Submission | A developer can claim a bounty and submit a GitHub PR URL as proof of work. |
| Approval & Release | An owner can approve and the contract releases the reward to the developer. |
| Refund Path | An unclaimed or cancelled bounty can be refunded to the creator. |
| Reproducibility | A clean-environment setup succeeds by following the published docs. |
| Open-Source Release | Contract, web app, docs, and release tag are public under MIT. |

## 7. Security Considerations

Stellar Forge uses the Soroban contract as the source of truth for escrow. Only an authorized, wallet-signed transaction can release, refund, or cancel a bounty. The application does not store private keys or seed phrases. Testnet validation is not a security audit or production-readiness assessment.

### 7.1 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Fake or unfunded bounty | Bounties listed as open only after the deposit is confirmed on-chain; UI shows verified escrow status. |
| Fake GitHub submission | The PR URL is recorded and can be checked against the bounty's declared repository before approval. |
| Unauthorized payment release | The contract validates that only the authorized creator's signed transaction can trigger release. |
| Frontend manipulation | The frontend is never trusted; the contract is the sole source of truth. |
| Double-claiming | The contract enforces a single valid claim per bounty. |
| Creator disappears | Deadline + refund/expiry rules return eligible funds. |
| Developer abandons work | Expiry handling + creator-initiated cancellation recover the bounty. |
| Database/metadata compromise | Financial state stays on-chain and is verifiable via Testnet tx hashes. |
| Dependency/environment inconsistency | Documented tool versions and validated setup. |

### 7.2 Validation Controls

Wallet connection · contract deployment · creation and deposit · listing/detail retrieval · claim · rejected double-claim · PR submission capture · approval and release · rejected unauthorized approval · refund/expiry path · rejected insufficient-funds/invalid-state transitions · build and integration test success.

## 8. Next-Step Alignment

- ☐ Apply to SCF Build Award
- ☐ Continue development independently
- ☐ Apply for a follow-on Instaward (if eligible)
- ☐ Seek other ecosystem support

## 9. Instawards Constraints Acknowledgement

- ☐ This scope will be completed within 30 days or less.
- ☐ Instawards support execution, not open-ended exploration.
- ☐ A project may receive no more than two follow-on Instawards.
- ☐ Each Instaward is capped at $5,000.
- ☐ Total Instawards funding may not exceed $15,000.

## 10. Submission Confirmation

Once finalized, this Statement of Work will be submitted by the Ambassador Chapter Lead via the Instawards Airtable submission form for review and approval.
