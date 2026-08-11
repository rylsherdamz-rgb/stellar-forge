"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Box, Layout, Server, CreditCard, ShieldCheck, GitBranch, ArrowRight, Copy, Check, Cpu, Network, Workflow, Zap, BookOpen, FileCode } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Box, title: "Smart Contracts", desc: "Scaffold Rust/Soroban contracts with build, test, and deploy workflows — testnet gated." },
  { icon: Layout, title: "dApp Frontends", desc: "Generate Next.js apps pre-integrated with Stellar Wallets Kit, hooks, and tx flows." },
  { icon: Server, title: "Backend APIs", desc: "Build API servers and indexers that query Stellar RPC and Horizon with x402 middleware." },
  { icon: CreditCard, title: "x402 Payments", desc: "Monetize APIs with HTTP 402 and Stellar USDC — zero-XLM clients via OZ Channels." },
  { icon: ShieldCheck, title: "Zero-Knowledge Proofs", desc: "Integrate Groth16, Circom, and Noir verifiers into Stellar contracts via BLS12-381." },
  { icon: GitBranch, title: "Eval-Driven Pipeline", desc: "Every agent output verified against structured evals with max 3 retries. No blind trust." },
];

const agents = [
  { handle: "@stellar-contracts", role: "Rust smart contract engineer", skills: ["soroban-sdk", "WASM", "deploy"], edgeOut: "contract IDs, ABI" },
  { handle: "@stellar-frontend", role: "dApp frontend developer", skills: ["React", "Wallets Kit", "Tailwind"], edgeIn: "contract IDs", edgeOut: "API route specs" },
  { handle: "@stellar-backend", role: "API and indexer engineer", skills: ["RPC", "Horizon", "Data"], edgeIn: "payment middleware, API needs" },
  { handle: "@stellar-payments", role: "Payment flow architect", skills: ["USDC", "Paywall", "MPP"], edgeOut: "middleware code" },
  { handle: "@stellar-ops", role: "DevOps and platform engineer", skills: ["CI/CD", "Docker", "GitHub Actions"], edgeIn: "build artifacts from all nodes" },
  { handle: "@stellar-zk", role: "Zero-knowledge engineer", skills: ["Groth16", "Circom", "Noir"], edgeOut: "verifier contract WASM" },
];

const ROUTES = [
  { label: "Why", href: "#why" },
  { label: "Architecture", href: "#architecture" },
  { label: "Kernel", href: "#kernel" },
  { label: "Install", href: "#install" },
  { label: "Agents", href: "#agents" },
  { label: "Usage", href: "#usage" },
];

const installMatrix = [
  { want: "Add AI orchestration to an existing Stellar project", use: "Skill → npx skills add ..." },
  { want: "Scaffold a brand-new Stellar dApp monorepo", use: "CLI → npx create-stellar-forge" },
  { want: "Build a dApp with AI assistance (recommended)", use: "Both — CLI scaffolds, Skill builds" },
  { want: "Use AI agents without Claude Code", use: "CLI only — standalone scaffolding" },
];

function CopyButton({ getText, children, className = "" }: { getText: () => string; children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className={`copy-btn ${className}`} onClick={() => { navigator.clipboard.writeText(getText()); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : (children || "Copy")}
    </button>
  );
}

function useSectionAnim(ref: React.RefObject<HTMLDivElement | null>, cardSel: string, opts?: { stagger?: number; extra?: gsap.TweenVars }) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll(cardSel);
    const label = el.querySelector(".section-label")!;
    const title = el.querySelector(".section-title")!;
    const sub = el.querySelector(".section-sub");
    const ctx = gsap.context(() => {
      gsap.fromTo(label, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 87%" } });
      gsap.fromTo(title, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 87%" } });
      if (sub) gsap.fromTo(sub, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 87%" } });
      gsap.fromTo(cards, { autoAlpha: 0, y: 20, ...(opts?.extra || {}) }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: opts?.stagger || 0.07, ease: "back.out(1.4)", scrollTrigger: { trigger: el, start: "top 82%" } });
    });
    return () => ctx.revert();
  }, []);
}

