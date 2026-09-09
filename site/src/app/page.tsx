"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import Reveal from "@/components/Reveal";
import type { Bounty } from "@/lib/store";

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bounties")
      .then((r) => r.json())
      .then((d) => setBounties(d.bounties || []))
      .catch(() => setBounties([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-inner">
          <div>
            <span className="hero-badge"><span className="live" /> Live on Stellar Testnet</span>
            <h1>
              Fund software work.
              <br />
              <span>Get paid on Stellar.</span>
            </h1>
            <p className="hero-lead">
              Post a bounty and the reward is escrowed in a Soroban smart contract.
              Developers claim, submit a GitHub PR as proof, and once you approve the
              contract releases XLM to their wallet.
            </p>
            <div className="hero-actions">
              <a href="#bounties" className="btn btn-primary">Explore Bounties</a>
              <Link href="/create" className="btn btn-secondary">Create a Bounty</Link>
            </div>
          </div>

          <div className="preview">
            <div className="preview-head">
              <span className="status OPEN">Open</span>
              <span className="reward">25 XLM</span>
            </div>
            <h3>Fix mobile navigation bug</h3>
            <p>Fix the mobile nav, preserve desktop behavior, and add a regression test.</p>
            <div className="steps-mini">
              <div className="mini-row"><span className="mini-dot" /> Reward escrowed on-chain</div>
              <div className="mini-row"><span className="mini-dot" /> GitHub PR verified (repo + author)</div>
              <div className="mini-row"><span className="mini-dot" /> Creator-signed release</div>
            </div>
          </div>
        </div>
      </section>

      <section id="bounties" className="block section-alt">
        <div className="container">
          <div className="row-between" style={{ marginBottom: 20 }}>
            <div>
              <h2 className="section-title">Open bounties</h2>
              <p className="section-sub" style={{ margin: 0 }}>
                Funded software tasks. Claim one, ship a PR, get paid in XLM.
              </p>
            </div>
            <Link href="/create" className="btn btn-primary">Create a Bounty</Link>
          </div>

          {loading ? (
            <div className="grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          ) : bounties.length === 0 ? (
            <div className="notice info">
              No bounties yet.{" "}
              <Link href="/create" style={{ color: "var(--accent)" }}>
                Create the first one.
              </Link>
            </div>
          ) : (
            <div className="grid">
              {bounties.map((b, i) => (
                <Reveal key={b.id} delay={i * 60}>
                  <Link href={`/bounties/${b.id}`} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span className={`status ${b.status}`}>{b.status}</span>
                      <span className="reward">{b.rewardAmount} XLM</span>
                    </div>
                    <h3>{b.title}</h3>
                    <p>
                      {b.description.slice(0, 120)}
                      {b.description.length > 120 ? "…" : ""}
                    </p>
                    <div className="meta-row">
                      <span>◈ {b.githubRepository}</span>
                      {b.escrowId != null && <span>escrow #{b.escrowId}</span>}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="block">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">
            Four steps from a funded task to a settled payment. The Soroban contract
            is the source of truth for the money at every step.
          </p>
          <div className="grid">
            {[
              { n: "1", t: "Create & Fund", d: "Connect a wallet, describe the task, and deposit the XLM reward into the escrow contract. Funded on creation." },
              { n: "2", t: "Claim & Build", d: "A developer claims the open bounty and does the work. The contract prevents double-claims." },
              { n: "3", t: "Submit Proof", d: "The developer submits a GitHub PR. Forge verifies the repo and author before it counts." },
              { n: "4", t: "Approve & Settle", d: "The creator approves with a wallet signature and the contract releases the reward on Stellar." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div className="card">
                  <span className="card-step">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
