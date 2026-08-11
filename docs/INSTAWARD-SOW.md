# Stellar Forge — Instawards Statement of Work

| Field | Value |
|---|---|
| Project Name | Stellar Forge |
| Builder / Team Name | Richie Christian De Guzman |
| Primary Contact (Name + Email) | Richie Christian De Guzman, richiechristiandeguzman11@gmail.com |
| Ambassador Chapter | Philippines |
| Ambassador Chapter Lead | _(TBD)_ |
| Date Submitted | 2026-08-11 |
| Suggested Sprint Start Date | 2026-08-17 |
| Project Repository URL | https://github.com/rylsherdamz-rgb/stellar-forge |
| XLM Mainnet Wallet | GCJJ7WCTRWLR7YLOWZH6VGCYKZ62HG2N7US7AUQPT762GDN7HFA4Y7Q5 |

## 2. Instawards Overview & Intent

### 2.1 Instawards Purpose (for Builder Context)

Instawards are designed to support short, clearly scoped, execution-focused work that helps a project make tangible progress toward building on Stellar. Instawards are meant to fund specific, achievable outcomes that can be completed and demonstrated within 30 days or less.

This SOW represents a shared commitment between the Builder and the Ambassador Chapter Lead on what will be delivered, why it matters, and how success will be verified.

## 3. Problem Statement & Objective

### Problem Being Addressed

What specific problem, gap, or blocker is this Instaward intended to solve?

Developers building applications on Stellar rely on multiple documentation sources, SDKs, reference implementations, and supporting tools throughout the development process. AI coding assistants can accelerate software development, but they also depend on well-structured project context and developer guidance. Because Stellar development knowledge is distributed across multiple resources, developers and AI coding assistants often spend additional time locating documentation, configuring projects, and establishing consistent development workflows.

The Stellar Forge addresses this challenge by providing an open-source reference implementation that demonstrates a supported AI-assisted Stellar development workflow. Rather than introducing a new AI platform, the framework organizes existing Stellar development knowledge, reusable workflows, evaluation criteria, and project scaffolding into a single installable Skill with a companion CLI (`create-stellar-forge`). This enables developers to reproduce a consistent workflow for common Stellar development tasks while building on existing Stellar tooling.

### Objective of This Instaward

In one or two sentences, what will be true at the end of 30 days if this Instaward is successful?

Within 30 days, this Instaward will deliver and publish an open-source reference implementation of the Stellar Forge consisting of:

- An installable Skill for supported AI coding assistants (Claude Code).
- A companion CLI (`create-stellar-forge`) for installing the Skill and scaffolding a starter Stellar project.
- A reusable project template demonstrating required integration with Soroban and the Stellar SDK, with Wallets Kit and x402 included only as bounded reference examples if time permits.
- A bounded evaluation workflow for validating generated project components.
- Documentation and reproducible examples demonstrating the workflow on Stellar Testnet.

The objective of this sprint is to validate a practical, AI-assisted Stellar development workflow that developers can study, reproduce, and extend. It is not intended to deliver a production-ready AI development platform, hosted AI service, or autonomous software engineering system.

### 3.1 Key Outcome

At the end of this 30-day sprint, developers will be able to:

1. Install the Stellar Forge Skill into Claude Code.
2. Initialize a starter Stellar project using the companion CLI.
3. Generate or refine a Soroban smart contract.
4. Add Stellar SDK interaction.
5. Run local builds and tests.
6. Evaluate generated output against defined checks.
7. Deploy or invoke the reference project on Stellar Testnet.
8. Reproduce the complete workflow from clean documentation.

**MVP definition of the Skill:** The Stellar Forge Skill is a structured package of Stellar-specific instructions, supported workflow definitions, project conventions, evaluation checks, and development guidance loaded by Claude Code. In this MVP, "loading the Skill" means installing the Skill package and making its instructions available to Claude Code for the documented workflow.

The primary outcome of this Instaward is a reusable, open-source reference implementation that demonstrates a practical AI-assisted Stellar development workflow. The generated project serves as a demonstration of the framework's supported workflow, rather than a production-ready application or a general-purpose application generator.

### The Gap

Stellar provides documentation, SDKs, Wallets Kit, Soroban, x402, and reference implementations, but these resources are distributed across separate repositories and documentation sites.

