[CAPABILITY EVAL: framework-self-test]
Task: Verify the Stellar Agentic Framework itself is correctly configured and operational.
Success Criteria:
  - [ ] SKILL.md exists with all required sections
  - [ ] CLAUDE.md exists with agent registry and routing rules
  - [ ] All 6 agent files exist in agents/ with valid content
  - [ ] All 4 command files exist in .claude/commands/ with valid content
  - [ ] All 5 eval files exist in evals/ with valid content
  - [ ] All template directories exist (contracts, frontend, backend, cicd)
  - [ ] Root package.json with npm workspaces configuration
  - [ ] README.md with framework overview
  - [ ] .env.example with all required environment variables documented
  - [ ] graphify-out/ exists (framework self-graphify completed)
  - [ ] graphify-out/graph.json has nodes covering all framework components
  - [ ] Graph health check: no dangling or missing edges
Expected Output: Framework self-test passes all checks. Knowledge graph built and healthy.

[CAPABILITY EVAL: template-validity]
Task: Verify all templates are syntactically valid and self-consistent.
Success Criteria:
  - [ ] Contract templates: Cargo.toml well-formed, lib.rs no syntax errors
  - [ ] Frontend templates: TypeScript compiles (tsc --noEmit)
  - [ ] Frontend templates: package.json has valid dependencies
  - [ ] Backend templates: TypeScript compiles
  - [ ] Backend templates: x402 imports resolve
  - [ ] CI/CD templates: valid GitHub Actions YAML syntax
  - [ ] E2E test templates: valid Playwright configuration
Expected Output: All templates validated without syntax or dependency errors.
