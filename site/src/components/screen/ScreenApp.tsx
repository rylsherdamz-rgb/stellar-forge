"use client";

import { useCallback, useEffect, useState } from "react";
import Terminal, { type TermLine } from "@/components/Terminal";
import { INSTALL_CMD, GITHUB_URL, METRICS, scrollBus, eventBus, type Beat } from "@/lib/scroll-bus";

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, []);
  return { copied, copy };
}

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button className={`copy-btn ${className}`} onClick={() => copy(text)} aria-label={`Copy ${text}`}>
      {copied ? (
        <>
          <CheckGlyph /> COPIED
        </>
      ) : (
        <>
          <CopyGlyph /> COPY
        </>
      )}
    </button>
  );
}

function CopyGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Logomark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3.5" fill="#a78bfa" />
      <circle cx="3" cy="12" r="1.5" fill="#a78bfa" opacity="0.5" />
      <circle cx="12" cy="3" r="1.5" fill="#a78bfa" opacity="0.5" />
      <circle cx="21" cy="12" r="1.5" fill="#a78bfa" opacity="0.5" />
      <circle cx="12" cy="21" r="1.5" fill="#a78bfa" opacity="0.5" />
      <line x1="12" y1="3" x2="12" y2="8.5" stroke="#a78bfa" strokeWidth="1" opacity="0.35" />
      <line x1="12" y1="15.5" x2="12" y2="21" stroke="#a78bfa" strokeWidth="1" opacity="0.35" />
      <line x1="3" y1="12" x2="8.5" y2="12" stroke="#a78bfa" strokeWidth="1" opacity="0.35" />
      <line x1="15.5" y1="12" x2="21" y2="12" stroke="#a78bfa" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

function CommandBlock({ cmd, note }: { cmd: string; note?: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="cmd-block">
      <div className="cmd-line">
        <span className="cmd-prompt">$</span>
        <span className="cmd-text">{cmd}</span>
        <button className="cmd-copy" onClick={() => copy(cmd)} aria-label="Copy command">
          {copied ? <CheckGlyph /> : <CopyGlyph />}
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      {note && <div className="cmd-note">{note}</div>}
    </div>
  );
}

function MetricsRow() {
  return (
    <div className="metrics-row">
      <span className="metric">
        <StarGlyph /> {METRICS.stars} GitHub Stars
      </span>
      <span className="metric">
        <DownGlyph /> {METRICS.downloads} npm weekly downloads
      </span>
      <span className="metric dim">Open Source · MIT</span>
      <span className="metric dim">Latest Release v{METRICS.version}</span>
    </div>
  );
}

function StarGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DownGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12" />
      <polyline points="6 11 12 17 18 11" />
      <path d="M5 21h14" />
    </svg>
  );
}

