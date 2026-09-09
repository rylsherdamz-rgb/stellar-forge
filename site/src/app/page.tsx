"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Box, Server, CreditCard, ShieldCheck, GitBranch, Vault, ArrowRight, Copy, Check, Cpu, Workflow, Wallet, Search, Users, Lock } from "lucide-react";
import StatsBar, { StarButton } from "../components/RepoStats";

gsap.registerPlugin(ScrollTrigger);

const CONTRACT_ID = "CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU";
const ADMIN = "GD4QKRYD5ZCVU4ZT6MLGYYQZGNCMMN54BTIXMYJONML66M3HTHCKECDW";
const EXPLORER = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;

const features = [
  { icon: Vault, title: "On-Chain Escrow", desc: "Rewards are deposited into a Soroban contract at creation — every open bounty is provably funded." },
  { icon: CreditCard, title: "XLM & USDC Rewards", desc: "Pay and get paid in native XLM or Stellar USDC, settled directly to the developer's wallet." },
  { icon: GitBranch, title: "GitHub Proof of Work", desc: "Developers submit a Pull Request as proof; the PR, repo, and author are verified before approval." },
  { icon: ShieldCheck, title: "Contract Is the Truth", desc: "The frontend never moves money. Only an authorized, on-chain state transition releases funds." },
  { icon: Workflow, title: "Full Bounty Lifecycle", desc: "Open → Claimed → Submitted → Completed, with cancel, expire, and refund paths enforced on-chain." },
  { icon: Box, title: "Human Approval", desc: "The creator reviews and approves with a wallet signature — no automatic or AI-driven payouts." },
  { icon: Cpu, title: "AI Assistant (Advisory)", desc: "AI drafts bounty requirements and summarizes submissions. It never touches escrow funds." },
  { icon: Server, title: "Verifiable Settlement", desc: "Every reward is a real Stellar transaction — the whole history is independently verifiable." },
];

const whyCards = [
  { icon: Vault, title: "Provably funded", desc: "The reward is escrowed the moment a bounty is created. Developers never chase an unfunded promise." },
  { icon: GitBranch, title: "Proof, not trust", desc: "A GitHub Pull Request — verified for repo and author — is the objective evidence that work was done." },
  { icon: Lock, title: "Money stays on-chain", desc: "The Soroban contract holds and releases funds. The frontend and the database can never move them." },
  { icon: Wallet, title: "You keep your keys", desc: "Every action is signed with Stellar Wallets Kit. Forge never sees a private key or seed phrase." },
];