Developers and AI coding assistants must repeatedly switch between these resources to understand how to build Stellar applications. This increases development time, duplicates context across development sessions, and produces inconsistent implementations.

The Stellar Forge addresses this by organizing these resources into a single Skill that provides a consistent workflow for developing Stellar applications. The Skill includes development workflows, evaluation criteria, project templates, and supporting documentation required for common Stellar development tasks.

### 3.2 Why the Stellar Forge is Different

The Stellar Forge is not intended to replace AI coding assistants or existing Stellar developer tools. Instead, it serves as an open-source reference implementation that demonstrates how existing Stellar technologies can be organized into a practical, AI-assisted development workflow.

The framework combines an installable Skill, a companion CLI, a starter project template, and a bounded evaluation workflow into a reusable developer toolkit. Rather than introducing new AI infrastructure or a hosted platform, it operationalizes existing Stellar resources — including Soroban and the Stellar SDK, with Wallets Kit and x402 treated as bounded reference examples — into a consistent workflow that developers can reproduce and extend.

The reference implementation demonstrates how:

- An installable Skill can provide structured context for common Stellar development tasks.
- A companion CLI can scaffold a starter Stellar project configured for AI-assisted development.
- Supported workflows can guide the generation and refinement of project components.
- A bounded evaluation workflow can validate generated outputs before they are accepted.
- Developers can reproduce the workflow and validate the resulting reference project on Stellar Testnet.

The project intentionally focuses on demonstrating these supported workflows within a 30-day MVP. It does not aim to provide autonomous software engineering, arbitrary full-stack application generation, hosted AI services, or a production-ready development platform.

By publishing the Skill, companion CLI, starter templates, documentation, evaluation workflow, and example projects under the MIT License, the Stellar Forge provides a reusable open-source foundation that future developers can study, extend, and adapt for their own Stellar applications.

### 3.3 Why Stellar & Ecosystem Impact

Stellar provides a mature ecosystem for building payment applications and smart contracts through technologies such as Soroban, the Stellar SDK, Wallets Kit, Stellar x402, and related developer tooling. While these resources are well documented, they are distributed across multiple repositories, examples, and documentation sources. This can make it more difficult for developers and AI coding assistants to establish a consistent development workflow.

The Stellar Forge builds on these existing technologies by providing an open-source reference implementation that demonstrates a supported AI-assisted development workflow. Rather than introducing new blockchain infrastructure or a hosted AI platform, the framework organizes existing Stellar tools into a reusable developer toolkit consisting of an installable Skill, companion CLI, starter project template, and bounded evaluation workflow.

#### Project Contributions to the Stellar Ecosystem

**Open-Source Developer Toolkit**
The project will publish the Stellar Forge Skill, companion CLI, starter project template, documentation, evaluation workflow, and example applications under the MIT License. These deliverables provide developers with a reusable reference implementation that can be studied, reproduced, and extended for future Stellar projects.

**Supported AI-Assisted Development Workflow**
The framework demonstrates a practical workflow that combines:

- Structured Stellar development knowledge.
- Project scaffolding through the companion CLI.
- Workflow routing for supported development tasks.
- Bounded evaluation of generated outputs.
- Validation using Stellar Testnet.

This workflow serves as a reproducible example of AI-assisted Stellar development rather than a production-ready automation platform.

**Starter Project Template**
The companion CLI demonstrates how developers can initialize a starter Stellar project with:

- Soroban smart contract example.
- Stellar SDK interaction.
- Automated local/Soroban tests.
- Documented Stellar Testnet action.
- Optional bounded Wallets Kit or x402 reference examples, only if the required core workflow is complete.
- Framework configuration and documentation.

The generated project is intended as a reference implementation that developers can customize and extend for their own applications.

**Documentation & Reproducibility**
Comprehensive documentation is a required deliverable of this Instaward. The project will include installation guides, architecture documentation, workflow documentation, setup instructions, evaluation procedures, and reproducible examples so that other developers can successfully install, validate, and extend the framework.

#### Stellar Technologies Demonstrated

The reference implementation demonstrates supported development workflows using:

- Soroban
- Stellar SDK
- Stellar Wallets Kit
- x402 reference workflows
- Soroban RPC
- Stellar Testnet

