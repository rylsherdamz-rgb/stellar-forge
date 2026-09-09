"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Bounty } from "@/lib/store";

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bounties")
      .then((r) => r.json())
      .then((d) => setBounties(d.bounties || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="block">
      <div className="container">
        <div className="row-between" style={{ marginBottom: 20 }}>
          <h2 className="section-title">Bounties</h2>
          <Link href="/create" className="btn btn-primary">
            Create a Bounty
          </Link>
        </div>

        {loading ? (
          <div className="grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        ) : bounties.length === 0 ? (
          <div className="notice info">
            No bounties yet. <Link href="/create" style={{ color: "var(--accent)" }}>Create the first one.</Link>
          </div>
        ) : (
          <div className="grid">
            {bounties.map((b) => (
              <Link key={b.id} href={`/bounties/${b.id}`} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span className={`status ${b.status}`}>{b.status}</span>
                  <span className="reward">{b.rewardAmount} XLM</span>
                </div>
                <h3>{b.title}</h3>
                <p>{b.description.slice(0, 120)}{b.description.length > 120 ? "…" : ""}</p>
                <div className="meta-row">
                  <span>◈ {b.githubRepository}</span>
                  {b.escrowId != null && <span>escrow #{b.escrowId}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
