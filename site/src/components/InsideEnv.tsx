"use client";

import Terminal, { type TermLine } from "@/components/Terminal";

const STATES: { key: string; label: string; desc: string; lines: TermLine[] }[] = [
  {
    key: "install",
    label: "Install",
    desc: "npm package + scaffold — what actually runs",
    lines: [
      [{ text: "$ ", cls: "cp" }, { text: "npm i -g create-stellar-agentic", cls: "ccmd" }],
      [{ text: "added 41 packages in 3s", cls: "dim" }],
      [{ text: "$ ", cls: "cp" }, { text: "npx create-stellar-agentic my-dapp --yes", cls: "ccmd" }],
      [{ text: "✔ contracts/token/src/lib.rs", cls: "dim" }],
      [{ text: "✔ contracts/hello-world/src/lib.rs", cls: "dim" }],
      [{ text: "✔ frontend/src/app/page.tsx", cls: "dim" }],
      [{ text: "✔ backend/src/index.ts", cls: "dim" }],
      [{ text: "✔ CI/CD · deploy workflow wired", cls: "dim" }],
      [{ text: "$ ", cls: "cp" }, { text: "npx skills add rylsherdamz-rgb/stellar-forge", cls: "ccmd" }],
      [{ text: "✔ All 10 skills installed", cls: "ok" }],
      [{ text: "Ready. Describe what to build.", cls: "dim" }],
    ],
  },
  {
    key: "skills",
    label: "Skills",
    desc: "the agent loads Stellar domain skills",
    lines: [
      [{ text: "$ ", cls: "cp" }, { text: "npx skills add rylsherdamz-rgb/stellar-forge", cls: "ccmd" }],
      [{ text: "✓ Soroban smart contracts", cls: "ok" }],
      [{ text: "✓ dApp development · Wallets Kit", cls: "ok" }],
      [{ text: "✓ Chain data · Stellar SDK", cls: "ok" }],
      [{ text: "✓ Assets · trustlines · SAC", cls: "ok" }],
      [{ text: "✓ Stellar MCP", cls: "ok" }],
      [{ text: "✓ Agentic payments · x402 · MPP", cls: "ok" }],
      [{ text: "✓ Standards · SEPs · CAPs", cls: "ok" }],
      [{ text: "✓ Zero-knowledge proofs", cls: "ok" }],
      [{ text: "✓ Knowledge graphs", cls: "ok" }],
      [{ text: "✓ Frontend design", cls: "ok" }],
      [{ text: "Agent ready.", cls: "ok" }],
    ],
  },
  {
    key: "validate",
    label: "Validate",
    desc: "demo — eval-driven issue detection",
    lines: [
      [{ text: "Analyzing contract against evals…", cls: "dim" }],
      [{ text: "✓ Rust compilation", cls: "ok" }],
      [{ text: "✓ Contract structure", cls: "ok" }],
      [{ text: "✓ Soroban compatibility", cls: "ok" }],
      [{ text: "⚠ Potential authorization issue detected", cls: "warn" }],
      [{ text: "Issue: missing authorization check in ", cls: "dim" }, { text: "transfer()", cls: "ccmd" }],
      [{ text: "Suggested fix: add ", cls: "dim" }, { text: "require_auth()", cls: "ccmd" }, { text: " for the caller", cls: "dim" }],
      [{ text: "✓ Issue resolved", cls: "ok" }],
      [{ text: "✓ Tests passing", cls: "ok" }],
      [{ text: "✓ Contract ready for deployment", cls: "ok" }],
    ],
  },
  {
    key: "test",
    label: "Test",
    desc: "cargo test — the scaffolded monorepo's suite",
    lines: [
      [{ text: "$ ", cls: "cp" }, { text: "cargo test --workspace", cls: "ccmd" }],
      [{ text: "Running Stellar tests…", cls: "dim" }],
      [{ text: "✓ Contract compilation", cls: "ok" }],
      [{ text: "✓ Unit tests", cls: "ok" }],
      [{ text: "✓ Authorization tests", cls: "ok" }],
      [{ text: "✓ Transaction simulation", cls: "ok" }],
      [{ text: "✓ Error handling", cls: "ok" }],
      [{ text: "24 tests passed", cls: "ok" }],
    ],
  },
  {
    key: "deploy",
    label: "Deploy",
    desc: "stellar contract deploy — testnet first",
    lines: [
      [{ text: "$ ", cls: "cp" }, { text: "stellar contract deploy --wasm target/wasm32-unknown-unknown/release/token.wasm --network testnet", cls: "ccmd" }],
      [{ text: "✓ Build complete", cls: "ok" }],
      [{ text: "✓ Simulation successful", cls: "ok" }],
      [{ text: "✓ Transaction submitted", cls: "ok" }],
      [{ text: "Contract deployed successfully.", cls: "ok" }],
      [{ text: "network: testnet · 2.1s", cls: "dim" }],
    ],
  },
];

const TREE: { dir: string; files: { name: string; active?: boolean }[] }[] = [
  { dir: "contracts", files: [{ name: "token/src/lib.rs", active: true }, { name: "hello-world/src/lib.rs" }] },
  { dir: "frontend", files: [{ name: "src/app/page.tsx" }] },
  { dir: "backend", files: [{ name: "src/index.ts" }] },
  { dir: "skills", files: [{ name: "10 skills · 6 agents" }] },
  { dir: "config", files: [{ name: "stellar-forge.json" }, { name: "evals/01-05" }] },
];

export default function InsideEnv({ state }: { state: number }) {
  const current = STATES[Math.max(0, Math.min(STATES.length - 1, state))];
  return (
    <div className="inside-env">
      <div className="ie-titlebar">
        <span className="ie-title">StellarForge</span>
        <span className="ie-status"><span className="dot" /> Ready</span>
      </div>
      <div className="ie-body">
        <aside className="ie-side">
          <div className="ie-side-label">PROJECT · my-dapp</div>
          {TREE.map((d) => (
            <div key={d.dir} className="ie-dir">
              <div className="ie-dir-name">▸ {d.dir}/</div>
              {d.files.map((f) => (
                <div key={f.name} className={`ie-file ${f.active ? "active" : ""}`}>{f.name}</div>
              ))}
            </div>
          ))}
        </aside>
        <div className="ie-main">
          <div className="ie-rail">
            {STATES.map((s, i) => (
              <div key={s.key} className={`ie-rail-step ${i === state ? "on" : i < state ? "done" : ""}`}>
                <span className="ie-rail-num">{i < state ? "✓" : String(i + 1).padStart(2, "0")}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="ie-state-head">
            <span className="ie-state-label">{current.key.toUpperCase()}</span>
            <span className="ie-state-desc">{current.desc}</span>
          </div>
          <Terminal key={current.key} title="stellar-forge — session" lines={current.lines} charRate={9} startDelay={200} />
          {state >= STATES.length - 1 && (
            <div className="ie-done">
              <span className="stamp in">READY TO BUILD</span>
              <span className="ie-done-note">keep scrolling — you&apos;re back outside</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}