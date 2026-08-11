# Contributing

Thanks for your interest in the Stellar Agentic Framework. This document covers how to contribute effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Adding an Agent](#adding-an-agent)
- [Adding an Eval](#adding-an-eval)
- [Modifying Templates](#modifying-templates)
- [Adding a Skill](#adding-a-skill)
- [CLI Changes](#cli-changes)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive.

## Getting Started

```bash
git clone https://github.com/rylsherdamz-rgb/stellar-forge.git
cd stellar-forge
npm install
```

Install the skill locally to test:

```bash
npx skills add ./ -g --agent claude-code
```

## Development Workflow

```
1. Pick an issue or propose a feature
2. Create a branch: feat/my-change or fix/my-change
3. Make your changes
4. Run validation: npm run validate
5. Test with a scaffold: npx create-stellar-agentic test-$(whoami) --yes
6. Open a pull request
```

### Validation

```bash
npm run validate
```

Checks:
- SKILL.md frontmatter (name, version, description, tags)
- skill.json validity
- marketplace.json existence
- All agent files parse correctly
- No duplicate agent names

### Test a Scaffold

```bash
npx create-stellar-agentic test-my-feature --yes --no-install
```

## Adding an Agent

1. Create `agents/<name>.md` with frontmatter and sections:
   - Role description
   - Workflow (numbered steps)
   - Checklist
   - Memory Scope (read/write/append paths)

2. Register in `CLAUDE.md` — add to the Agent Registry table

3. Add trigger keywords to the kernel's keyword routing

4. Optionally create an eval in `evals/`

```markdown
---
name: stellar-myagent
role: Description of what this agent handles
trigger: keyword1, keyword2
skills: [skill-a, skill-b]
---

# @stellar-myagent

## Workflow
1. Read intent from kernel
2. ...
```

## Adding an Eval

1. Create `evals/<NN>-<name>-eval.md`

2. Use the standard format:

```markdown
# <NAME> EVAL

## Success Criteria
- [ ] Check 1
- [ ] Check 2

## Scoring
Pass if all checks pass. Fail otherwise. Max 3 retries.
```

3. Reference the eval in `references/evals.md` and `SKILL.md` workflow table

## Modifying Templates

Templates live in `templates/`. Changes here affect what `npx create-stellar-agentic` scaffolds.

- Frontend components go in `templates/frontend/`
- Contract code goes in `templates/contracts/`
- Backend code goes in `templates/backend/`

After updating templates, update the corresponding skill copies in `skills/<domain>/`:

```bash
cp templates/frontend/hooks/*.ts skills/dapp/hooks/
cp templates/frontend/components/*.tsx skills/dapp/components/
```

## Adding a Skill

Dependency skills live in `skills/<name>/`. Each needs:

```
skills/<name>/
├── SKILL.md     # Frontmatter + instructions
└── ...          # Optional reference files
```

1. Create the skill in `skills/<name>/SKILL.md`

2. Register in:
   - `CLAUDE.md` — add to Skill Boot list
   - `SKILL.md` — add to skills section
   - `packages/create-stellar-agentic/index.mjs` — add to `REQUIRED_SKILLS` and update count
   - `evals/02-frontend-eval.md` — add design eval criteria if applicable

## CLI Changes

The CLI lives in `packages/create-stellar-agentic/index.mjs`. Test with:

```bash
node packages/create-stellar-agentic/index.mjs test-cli --yes --no-install
```

## Pull Request Process

1. Keep PRs focused — one feature or fix per PR
2. Update docs if you change behavior
3. Update `references/` if you modify agents, evals, or templates
4. Ensure validation passes
5. Get at least one review

### PR Title Format

```
feat: add X capability
fix: correct Y behavior
docs: update Z reference
refactor: restructure A module
```

## Release Process

1. Update version in `SKILL.md` frontmatter, `package.json`, and `packages/create-stellar-agentic/package.json`
2. Create a GitHub release with release notes
3. The `publish.yml` workflow validates and optionally publishes the CLI

## Questions

Open a [Discussion](https://github.com/rylsherdamz-rgb/stellar-forge/discussions) or file an [Issue](https://github.com/rylsherdamz-rgb/stellar-forge/issues/new/choose).