function Logomark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3.5" fill="#7c3aed" />
      <circle cx="3" cy="12" r="1.5" fill="#7c3aed" opacity="0.5" />
      <circle cx="12" cy="3" r="1.5" fill="#7c3aed" opacity="0.5" />
      <circle cx="21" cy="12" r="1.5" fill="#7c3aed" opacity="0.5" />
      <circle cx="12" cy="21" r="1.5" fill="#7c3aed" opacity="0.5" />
      <line x1="12" y1="3" x2="12" y2="8.5" stroke="#7c3aed" strokeWidth="1" opacity="0.35" />
      <line x1="12" y1="15.5" x2="12" y2="21" stroke="#7c3aed" strokeWidth="1" opacity="0.35" />
      <line x1="3" y1="12" x2="8.5" y2="12" stroke="#7c3aed" strokeWidth="1" opacity="0.35" />
      <line x1="15.5" y1="12" x2="21" y2="12" stroke="#7c3aed" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const kernelRef = useRef<HTMLDivElement>(null);
  const installRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const glow = glowRef.current;
    if (!hero || !glow) return;
    gsap.fromTo(hero.querySelector("h1"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" });
    gsap.fromTo(hero.querySelector("p"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.2 });
    gsap.fromTo(hero.querySelector(".hero-actions"), { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.3 });
    gsap.fromTo(hero.querySelector(".hero-mini-term"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.5 });
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (self) => { gsap.set(glow, { y: self.progress * 80, scale: 1 + self.progress * 0.15, opacity: 1 - self.progress * 0.4 }); } });
    }, hero);
    return () => ctx.revert();
  }, []);

  useSectionAnim(whyRef, ".why-card", { stagger: 0.1 });
  useSectionAnim(archRef, ".arch-pipe-card", { stagger: 0.08 });
  useSectionAnim(kernelRef, ".kernel-card", { stagger: 0.08 });
  useSectionAnim(installRef, ".install-card", { stagger: 0.12 });
  useSectionAnim(featuresRef, ".card", { stagger: 0.07 });
  useSectionAnim(agentsRef, ".agent-card", { stagger: 0.06, extra: { scale: 0.95 } });
  useSectionAnim(usageRef, ".step", { stagger: 0.1, extra: { x: -20 } });

  return (
    <>
      <nav>
        <div className="container">
          <a href="/" className="logo"><Logomark size={22} /> Stellar <em>Forge</em></a>
          <div className="links">
            {ROUTES.map((r) => <a key={r.label} href={r.href}>{r.label}</a>)}
            <a href="#install" className="nav-cta">Get Started</a>
          </div>
        </div>
      </nav>

      <section className="hero" ref={heroRef}>
        <div className="hero-glow" ref={glowRef} />
        <div className="container hero-inner">
          <h1><span>Build Stellar dApps</span><br />with AI Agents</h1>
          <p>
            <strong>AI orchestration</strong> + <strong>project scaffolding</strong> for Stellar — an open-source
            reference implementation for AI-assisted Stellar development. Six agents write, verify, and deploy
            contracts, frontends, and payment APIs — no context-switching. The CLI bootstraps the project.
            The Skill builds it. Use either, or both.
          </p>
          <div className="hero-actions">
            <div className="hero-cta-group">
              <span className="hero-cta-label">Use with Claude Code / OpenCode</span>
              <CopyButton getText={() => "npx skills add rylsherdamz-rgb/stellar-forge"} className="btn btn-primary btn-copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Install Skill
              </CopyButton>
            </div>
            <div className="hero-cta-group">
              <span className="hero-cta-label">Use standalone</span>
              <CopyButton getText={() => "npx create-stellar-forge my-dapp"} className="btn btn-primary btn-copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                Scaffold Project
              </CopyButton>
            </div>
            <div className="hero-cta-group">
              <span className="hero-cta-label">See it in action</span>
              <a href="https://x.com/ChichiCode0/status/2084510317862895653" target="_blank" rel="noreferrer" className="btn btn-secondary btn-copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Watch promo (60s)
              </a>
            </div>
          </div>
          <div className="hero-mini-term">
            <div className="bar">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
            <div className="body">
              Graph engine routes task to <span>@stellar-contracts</span> → <span>@stellar-frontend</span> → <span>@stellar-backend</span> — each verified against evals, max 3 retries.
            </div>
          </div>
        </div>
      </section>

      <section id="promo" className="section-alt">
        <div className="container">
          <span className="section-label">Promo</span>
          <h2 className="section-title">Watch it in action</h2>
          <p className="section-sub">60 seconds of contracts, terminals, and a graph engine wiring six agents.</p>
          <div className="promo-frame">
            <video controls muted playsInline preload="none" poster="/promo-poster.png">
              <source src="/promo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section id="why" className="section-alt" ref={whyRef}>
        <div className="container">
          <span className="section-label">Why This Exists</span>
          <h2 className="section-title">Generic AI tools don't know Stellar</h2>
          <p className="section-sub">Copilot and ChatGPT don't know contracts must be #![no_std], or that x402 needs OZ Channels and CAIP-2 network IDs. This framework embeds that domain knowledge into 10 skills, 6 agents, and 5 eval files.</p>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon"><FileCode size={18} /></div>
              <h3>Domain Skills</h3>
              <p>10 bundled knowledge skills (soroban-sdk, Wallets Kit, x402, Groth16, SEPs, MCP, etc.) — loaded on demand, not dumped into context.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><Cpu size={18} /></div>
              <h3>Graph Engine Orchestration</h3>
              <p>Not a chat. The kernel builds a work graph per task — which agents, in what order, sharing what state — and verifies each node before proceeding.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><Zap size={18} /></div>
              <h3>Eval-Driven Pipeline</h3>
              <p>Every output checked against structured pass/fail evals. Fail → retry with corrective context (max 3). Pass → hand off to next node. No blind trust.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><BookOpen size={18} /></div>
              <h3>CLI Bootstraps, Skill Builds</h3>
              <p>The CLI scaffolds a production-ready monorepo (contracts + frontend + backend + CI/CD). The Skill activates AI agents inside it. Together they're a complete workflow.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" ref={archRef}>
        <div className="container">
          <span className="section-label">Architecture</span>
          <h2 className="section-title">Org Graph</h2>
          <p className="section-sub">Six agent nodes, each owning a zone with persistent context and defined edges. Stable structure that persists across sessions.</p>
          <div className="arch-pipeline">
            <div className="arch-pipe-card"><div className="label">Zone</div><div className="value">Contracts</div><div className="meta">Rust, WASM, deploy</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Zone</div><div className="value">Frontend</div><div className="meta">Next.js, Wallets Kit</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Zone</div><div className="value">Backend</div><div className="meta">Express, RPC, x402</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Zone</div><div className="value">Payments</div><div className="meta">USDC, Channels, MPP</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Zone</div><div className="value">DevOps</div><div className="meta">CI/CD, Docker</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Zone</div><div className="value">ZK</div><div className="meta">Groth16, Circom</div></div>
          </div>
        </div>
      </section>

      <section id="kernel" className="section-alt" ref={kernelRef}>
        <div className="container">
          <span className="section-label">The Kernel</span>
          <h2 className="section-title">Graph Engine (CLAUDE.md)</h2>
          <p className="section-sub">The kernel is not a runtime — it is a structured prompt that tells the AI how to organize its own work. It generates a work graph for every task.</p>
          <div className="kernel-grid">
            <div className="kernel-card">
              <div className="kernel-icon"><Network size={18} /></div>
              <h3>Org Graph</h3>
              <p>6 agent nodes, each with zone ownership, persistent context, and edge definitions. Stable across sessions.</p>
            </div>
            <div className="kernel-card">
              <div className="kernel-icon"><Workflow size={18} /></div>
              <h3>Work Graph</h3>
              <p>Per-task dynamic wiring: sequential, parallel, conditional, fan-out, fan-in. Determined by data dependencies, not hardcoded order.</p>
            </div>
            <div className="kernel-card">
              <div className="kernel-icon"><Server size={18} /></div>
              <h3>Node Contract</h3>
              <p>Each node gets intent + context + tools. Returns output + state delta + verifier result. No node writes code outside its zone.</p>
            </div>
            <div className="kernel-card">
              <div className="kernel-icon"><GitBranch size={18} /></div>
              <h3>Dynamic Orgs</h3>
              <p>Graph rewrites itself: spawn nodes mid-task, reroute on failure, collapse on early convergence, reorder on priority shift.</p>
            </div>
            <div className="kernel-card">
              <div className="kernel-icon"><ShieldCheck size={18} /></div>
              <h3>Eval Gate</h3>
              <p>After each node, run its verifier. Pass → proceed. Fail → retry with corrective context (max 3) → reroute to fallback → escalate.</p>
            </div>
            <div className="kernel-card">
              <div className="kernel-icon"><Zap size={18} /></div>
              <h3>Edge Context</h3>
              <p>Shared state (contract IDs, deploy records, .env) travels along edges. Nodes never rediscover what sibling nodes already computed.</p>
            </div>
          </div>
          <div className="workgraph-diagram">
            <div className="workgraph-label">Example work graph: <em>"Build a token contract with a React frontend"</em></div>
            <div className="workgraph-body">
              <span className="wg-node">[contracts]</span>
              <span className="wg-edge">──(contract_id)──→</span>
              <span className="wg-node">[frontend]</span>
              <span className="wg-edge"> │</span>
              <span className="wg-edge">verifier ↓</span>
              <span className="wg-edge" />
              <span className="wg-edge">verifier ↓</span>
              <span className="wg-end">pass → [kernel: synthesize]</span>
              <span className="wg-end" />
              <span className="wg-end">pass →</span>
            </div>
          </div>
        </div>
      </section>

      <section id="install" ref={installRef}>
        <div className="container">
          <span className="section-label">Install</span>
          <h2 className="section-title">Which one?</h2>
          <p className="section-sub">Two entry points, one framework. Here&apos;s how to choose.</p>
          <div className="which-table">
            {installMatrix.map((row, i) => (
              <div key={i} className="which-row">
                <div className="which-cell which-want">{row.want}</div>
                <div className="which-cell which-use">{row.use}</div>
              </div>
            ))}
          </div>
          <div className="install-grid">
            <div className="install-card">
              <div className="install-card-header">
                <span className="install-badge">Skill</span>
                <h3>Agent Orchestration</h3>
              </div>
              <div className="install-audience">For Claude Code and OpenCode users</div>
              <p className="install-desc">Adds 6 AI agents to your sessions. The graph engine activates automatically — describe what you want in natural language.</p>
              <div className="install-code-block">
                <div className="install-code-bar">Shell</div>
                <div className="install-code-body"><span className="cp">$ </span><span className="ccmd">npx skills add rylsherdamz-rgb/stellar-forge</span><br /><br /><span className="co"># or specify your agent</span><br /><span className="cp">$ </span><span className="ccmd">npx skills add ... --agent claude-code</span><br /><span className="cp">$ </span><span className="ccmd">npx skills add ... --agent opencode</span></div>
              </div>
              <div className="install-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>Drops into any existing repo — no project structure required.</span>
              </div>
            </div>
            <div className="install-card">
              <div className="install-card-header">
                <span className="install-badge">CLI</span>
                <h3>Project Scaffold</h3>
              </div>
              <div className="install-audience">For standalone projects (no AI required)</div>
              <p className="install-desc">Generates a production-ready monorepo: contracts, frontend, backend, CI/CD, and agent files. The CLI auto-installs the Skill too.</p>
              <div className="install-code-block">
                <div className="install-code-bar">Shell</div>
                <div className="install-code-body"><span className="cp">$ </span><span className="ccmd">npx create-stellar-forge my-dapp --yes</span><br /><br /><span className="co">  ✔ Scaffolding Stellar Forge dApp...</span><br /><span className="co">  ✔ contracts/hello-world/src/lib.rs</span><br /><span className="co">  ✔ contracts/token/src/lib.rs</span><br /><span className="co">  ✔ frontend/src/app/page.tsx</span><br /><span className="co">  ✔ backend/src/index.ts</span><br /><span className="co">  ✔ All 10 skills installed</span></div>
              </div>
              <div className="install-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span><strong>Killer feature:</strong> opening the generated project in Claude Code auto-activates the full harness — no extra steps.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section-alt" ref={featuresRef}>
        <div className="container">
          <span className="section-label">Features</span>
          <h2 className="section-title">Everything you need to ship on Stellar</h2>
          <p className="section-sub">Six specialist agents, 10 domain skills, 5 eval files. From contract to deployment in minutes.</p>
          <div className="card-grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="card">
                  <div className="card-icon"><Icon size={18} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="agents" ref={agentsRef}>
        <div className="container">
          <span className="section-label">Agent Registry</span>
          <h2 className="section-title">Six agents with edge context</h2>
          <p className="section-sub">Each agent is a structured prompt configuration (not a running process). They communicate through a defined graph — data flows along edges, not through the kernel.</p>
          <div className="agents-grid">
            {agents.map((a, i) => (
              <div key={i} className="agent-card">
                <div className="handle">{a.handle}</div>
                <div className="role">{a.role}</div>
                {a.edgeIn && <div className="edge edge-in">← {a.edgeIn}</div>}
                {a.edgeOut && <div className="edge edge-out">→ {a.edgeOut}</div>}
                <div className="skills">{a.skills.map((s, j) => <span key={j}>{s}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="usage" className="section-alt" ref={usageRef}>
        <div className="container">
          <span className="section-label">Quick Start</span>
          <h2 className="section-title">Ship in 3 steps</h2>
          <p className="section-sub">From empty directory to deployed dApp — the graph engine handles routing, verification, and knowledge graphing.</p>
          <div className="steps">
            <div className="step">
              <span className="num">01</span>
              <h4>Install</h4>
              <p>Pick your entry point — Skill for AI orchestration, CLI for project scaffolding, or both.</p>
              <div className="step-cmds">
                <div><span className="step-cmd-prompt">$ </span><span>npx skills add rylsherdamz-rgb/stellar-forge</span></div>
                <div><span className="step-cmd-prompt">$ </span><span>npx create-stellar-forge my-dapp --yes</span></div>
              </div>
            </div>
            <div className="step">
              <span className="num">02</span>
              <h4>Describe</h4>
              <p>Tell the graph engine what to build. It generates a work graph and routes to the right agents.</p>
              <div className="step-prompt">
                <span className="step-agent">@stellar-contracts </span>create a SAC-compatible token with mint, burn, and transfer operations
              </div>
            </div>
            <div className="step">
              <span className="num">03</span>
              <h4>Ship</h4>
              <p>Agents write code, evals verify it, knowledge graph maps the project. Deploy with one command.</p>
              <div className="step-evals">
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Contract compiles to WASM</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Tests pass</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Auth on privileged functions</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>TTL on writes</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Frontend wallet connect/disconnect</span></div>
                <div className="step-eval-summary">6/6 evals passed</div>
                <div className="step-deploy"><code>/deploy . testnet</code></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="links">
            <a href="https://github.com/rylsherdamz-rgb/stellar-forge">GitHub</a>
            <a href="https://www.npmjs.com/package/create-stellar-forge">npm</a>
            <a href="https://stellar.org">Stellar</a>
          </div>
          <p>MIT License &middot; v0.3.0</p>
        </div>
      </footer>
    </>
  );
}