These technologies are organized into a practical development workflow rather than replaced or extended with new infrastructure. The primary outcome is an open-source reference implementation that helps developers adopt existing Stellar tooling more consistently.

### 3.4 Existing Approaches

AI coding assistants and project scaffolding tools have significantly improved developer productivity by assisting with code generation, project initialization, and documentation lookup. However, these tools are designed for general software development and do not provide a structured workflow tailored to the Stellar ecosystem. Developers still need to gather documentation, configure development environments, integrate Stellar SDKs, implement Soroban contracts, use the Stellar SDK, and reference optional technologies such as Wallets Kit and x402 across multiple sources.

The Stellar Forge complements these existing tools by providing an open-source reference implementation for AI-assisted Stellar development. Rather than replacing AI coding assistants, the framework supplies a reusable Skill, companion CLI, starter project template, and bounded evaluation workflow that organize existing Stellar development resources into a consistent, reproducible workflow.

| Platform | Primary Focus |
|---|---|
| Claude Code | AI-assisted software development using Skills and tool integrations. |
| Cursor | AI-assisted code editor with project context and agent workflows. |
| GitHub Copilot | AI-powered code completion and code generation. |
| create-next-app | Project scaffolding for Next.js applications. |
| **Stellar Forge** | Open-source reference implementation demonstrating supported AI-assisted Stellar development workflows through an installable Skill, companion CLI, starter project template, bounded evaluation workflow, and Stellar Testnet validation. |

Unlike general-purpose AI coding assistants or project generators, the Stellar Forge is not intended to automate the creation of arbitrary production applications. Instead, it demonstrates how existing Stellar technologies — including Soroban and the Stellar SDK, with Wallets Kit and x402 treated as bounded reference examples — can be organized into a reusable workflow that developers can study, reproduce, and extend.

The primary contribution of this project is a practical developer toolkit that validates supported AI-assisted Stellar development workflows on Stellar Testnet, providing the community with a reusable foundation for future ecosystem tooling rather than a production-ready AI platform.

### 3.5 Validation Scope

This Instaward validates a bounded, reproducible AI-assisted Stellar development workflow through an open-source reference implementation. The objective is to demonstrate how an installable Skill, companion CLI, starter project template, and evaluation workflow can support common Stellar development tasks using existing ecosystem tools.

The scope of this 30-day sprint is limited to validating the following workflow:

1. Install the Stellar Forge Skill.
2. Initialize a starter Stellar project using the companion CLI.
3. Load the Skill within a supported AI coding assistant.
4. Execute supported AI-assisted workflows for common Stellar development tasks.
5. Generate and refine the Soroban smart contract and Stellar SDK interaction used by the reference application.
6. Validate generated outputs using the framework's bounded evaluation workflow.
7. Build and verify the generated reference project on Stellar Testnet.
8. Publish the Skill, companion CLI, documentation, and example project under the MIT License.

This sprint does not develop a new AI coding assistant, language model, hosted AI service, autonomous software engineering system, or production deployment platform. Instead, it delivers a practical reference implementation that developers can install, reproduce, evaluate, and extend for their own Stellar projects.

#### Practical Use Cases

**Developer Reference** — Developers can use the published Skill, companion CLI, starter project template, documentation, and example applications as a reference for implementing AI-assisted Stellar development workflows. The project demonstrates how existing Stellar technologies can be organized into a consistent and reproducible development process.

**Project Scaffolding** — The companion CLI provides a reproducible starting point by generating a starter Stellar project that includes: Soroban smart contract, Stellar SDK interaction, automated local/Soroban tests, a documented Stellar Testnet action, optional bounded Wallets Kit or x402 reference examples (only if the core workflow is complete), and framework configuration/setup documentation. The generated project is intended as a starter template that developers can modify and extend according to their own application requirements.

**Supported AI-Assisted Development Workflows** — The framework demonstrates supported workflows for: Stellar project initialization, Soroban smart contract development, Stellar SDK interaction, local build and test execution, testnet deployment or invocation preparation, and evaluation/validation of generated outputs. These workflows demonstrate practical development patterns rather than fully autonomous application generation.

**Research & Education** — Because the project is released as open source (MIT), it can serve as a reference implementation for developers, educators, students, and researchers interested in AI-assisted software development within the Stellar ecosystem.

