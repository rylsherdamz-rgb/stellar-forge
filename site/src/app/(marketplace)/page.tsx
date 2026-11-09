"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import BountyCard, { StatusPill } from "@/components/BountyCard";
import { useChain } from "@/hooks/useChain";
import { CONFIG, explorerContract } from "@/lib/config";
import { shortAddr } from "@/lib/lifecycle";
import type { Bounty } from "@/lib/store";

const STEPS = [
  { n: "01", t: "Create & fund", d: "Describe the task and sign one transaction. The reward moves into the Soroban escrow contract — every open bounty is provably funded.", fn: "create_bounty" },
  { n: "02", t: "Claim & build", d: "A developer claims the bounty with their wallet. The contract rejects double-claims and creators claiming their own work.", fn: "claim_bounty" },
  { n: "03", t: "Submit a PR", d: "The developer submits a GitHub pull request. Forge checks the repo and author, and a hash of the submission is stored on-chain.", fn: "submit_bounty" },
  { n: "04", t: "Approve & settle", d: "The creator reviews and signs. The contract pays the developer directly — no platform ever holds the money.", fn: "approve_bounty" },
];

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const { chain, offline } = useChain();

  useEffect(() => {
    fetch("/api/bounties")
      .then((r) => r.json())
      .then((d) => setBounties(d.bounties || []))
      .catch(() => setBounties([]))
      .finally(() => setLoading(false));
  }, []);

  const open = bounties.filter((b) => b.status === "OPEN");
  const featured = (open.length ? open : bounties).slice(0, 3);
  const ledger = chain?.latestLedger ?? null;

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-inner">
          <div>
            <span className="hero-badge">
              <span className={offline ? "live off" : "live"} />
              {offline ? "Testnet RPC unreachable" : `Live on Stellar ${CONFIG.network}`}
              {ledger && <span className="mono dim"> · ledger {ledger.toLocaleString()}</span>}
            </span>
            <h1>
              Fund software work.
              <br />
              <span>Get paid on Stellar.</span>
            </h1>
            <p className="hero-lead">
              Post a bounty and the reward is locked in a Soroban smart contract. Developers
              claim it, ship a GitHub PR, and when you approve, the contract pays them
              directly.
            </p>
            <div className="hero-actions">
              <Link href="/bounties" className="btn btn-primary">Browse bounties</Link>
              <Link href="/create" className="btn btn-secondary">Post a bounty</Link>
            </div>
          </div>

          <div className="preview" aria-hidden="true">
            <div className="preview-head">
              <StatusPill status="SUBMITTED" />
              <span className="reward">25 <small>XLM</small></span>
            </div>
            <h3>Fix mobile navigation bug</h3>
            <p>Restore the mobile menu, keep desktop behaviour, add a regression test.</p>
            <div className="preview-flow">
              {[
                ["create_bounty", "25 XLM escrowed", true],
                ["claim_bounty", `claimed by ${shortAddr("GAJAT5TLPHYVXTF23CBUISRUEWERUNGOVC5E57S7XOV5K65ELPL7H7RG")}`, true],
                ["submit_bounty", "PR #42 · repo + author verified", true],
                ["approve_bounty", "waiting for creator signature", false],
              ].map(([fn, label, done]) => (
                <div key={fn as string} className={`flow-row ${done ? "done" : "pending"}`}>
                  <span className="flow-dot" />
                  <code>{fn}</code>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats">
          <div>
            <span className="stat-k">Escrow contract</span>
            <a className="stat-v mono" href={explorerContract(CONFIG.contractId)} target="_blank" rel="noreferrer">
              {shortAddr(CONFIG.contractId)} ↗
            </a>
          </div>
          <div>
            <span className="stat-k">Bounties created on-chain</span>
            <span className="stat-v mono">{chain?.nextId ?? "—"}</span>
          </div>
          <div>
            <span className="stat-k">Latest ledger</span>
            <span className="stat-v mono">{ledger ? ledger.toLocaleString() : "—"}</span>
          </div>
          <div>
            <span className="stat-k">Settlement</span>
            <span className="stat-v">XLM · creator-signed</span>
          </div>
        </div>
      </section>

      <section id="bounties" className="block">
        <div className="container">
          <div className="row-between section-head">
            <div>
              <h2 className="section-title">{open.length ? "Open bounties" : "Latest bounties"}</h2>
              <p className="section-sub">Funded software tasks. Claim one, ship a PR, get paid.</p>
            </div>
            <Link href="/bounties" className="btn btn-secondary">View all →</Link>
          </div>

          {loading ? (
            <div className="grid">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="empty">
              <p>No bounties yet.</p>
              <Link href="/create" className="btn btn-primary">Post the first one</Link>
            </div>
          ) : (
            <div className="grid">
              {featured.map((b, i) => (
                <Reveal key={b.id} delay={i * 60}>
                  <BountyCard bounty={b} ledger={ledger} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="block section-alt">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">
            Four contract calls from a funded task to a settled payment. The frontend only
            builds transactions — your wallet signs, and the contract decides.
          </p>
          <ol className="how">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <li className="how-step">
                  <span className="how-n mono">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <code>{s.fn}()</code>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