function Rail() {
  const items: { id: Beat; label: string; glyph: string }[] = [
    { id: "landing", label: "Overview", glyph: "⌂" },
    { id: "install", label: "Install", glyph: "↓" },
    { id: "skills", label: "Skills", glyph: "✦" },
    { id: "validate", label: "Validate", glyph: "⚠" },
    { id: "test", label: "Test", glyph: "✓" },
    { id: "deploy", label: "Deploy", glyph: "▲" },
  ];
  return (
    <nav className="screen-rail" aria-label="StellarForge sections">
      <div className="rail-items">
        {items.map((it) => (
          <button key={it.id} className={`rail-item ${scrollBus.beat === it.id ? "active" : ""}`} onClick={() => goTo(it.id)}>
            <span className="rail-glyph" aria-hidden>{it.glyph}</span>
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      <div className="rail-foot">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub ↗</a>
        <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noreferrer">Documentation ↗</a>
      </div>
    </nav>
  );
}

function Titlebar() {
  const status = {
    landing: ["session ready", "ok"],
    install: ["installing…", "warn"],
    skills: ["loading skills", "warn"],
    build: ["agent writing", "warn"],
    validate: ["eval check", "warn"],
    test: ["running tests", "warn"],
    deploy: ["deploying", "warn"],
    ready: ["ready to build", "ok"],
  }[scrollBus.beat] as [string, string];
  return (
    <div className="screen-titlebar">
      <div className="traffic">
        <span className="tdot r" />
        <span className="tdot y" />
        <span className="tdot g" />
      </div>
      <span className="tb-title">
        <Logomark size={13} /> stellar-forge — agent session
      </span>
      <span className={`tb-status ${status[1]}`}>
        <span className="dot" /> {status[0]}
      </span>
    </div>
  );
}

/* ------------------------------ views ------------------------------ */

function LandingView() {
  return (
    <div className="view view-landing">
      <div className="landing-core">
        <div className="landing-mark"><Logomark size={26} /></div>
        <h1 className="landing-name">STELLARFORGE</h1>
        <p className="landing-tag">Build on Stellar. <em>Faster.</em></p>
        <p className="landing-sub">Give your AI coding agent the tools and context to build on Stellar.</p>
        <div className="landing-actions">
          <button className="btn btn-primary" onClick={() => goTo("install")}>INSTALL STELLARFORGE</button>
          <a className="btn btn-ghost" href={GITHUB_URL} target="_blank" rel="noreferrer">VIEW GITHUB</a>
        </div>
        <CommandBlock cmd={INSTALL_CMD} note="the Skill activates when your agent opens the project" />
        <MetricsRow />
      </div>
      <div className="landing-foot">
        <span className="hint">scroll — the machine responds</span>
        <span className="hint mono">npx skills add rylsherdamz-rgb/stellar-forge</span>
      </div>
    </div>
  );
}

const INSTALL_LINES: TermLine[] = [
  [{ text: "✓ Package installed", cls: "ok" }],
  [{ text: "✓ Stellar CLI detected", cls: "ok" }],
  [{ text: "✓ Environment ready", cls: "ok" }],
];

function InstallView() {
  const [phase, setPhase] = useState<"idle" | "installing" | "done">("idle");
  const [pct, setPct] = useState(0);
  const { copied, copy } = useCopy();

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("installing"), 5000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "installing") return;
    const iv = window.setInterval(() => setPct((p) => Math.min(100, p + 5)), 130);
    return () => window.clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase !== "installing") return;
    const t = window.setTimeout(() => setPhase("done"), 3400);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <div className="view view-install">
      <div className="view-head">
        <h2>INSTALLATION</h2>
        <p>One command. The Skill and the CLI arrive together.</p>
      </div>
      <CommandBlock cmd={INSTALL_CMD} note="click copy, then run — or watch the machine do it" />
      <div className="install-flow">
        {phase === "idle" && (
          <div className="flow-cta">
            <button
              className="btn btn-primary btn-small"
              onClick={() => {
                copy(INSTALL_CMD);
                setPhase("installing");
              }}
            >
              {copied ? "COPIED ✓" : "INSTALL"}
            </button>
            <span className="hint">installation begins automatically</span>
          </div>
        )}
        {phase === "installing" && (
          <div className="flow-progress">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="progress-label">
              <span>Installing…</span>
              <span className="mono">{pct}%</span>
            </div>
          </div>
        )}
        {phase === "done" && <Terminal lines={INSTALL_LINES} title="stellar-forge — install" charRate={38} startDelay={150} />}
      </div>
      <div className="view-foot"><span className="hint">scroll — the skill loads next</span></div>
    </div>
  );
}

const SKILL_LINES: TermLine[] = [
  [{ text: "Loading skills…", cls: "dim" }],
  [{ text: "✓ Stellar", cls: "ok" }],
  [{ text: "✓ Soroban", cls: "ok" }],
  [{ text: "✓ Stellar CLI", cls: "ok" }],
  [{ text: "✓ Smart contracts", cls: "ok" }],
  [{ text: "✓ Payments", cls: "ok" }],
  [{ text: "✓ Testing", cls: "ok" }],
  [{ text: "✓ Deployment", cls: "ok" }],
  [{ text: "Agent ready.", cls: "ok" }],
];

function SkillsView() {
  return (
    <div className="view view-skills">
      <div className="view-head">
        <h2>STELLARFORGE SKILLS</h2>
        <p>Domain knowledge, loaded on demand — not dumped into context.</p>
      </div>
      <div className="skills-split">
        <Terminal lines={SKILL_LINES} title="stellar-forge — skills" charRate={16} startDelay={200} />
        <div className="skill-side">
          <div className="prompt-card">
            <span className="prompt-label">YOUR PROMPT</span>
            <p className="prompt-text">“Build a Stellar payment application.”</p>
            <div className="prompt-route">
              <span className="chip">@stellar-contracts</span>
              <span className="route-arrow">→</span>
              <span className="chip">@stellar-frontend</span>
              <span className="route-arrow">→</span>
              <span className="chip">@stellar-backend</span>
            </div>
            <p className="prompt-note">graph engine → work graph built</p>
          </div>
        </div>
      </div>
      <div className="view-foot"><span className="hint">scroll — the agent starts writing</span></div>
    </div>
  );
}