#### Open-Source Deliverables

All deliverables will be released under the MIT License, including: the Stellar Forge Skill, companion CLI, starter project template, evaluation workflow, documentation, installation guide, architecture documentation, and example applications. Documentation is a required deliverable to ensure that other developers can successfully install, reproduce, validate, and extend the framework.

#### Supported Components

| Component | Supported During This Sprint |
|---|---|
| AI Coding Assistant | Claude Code |
| Companion CLI | create-stellar-forge |
| Blockchain Network | Stellar Testnet |
| Smart Contracts | Soroban |
| Stellar Integration | Stellar SDK |
| Reference Application | Small Soroban + Stellar SDK application |
| Optional Examples | Wallets Kit and x402, bounded and non-blocking |

Support for additional AI coding assistants, IDE integrations, hosted services, production deployments, and non-Stellar ecosystems is explicitly out of scope for this Instaward.

#### Performance Targets

The MVP will successfully demonstrate that a developer can:

- Install the Stellar Forge Skill.
- Generate a starter Stellar project using the companion CLI.
- Execute supported AI-assisted development workflows.
- Generate and refine project components.
- Validate generated outputs using the framework's evaluation workflow.
- Successfully build and verify the reference project on Stellar Testnet.

The goal is to validate a supported development workflow, not to demonstrate autonomous software engineering or arbitrary full-stack application generation.

### 3.6 How It Works

The Stellar Forge is an open-source reference implementation that demonstrates a supported AI-assisted Stellar development workflow. Rather than functioning as an autonomous development platform, the framework organizes existing Stellar development resources into a reproducible workflow that developers can use, study, and extend.

The MVP validates how an installable Skill, companion CLI, starter project template, and bounded evaluation workflow work together to support common Stellar development tasks using existing ecosystem tools.

#### Reference Workflow

- **Step 1 – Install the Framework** — The developer installs the Stellar Forge Skill directly or through the companion CLI. The companion CLI can also initialize a starter Stellar project configured to demonstrate the framework's supported workflows.
- **Step 2 – Initialize a Starter Project** — The companion CLI scaffolds a reference project containing: Soroban smart contract, Stellar SDK interaction, automated tests, framework configuration, evaluation workflow, supporting documentation, and a documented Testnet action.
- **Step 3 – Load the Skill** — A supported AI coding assistant loads the Stellar Forge Skill, which provides structured Stellar development knowledge, framework configuration, supported development workflows, evaluation criteria, and development guidance.
- **Step 4 – Execute Supported Workflows** — The framework routes developer requests through supported workflows for common Stellar development tasks, including project initialization, Soroban smart contract development, Stellar SDK interaction, local build/test execution, and testnet deployment/invocation preparation.
- **Step 5 – Generate & Refine Project Components** — The framework assists the AI coding assistant in generating and refining project components (contracts, SDK interaction, configuration files, automated tests, documentation) using the provided Stellar context and workflow guidance.
- **Step 6 – Validate Generated Outputs** — Generated outputs are evaluated using the framework's bounded evaluation workflow. The evaluation process verifies that generated components satisfy predefined validation criteria before being accepted as part of the reference project.
- **Step 7 – Validate on Stellar Testnet** — The completed reference project is built and validated using Stellar Testnet, demonstrating successful interaction with Soroban, the Stellar SDK, Soroban RPC, and Stellar Testnet. This Testnet validation serves as the primary technical proof that the demonstrated workflow is reproducible.

#### Framework Components

| Component | Purpose |
|---|---|
| Stellar Forge Skill | Provides structured Stellar development knowledge, supported workflows, and evaluation guidance for AI coding assistants. |
| Companion CLI | Installs the Skill and scaffolds a starter Stellar project. |
| Starter Project Template | Demonstrates integration with Soroban and Stellar SDK, with Wallets Kit and x402 as bounded reference examples. |
| Evaluation Workflow | Validates generated outputs against predefined acceptance criteria. |
| Documentation | Enables developers to install, reproduce, understand, and extend the reference implementation. |

#### Framework Execution Model