const ROUTES = [
  { label: "Why", href: "#why" },
  { label: "How It Works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Contract", href: "#contract" },
  { label: "Get Started", href: "#start" },
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
      if (label) gsap.fromTo(label, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 87%" } });
      if (title) gsap.fromTo(title, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 87%" } });
      if (sub) gsap.fromTo(sub, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 87%" } });
      if (cards.length) gsap.fromTo(cards, { autoAlpha: 0, y: 20, ...(opts?.extra || {}) }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: opts?.stagger || 0.07, ease: "back.out(1.4)", scrollTrigger: { trigger: el, start: "top 82%" } });
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

/** A live-looking example bounty card shown in the hero. */
function BountyPreview() {
  return (
    <div className="bounty-preview">
      <div className="bounty-preview-head">
        <span className="bounty-status open">● Open</span>
        <span className="bounty-reward">25 USDC</span>
      </div>
      <h3>Fix mobile navigation bug</h3>
      <p>Fix the mobile nav, preserve desktop behavior, and add a regression test.</p>
      <div className="bounty-preview-meta">
        <span><GitBranch size={12} /> alice/project</span>
        <span><Lock size={12} /> escrowed</span>
        <span>⏳ 5 days</span>
      </div>
      <div className="bounty-preview-foot">
        <span className="bounty-chip">Testnet</span>
        <button className="bounty-claim">Claim bounty <ArrowRight size={13} /></button>
      </div>
    </div>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const glow = glowRef.current;
    if (!hero || !glow) return;
    gsap.fromTo(hero.querySelector("h1"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" });
    gsap.fromTo(hero.querySelector(".hero-lead"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.15 });
    gsap.fromTo(hero.querySelector(".hero-actions"), { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.3 });
    gsap.fromTo(hero.querySelector(".bounty-preview"), { autoAlpha: 0, y: 24, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out", delay: 0.4 });
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (self) => { gsap.set(glow, { y: self.progress * 80, scale: 1 + self.progress * 0.15, opacity: 1 - self.progress * 0.4 }); } });
    }, hero);
    return () => ctx.revert();
  }, []);

  useSectionAnim(whyRef, ".why-card", { stagger: 0.1 });
  useSectionAnim(howRef, ".arch-pipe-card", { stagger: 0.08 });
  useSectionAnim(featuresRef, ".card", { stagger: 0.07 });
  useSectionAnim(contractRef, ".contract-row", { stagger: 0.08 });
  useSectionAnim(startRef, ".step", { stagger: 0.1, extra: { x: -20 } });

  return (
    <>
      <nav>
        <div className="container">
          <a href="/" className="logo"><Logomark size={22} /> Stellar <em>Forge</em></a>
          <div className="links">
            {ROUTES.map((r) => <a key={r.label} href={r.href}>{r.label}</a>)}
            <a href="#start" className="nav-cta">Explore Bounties</a>
            <StarButton />
          </div>
        </div>
      </nav>

      <section className="hero" ref={heroRef}>
        <div className="hero-glow" ref={glowRef} />
        <div className="container hero-inner">
          <h1><span>Fund software work.</span><br />Get paid on Stellar.</h1>
          <p className="hero-lead">
            A <strong>Stellar-native developer bounty &amp; escrow marketplace</strong>. Post a funded bounty,
            and the reward is held in a <strong>Soroban smart contract</strong>. Developers claim the work,
            submit a GitHub Pull Request as proof, and — once you approve — the contract releases XLM or
            USDC straight to their wallet.
          </p>
          <div className="hero-actions">
            <a href="#start" className="btn btn-primary"><Search size={16} /> Explore Bounties</a>
            <a href="#how" className="btn btn-secondary"><Vault size={16} /> How It Works</a>
          </div>
          <BountyPreview />
          <StatsBar />
        </div>
      </section>

      <section id="why" className="section-alt" ref={whyRef}>
        <div className="container">
          <span className="section-label">Why This Exists</span>
          <h2 className="section-title">Bounties shouldn&apos;t run on trust</h2>
          <p className="section-sub">Traditional bounty boards separate payment from proof: developers don&apos;t know a reward is funded, and creators hesitate to pay before seeing results. Stellar Forge escrows the reward on-chain the moment a bounty is created, and releases it only on an authorized, verifiable state transition.</p>
          <div className="why-grid">
            {whyCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="why-card">
                  <div className="why-icon"><Icon size={18} /></div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" ref={howRef}>
        <div className="container">
          <span className="section-label">How It Works</span>
          <h2 className="section-title">From funded bounty to settled payment</h2>
          <p className="section-sub">The reward is escrowed on-chain the moment a bounty is created. A Stellar wallet signs every step, GitHub proves the work, and the Soroban contract releases the funds only on an authorized transition.</p>
          <div className="arch-pipeline">
            <div className="arch-pipe-card"><div className="label">Creator</div><div className="value">Create + Fund</div><div className="meta">reward escrowed on-chain</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Developer</div><div className="value">Claim</div><div className="meta">Stellar Wallets Kit signs</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Proof</div><div className="value">GitHub PR</div><div className="meta">repo + author verified</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Creator</div><div className="value">Approve</div><div className="meta">wallet-signed release</div></div>
            <div className="arch-pipe-arrow"><ArrowRight size={16} /></div>
            <div className="arch-pipe-card"><div className="label">Soroban</div><div className="value">Settle</div><div className="meta">XLM / USDC to developer</div></div>
          </div>
        </div>
      </section>

      <section id="features" className="section-alt" ref={featuresRef}>
        <div className="container">
          <span className="section-label">Features</span>
          <h2 className="section-title">Escrow you can verify, payments you can trust</h2>
          <p className="section-sub">On-chain escrow, GitHub-verified proof of work, wallet-signed approvals, and Stellar settlement — with an advisory AI assistant that never touches funds.</p>
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

      <section id="contract" ref={contractRef}>
        <div className="container">
          <span className="section-label">Live on Testnet</span>
          <h2 className="section-title">The escrow contract is real</h2>
          <p className="section-sub">The full bounty state machine runs in a Soroban contract, deployed and initialized on Stellar Testnet. Every reward it releases is an independently verifiable transaction.</p>
          <div className="contract-panel">
            <div className="contract-row">
              <span className="contract-key">Contract ID</span>
              <code className="contract-val">{CONTRACT_ID}</code>
              <CopyButton getText={() => CONTRACT_ID} />
            </div>
            <div className="contract-row">
              <span className="contract-key">Admin</span>
              <code className="contract-val">{ADMIN}</code>
              <CopyButton getText={() => ADMIN} />
            </div>
            <div className="contract-row">
              <span className="contract-key">Network</span>
              <code className="contract-val">Stellar Testnet</code>
              <a className="copy-btn" href={EXPLORER} target="_blank" rel="noreferrer">View on Explorer <ArrowRight size={12} /></a>
            </div>
          </div>
          <div className="contract-fns">
            {["create_bounty", "claim_bounty", "submit_bounty", "approve_bounty", "release_payment", "cancel_bounty", "refund_bounty"].map((fn) => (
              <span key={fn} className="contract-fn">{fn}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="section-alt" ref={startRef}>
        <div className="container">
          <span className="section-label">Quick Start</span>
          <h2 className="section-title">Fund, build, and settle in 3 steps</h2>
          <p className="section-sub">Connect a Stellar wallet, post a funded bounty, and let the Soroban contract settle the reward when the work is approved.</p>
          <div className="steps">
            <div className="step">
              <span className="num">01</span>
              <h4>Create + Fund</h4>
              <p>Connect with Stellar Wallets Kit and post a bounty. The reward is deposited into the Soroban escrow on creation — every open bounty is provably funded.</p>
              <div className="step-cmds">
                <div><span className="step-cmd-prompt">$ </span><span>connect wallet · deposit XLM or USDC</span></div>
                <div><span className="step-cmd-prompt">$ </span><span>create_bounty(reward, deadline, requirements)</span></div>
              </div>
            </div>
            <div className="step">
              <span className="num">02</span>
              <h4>Claim + Submit</h4>
              <p>A developer claims the bounty, does the work, and submits a GitHub Pull Request as proof. Forge verifies the PR before the submission is accepted.</p>
              <div className="step-prompt">
                <span className="step-agent">PR verified </span>repo + author matched against the claim
              </div>
            </div>
            <div className="step">
              <span className="num">03</span>
              <h4>Approve + Settle</h4>
              <p>The creator reviews and approves with a wallet signature. The contract validates the state and releases the reward — a verifiable Stellar transaction.</p>
              <div className="step-evals">
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Reward escrowed on creation</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Wallet signs every action</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>GitHub PR verified (repo + author)</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Only the creator can approve</span></div>
                <div className="step-eval"><span className="step-eval-icon pass" /><span>Contract releases the funds</span></div>
                <div className="step-eval-summary">Settled on Stellar</div>
                <div className="step-deploy"><code>approve_bounty → reward to developer</code></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="links">
            <a href="https://github.com/rylsherdamz-rgb/stellar-forge">GitHub</a>
            <a href={EXPLORER} target="_blank" rel="noreferrer">Explorer</a>
            <a href="https://stellar.org">Stellar</a>
          </div>
          <p>MIT License &middot; Stellar Forge</p>
        </div>
      </footer>
    </>
  );
}