const BUILD_CODE = `// contracts/payment/src/lib.rs
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct Payment;

#[contractimpl]
impl Payment {
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        let token = Symbol::new(&env, "USDC");
        let client = TokenClient::new(&env, &token);
        client.transfer(&from, &to, &amount);
    }
}`;

function BuildView() {
  return (
    <div className="view view-build">
      <div className="view-head">
        <h2>DEVELOPMENT</h2>
        <p>“Build a Stellar payment application.” — the agent is generating.</p>
      </div>
      <div className="build-split">
        <div className="editor">
          <div className="editor-bar"><span className="eb-dot" /> contracts/payment/src/lib.rs <span className="eb-tag">Rust</span></div>
          <pre className="editor-body">
            <code>{BUILD_CODE}</code>
          </pre>
          <div className="editor-caret" aria-hidden />
        </div>
        <Terminal
          lines={[
            [{ text: "$ ", cls: "cp" }, { text: `stellar-forge run "Build a Stellar payment application."`, cls: "ccmd" }],
            [{ text: "graph engine → work graph built", cls: "dim" }],
            [{ text: "✓ contracts wrote payment contract", cls: "ok" }],
            [{ text: "✓ frontend wired wallet connect", cls: "ok" }],
            [{ text: "✓ backend added /pay endpoint", cls: "ok" }],
            [{ text: "✓ eval passed — contract compiles, tests pass", cls: "ok" }],
          ]}
          title="stellar-forge — session"
          charRate={14}
          startDelay={250}
        />
      </div>
      <div className="view-foot"><span className="hint">scroll — evals check the work</span></div>
    </div>
  );
}

const FIX_CODE = `        let token = Symbol::new(&env, "USDC");
        from.require_auth(); // ← added
        let client = TokenClient::new(&env, &token);
        client.transfer(&from, &to, &amount);`;

function ValidateView() {
  const [step, setStep] = useState<"issue" | "inspect" | "fixed">("issue");
  return (
    <div className="view view-validate">
      <div className="view-head">
        <h2>VALIDATION</h2>
        <p>The agent catches its own mistake before anything ships.</p>
      </div>
      <div className="issue-banner" role="alert">
        <span className="issue-glyph" aria-hidden>⚠</span>
        <div className="issue-main">
          <span className="issue-title">ISSUE DETECTED</span>
          <span className="issue-desc">Payment authorization requires additional validation.</span>
          <span className="issue-file mono">contracts/payment.rs · severity: high</span>
        </div>
        {step === "issue" && (
          <button className="btn btn-small" onClick={() => setStep("inspect")}>INSPECT ISSUE</button>
        )}
        {step === "fixed" && <span className="issue-resolved">✓ RESOLVED</span>}
      </div>
      <div className="editor compact">
        <div className="editor-bar"><span className="eb-dot" /> contracts/payment/src/lib.rs <span className="eb-tag">Rust</span></div>
        <pre className="editor-body">
          <code>{step === "fixed" ? FIX_CODE : BUILD_CODE}</code>
        </pre>
        {step === "inspect" && (
          <div className="fix-card">
            <span className="fix-label">SUGGESTED FIX</span>
            <p>Add authorization validation before executing transfer.</p>
            <button className="btn btn-primary btn-small" onClick={() => setStep("fixed")}>APPLY FIX</button>
          </div>
        )}
      </div>
      {step === "fixed" && (
        <div className="resolved-bar">
          <span>✓ Issue resolved</span>
          <span className="hint">scroll — tests run next</span>
        </div>
      )}
      {step !== "fixed" && <div className="view-foot"><span className="hint">scroll — the agent finds a problem</span></div>}
    </div>
  );
}

const TEST_LINES: TermLine[] = [
  [{ text: "$ ", cls: "cp" }, { text: "stellar-forge test", cls: "ccmd" }],
  [{ text: "Running…", cls: "dim" }],
  [{ text: "✓ Compilation", cls: "ok" }],
  [{ text: "✓ Unit tests", cls: "ok" }],
  [{ text: "✓ Authorization", cls: "ok" }],
  [{ text: "✓ Simulation", cls: "ok" }],
  [{ text: "24 / 24 PASSED", cls: "ok" }],
];