The Stellar Forge does not execute blockchain transactions, replace AI coding assistants, or provide autonomous software engineering. Instead, it: organizes existing Stellar development knowledge; provides supported AI-assisted development workflows; scaffolds starter Stellar projects; evaluates generated outputs using bounded evaluation criteria; and demonstrates reproducible workflows validated on Stellar Testnet.

The generated project serves as a reference implementation demonstrating the framework's capabilities rather than a production-ready application.

#### Validation Scope

This Instaward validates one reproducible AI-assisted Stellar development workflow:

`Install the Skill → Initialize a starter project → Load the Skill into a supported AI coding assistant → Execute supported development workflows → Generate and refine project components → Validate outputs using the evaluation workflow → Build and verify the reference project on Stellar Testnet`

This workflow represents the primary deliverable of the 30-day sprint. The generated application is included solely as a demonstration of the framework's supported workflow and is not intended to represent a production-ready application or a general-purpose application generator.

### 3.7 Extensibility

The Stellar Forge is designed so its core framework does not need to change as it grows. Developers can extend the framework in bounded ways without modifying the Skill's core logic:

- Add a new supported workflow by defining a new workflow entry and evaluation checks alongside the existing supported workflow definitions.
- Modify the starter project template by editing the scaffolded project files the companion CLI generates, without altering the CLI's core installation logic.
- Extend the evaluation workflow by adding new validation checks to the existing pass/fail evaluation criteria.
- Add another Stellar integration (beyond Soroban and the Stellar SDK) as a bounded, optional reference example, following the same pattern used for Wallets Kit and x402.

These extension points keep the required Soroban + Stellar SDK workflow untouched while allowing the framework to grow through additive, documented changes.

## 4. Scope of Work (30-Day Deliverables)

### 4.1 In-Scope Deliverables

| Deliverable | Description (What will be built or produced?) | Why this matters |
|---|---|---|
| **Deliverable 1** | Design, implement, test, and publish the installable Stellar Forge Skill for Claude Code. The Skill will contain structured Stellar guidance, supported workflow definitions, project conventions, evaluation checks, and instructions for the documented MVP workflow. | Provides a reproducible AI-assisted Stellar development workflow without requiring a new AI platform or autonomous runtime. |
| **Deliverable 2** | Develop the create-stellar-forge CLI to install the Skill and scaffold one small reference application centered on Soroban and the Stellar SDK. The reference project will include tests and a documented Stellar Testnet deployment or invocation path. Wallets Kit and x402 may be added only as bounded, non-blocking examples. | Gives developers a concrete, copy-pasteable path from project initialization to local validation and Stellar Testnet proof. |
| **Deliverable 3** | Publish documentation, installation and clean-setup instructions, architecture/workflow documentation, evaluation procedures, reproducible examples, CI results, and the MIT-licensed public release. Documentation must explicitly cover: prerequisites, supported tool/language versions, required environment variables, CLI commands, Skill configuration steps, test commands, Stellar Testnet setup, expected outputs, and troubleshooting guidance. | Makes the workflow independently reproducible and provides durable evidence of completion. |

### Out-of-Scope (Explicitly Not Included)

This 30-day Instaward is limited to delivering and validating a reference implementation of the Stellar Forge. The following items are intentionally excluded from the scope of this sprint:

- Production deployment tooling
- Hosted AI services
- Autonomous software engineering
- Arbitrary full-stack application generation
- Enterprise-grade automation
- Mainnet deployment
- Development of new language models
- IDE or editor development
- Multi-blockchain support
- Commercial support services
- Marketplace or plugin ecosystem development
- Production monitoring and analytics
- Third-party security audits
- Autonomous transaction signing or credential custody
- Formal verification
- Production/Mainnet readiness claims

The generated project is intended solely as a reference implementation for demonstrating supported AI-assisted Stellar development workflows on Stellar Testnet. It is not intended to represent a production-ready application or a complete AI development platform.

### 4.2 Deliverable-Aligned Budget Request

**Requested Budget Amount: $5,000**

**Rationale for Budget Request:** This budget supports a focused 30-day engineering sprint to deliver an open-source reference implementation of the Stellar Forge. Funding covers the design, implementation, testing, documentation, and public release of an installable Skill, companion CLI, starter project template, bounded evaluation workflow, and Stellar Testnet validation.

The sprint also includes comprehensive documentation, reproducible examples, architecture documentation, automated testing, and an MIT-licensed open-source release to ensure that other developers can install, evaluate, reproduce, and extend the framework.