function TestView() {
  return (
    <div className="view view-test">
      <div className="view-head">
        <h2>TESTING</h2>
        <p>Every agent output verified against structured evals.</p>
      </div>
      <div className="test-wrap">
        <Terminal lines={TEST_LINES} title="stellar-forge — test" charRate={30} startDelay={250} />
        <div className="test-summary">
          <span className="test-count">24 / 24</span>
          <span className="test-label">PASSED</span>
          <div className="test-track"><div className="test-fill" /></div>
        </div>
      </div>
      <div className="view-foot"><span className="hint">scroll — deployment</span></div>
    </div>
  );
}

const DEPLOY_LINES: TermLine[] = [
  [{ text: "$ ", cls: "cp" }, { text: "stellar-forge deploy", cls: "ccmd" }],
  [{ text: "Preparing deployment…", cls: "dim" }],
  [{ text: "✓ Build", cls: "ok" }],
  [{ text: "✓ Simulation", cls: "ok" }],
  [{ text: "✓ Transaction", cls: "ok" }],
  [{ text: "✓ Deployment", cls: "ok" }],
  [{ text: "DEPLOYMENT SUCCESSFUL", cls: "ok" }],
];

function DeployView() {
  const { copied, copy } = useCopy();
  const hash = "C5FB3A8D…9D21E4";
  return (
    <div className="view view-deploy">
      <div className="view-head">
        <h2>DEPLOYMENT</h2>
        <p>Testnet first. Always.</p>
      </div>
      <div className="deploy-wrap">
        <Terminal lines={DEPLOY_LINES} title="stellar-forge — deploy" charRate={30} startDelay={250} />
        <div className="deploy-card">
          <span className="deploy-network"><span className="pulse-dot" /> Stellar Testnet</span>
          <div className="deploy-hash">
            <span className="mono">{hash}</span>
            <button className="cmd-copy" onClick={() => copy(hash)} aria-label="Copy transaction hash">
              {copied ? <CheckGlyph /> : <CopyGlyph />}
            </button>
          </div>
          <span className="deploy-note">simulated session · demo hash</span>
        </div>
      </div>
      <div className="view-foot"><span className="hint">scroll — your agent is ready</span></div>
    </div>
  );
}

function ReadyView() {
  return (
    <div className="view view-ready">
      <div className="landing-core">
        <div className="ready-stamp"><CheckGlyph /> READY</div>
        <h2 className="ready-title">Your agent is ready.</h2>
        <p className="landing-tag">Start building on <em>Stellar.</em></p>
        <CommandBlock cmd={INSTALL_CMD} />
        <div className="landing-actions">
          <button className="btn btn-primary" onClick={() => goTo("install")}>INSTALL STELLARFORGE</button>
          <a className="btn btn-ghost" href={GITHUB_URL} target="_blank" rel="noreferrer">VIEW GITHUB</a>
        </div>
        <MetricsRow />
      </div>
    </div>
  );
}

/* ------------------------------ shell ------------------------------ */

export function goTo(beat: Beat) {
  eventBus.go = beat;
  eventBus.seq++;
}

export default function ScreenApp({ beat }: { beat: Beat }) {
  const showRail = beat !== "landing" && beat !== "ready";
  return (
    <div className={`screen-os ${showRail ? "with-rail" : ""}`}>
      <Titlebar />
      <div className="screen-body">
        {showRail && <Rail />}
        <main className="screen-main">
          <div className="view-anim" key={beat}>
            {beat === "landing" && <LandingView />}
            {beat === "install" && <InstallView />}
            {beat === "skills" && <SkillsView />}
            {beat === "build" && <BuildView />}
            {beat === "validate" && <ValidateView />}
            {beat === "test" && <TestView />}
            {beat === "deploy" && <DeployView />}
            {beat === "ready" && <ReadyView />}
          </div>
        </main>
      </div>
      <div className="os-statusbar">
        <span className="hint">scroll — the machine responds</span>
        <span className="os-metrics">
          <span>★ {METRICS.stars}</span>
          <span>↓ {METRICS.downloads}/wk</span>
          <span>v{METRICS.version}</span>
        </span>
      </div>
    </div>
  );
}