The requested funding supports engineering effort required to organize existing Stellar technologies — including Soroban and the Stellar SDK, with Wallets Kit and x402 treated as bounded reference examples — into a practical AI-assisted development workflow. It does not fund the development of hosted AI services, production deployment infrastructure, or autonomous software engineering capabilities.

#### Budget Breakdown ($5,000)

| Category | Amount |
|---|---|
| Labor (160 engineering hours) | $4,000 |
| Development infrastructure, CI/CD, documentation assets, demonstration materials, and contingency | $1,000 |
| **Total** | **$5,000** |

#### A.1 Basis of Estimate

| Parameter | Value |
|---|---|
| Sprint Duration | 30 days (4 weeks) |
| Engineering Hours | ~160 hours |
| Labor Budget | $4,000 |
| Estimated Blended Rate | ~$25/hour |
| Non-Labor Budget | $1,000 |
| Total Requested | $5,000 USD (paid in XLM) |

#### A.2 Cost by Deliverable (Labor — $4,000)

**Deliverable 1 — Stellar Forge Skill — $1,800 (72 hrs)**

| Work Package | Hrs | Cost |
|---|---|---|
| Design and implement the Stellar Forge Skill, and framework configuration | 28 | $700 |
| Implement specialized supported workflow definitions, Stellar development workflows, and evaluation workflows | 24 | $600 |
| Framework testing, CI integration, Skill validation, and technical documentation | 20 | $500 |
| **Subtotal** | **72** | **$1,800** |

**Deliverable 2 — Companion CLI & Project Template — $1,500 (60 hrs)**

| Work Package | Hrs | Cost |
|---|---|---|
| Develop companion CLI and Skill installation workflow | 20 | $500 |
| Implement starter project template demonstrating Stellar integrations | 24 | $600 |
| Integration testing, Testnet validation, and usability improvements | 16 | $400 |
| **Subtotal** | **60** | **$1,500** |

**Deliverable 3 — Documentation & Open-Source Release — $700 (28 hrs)**

| Work Package | Hrs | Cost |
|---|---|---|
| Prepare installation guide, architecture documentation, and developer documentation | 10 | $250 |
| Publish repository, starter project template, and reproducible examples | 8 | $200 |
| Final validation, demonstration materials, and MIT-licensed release | 10 | $250 |
| **Subtotal** | **28** | **$700** |

## 5. 30-Day Execution Plan & Timeline

### 5.1 Weekly Breakdown

| Week | Planned Work | Verifiable Acceptance Criteria |
|---|---|---|
| **Week 1 — Foundation** | Define the bounded MVP architecture; finalize the Claude Code Skill format and loading process; implement the initial CLI; create the starter/reference project; establish CI and test environment. | Week 1 outcome: CLI creates a valid starter repository; Skill installs and loads in Claude Code; repository structure, supported workflow list, and initial tests are present. |
| **Week 2 — Testnet Thin Slice** | Complete the required Soroban + Stellar SDK integration; implement the first end-to-end workflow; add local build/test checks; perform early Stellar Testnet deployment or invocation; implement initial evaluation checks. | Week 2 outcome: Starter project builds and tests successfully and reaches Stellar Testnet. A Testnet contract ID and/or transaction hash is captured. This early thin slice is the primary risk-reduction milestone. |
| **Week 3 — Evaluation & Reproducibility** | Expand measurable evaluation checks; refine the workflow based on Testnet results; complete clean-environment documentation; add copy-pasteable commands and expected outputs; document extension points. | Week 3 outcome: A new developer can reproduce the workflow from a clean setup using the documentation; evaluation produces clear pass/fail results for defined checks. The clean-environment reproduction will be performed on a fresh development environment using only the documented prerequisites and commands. |
| **Week 4 — Release Quality** | Fix remaining bugs; verify CI; polish Skill, CLI, and documentation; finalize Testnet evidence; tag the public release; prepare the demonstration and final report. | Week 4 outcome: Public MIT-licensed release is tagged and demonstrated, with CI results, automated test output, repository evidence, and Testnet proof available for review. |

#### Milestone Summary

| Week | Milestone | Outcome |
|---|---|---|
| Week 1 | Foundation | Claude Code Skill, CLI, starter project, CI, and initial tests are working. |
| Week 2 | Testnet Thin Slice | Soroban + Stellar SDK reference workflow builds, tests, and reaches Stellar Testnet with durable evidence. |
| Week 3 | Evaluation & Reproducibility | Measurable evaluation checks and clean-setup documentation allow another developer to reproduce the workflow. |
| Week 4 | Release | MIT-licensed public release is tagged, CI is verified, documentation is complete, and final Testnet evidence/demo are published. |

## 6. Evidence of Completion (Required)

### 6.1 Planned Evidence to Be Submitted

| Deliverable | Evidence Type (link, repo, demo, screenshot, doc, tx hash, etc.) | Description |
|---|---|---|
| Deliverable 1 | Public GitHub repository, Skill source code, framework architecture diagrams, evaluation workflows, automated test results | Evidence demonstrating implementation of the Stellar Forge Skill, supported workflow definitions, and evaluation workflows. Includes public source code, architecture documentation, and framework validation. |
| Deliverable 2 | Public GitHub repository, CLI package, generated project, screenshots, demonstration video | Evidence demonstrating successful Skill installation, project generation using the companion CLI, the generated Soroban contract and Stellar SDK interaction, automated test results, and successful validation on Stellar Testnet. |
| Deliverable 3 | MIT-licensed GitHub repository, documentation website, installation guide, architecture documentation, demonstration video | Evidence demonstrating that developers can install, configure, use, and extend the Stellar Forge using the published documentation, example projects, and setup instructions. |

### 6.2 Evidence Verification Checklist (For Ambassador Use)

For each deliverable, the Ambassador Chapter Lead will assess whether evidence is present and sufficient.

| Deliverable | Evidence Present | Evidence Partial | Evidence Missing | Comments |
|---|---|---|---|---|
| Deliverable 1 | ☐ | ☐ | ☐ | |
| Deliverable 2 | ☐ | ☐ | ☐ | |
| Deliverable 3 | ☐ | ☐ | ☐ | |

### 6.3 Success Metrics

The success of the Stellar Forge MVP will be measured by demonstrating a reproducible AI-assisted Stellar development workflow rather than the breadth of generated applications.

The project will be considered successful if the following objectives are achieved within the 30-day sprint.

| Objective | Success Metric |
|---|---|
| Installable Skill | The Stellar Forge Skill installs successfully and loads in Claude Code using documented steps. |
| Companion CLI | The CLI installs and initializes the documented starter/reference project. |
| Required Stellar Core | The reference project contains a working Soroban contract and Stellar SDK interaction. |
| Supported Workflow | The documented workflow completes project initialization → Soroban/SDK development → build/test → evaluation → Testnet validation. |
| Evaluation Workflow | Evaluation produces explicit pass/fail results for defined checks including project structure, dependencies/configuration, build, linting/formatting, automated tests, and Soroban contract tests. |
| Testnet Validation | The reference project produces durable Testnet evidence such as a contract ID and/or transaction hash plus explorer evidence. |
| Reproducibility | A clean-environment setup succeeds by following the published installation and workflow documentation. |
| Open-Source Release | The Skill, CLI, reference project, evaluation workflow, documentation, CI configuration, and release tag are publicly available under the MIT License. |

#### Acceptance Criteria

The MVP will be considered complete when a new developer can successfully:

1. Install the Stellar Forge Skill and load it into Claude Code using the published instructions.
2. Install and run the create-stellar-forge CLI.
3. Initialize the documented starter/reference project.
4. Use the supported workflow to create or refine a Soroban contract and Stellar SDK interaction.
5. Run the documented build, formatting/linting, unit, and Soroban contract tests successfully.
6. Run the evaluation workflow and receive explicit pass/fail results for the defined checks.
7. Deploy or invoke the reference project on Stellar Testnet and capture durable evidence such as a contract ID and/or transaction hash.
8. Reproduce the complete workflow from a clean environment using the published documentation.
9. Access the public MIT-licensed repository, CI results, release tag, commands, expected outputs, and Testnet evidence.

Acceptance does not require full Wallets Kit or x402 integration. If included, these are bounded reference examples and must not delay or replace the required Soroban + Stellar SDK workflow.

#### Evidence of Completion

Completion of the milestone will be demonstrated through:

- Public GitHub repository.
- MIT License.
- Tagged public release.
- Published Stellar Forge Skill and documented Claude Code loading procedure.
- Companion create-stellar-forge CLI.
- Starter/reference project containing Soroban + Stellar SDK integration.
- Automated build, lint/format, unit, and Soroban test output.
- Evaluation workflow output showing pass/fail checks.
- CI workflow logs or status badge.
- Copy-pasteable installation and execution commands.
- Commit hashes for the released code corresponding to each deliverable.
- Stellar Testnet contract ID and/or transaction hash with explorer evidence.
- Architecture and workflow documentation.
- Clean-environment reproduction guide.
- Demonstration video and final project report.

#### MVP Scope Reminder

This Instaward validates a bounded reference implementation of AI-assisted Stellar development. The project does not claim to deliver: production deployment tooling, hosted AI services, autonomous software engineering, arbitrary full-stack application generation, enterprise automation, or mainnet deployment. Instead, the deliverable is a practical, reusable, open-source developer toolkit that demonstrates supported AI-assisted Stellar development workflows using existing Stellar technologies.

## 7. Security Considerations

The Stellar Forge demonstrates a security-conscious reference architecture for AI-assisted Stellar development. Testnet validation does not constitute a security audit, formal verification, production-readiness assessment, or guarantee of application security. The framework does not execute blockchain transactions, manage user funds, or store wallet credentials. Instead, it provides a reusable Skill, evaluation workflows, and companion CLI for generating and validating Stellar applications.

The framework follows the principle of separating code generation from transaction authorization. Generated applications rely on existing Stellar tools, such as the Stellar SDK, Wallets Kit, and Soroban, for authentication and transaction signing. The framework itself does not store private keys, recovery phrases, API secrets, or other sensitive credentials.

### 7.1 Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Incorrect or incomplete generated code | Evaluation workflows validate generated outputs before a task is considered complete. Failed evaluations provide feedback for regeneration. |
| Incorrect task routing | The workflow layer routes development tasks using predefined supported workflow definitions and framework rules. |
| Framework configuration errors | Generated projects include standardized configuration files and documented setup procedures to reduce configuration inconsistencies. |
| Generated application build failures | The generated project is validated through automated build and integration testing before release. |
| Integration issues with Stellar tooling | The framework validates generated projects against supported Stellar components, including Soroban, the Stellar SDK, Soroban RPC, and the Stellar Testnet; Wallets Kit and x402 are optional bounded examples. |
| Documentation inconsistencies | Documentation, example projects, and generated templates are maintained together within the same repository to ensure they remain synchronized. |
| Dependency compatibility issues | The framework documents supported tool versions and validates generated projects using the specified development environment. |

### 7.2 Validation Controls

The project validates both successful and unsuccessful framework execution scenarios to demonstrate the correctness of the development workflow:

- Skill installation
- Companion CLI installation
- Project template generation
- Framework configuration
- Supported workflow execution
- Evaluation workflow execution
- Soroban smart contract generation
- Supported reference project generation
- Successful project build
- Stellar Testnet validation
- Invalid framework configuration detected
- Failed evaluation correctly reported
- Unsupported workflow handled correctly
- Build failures reported with diagnostic output

The results of these validation scenarios, including automated test results, CI workflows, generated example projects, and supporting documentation, will be published in the project's public repository.

## 8. Next-Step Alignment

### 8.1 Anticipated Next Step After Completion

After this Instaward, the most likely next step is:

- [x] Apply to SCF Build Award
- [ ] Continue development independently
- [ ] Apply for a follow-on Instaward (if eligible)
- [ ] Seek other ecosystem support
- [ ] Other:

## 9. Instawards Constraints Acknowledgement

By submitting this SOW, the Builder acknowledges:

- [x] This scope will be completed within 30 days or less.
- [x] Instawards support execution, not open-ended exploration.
- [x] A project may receive no more than two follow-on Instawards.
- [x] Each Instaward is capped at $5,000.
- [x] Total Instawards funding may not exceed $15,000.

## 10. Submission Confirmation

Once finalized, this Statement of Work will be submitted by the Ambassador Chapter Lead via the Instawards Airtable submission form for review and approval.