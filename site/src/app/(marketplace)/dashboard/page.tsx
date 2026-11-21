"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { explorerTx } from "@/lib/config";
import type { Bounty } from "@/lib/store";

type Role = "creator" | "developer";

// What the connected wallet should do next on a bounty, if anything.
function nextStep(b: Bounty, role: Role): string | null {
  if (role === "creator") {
    if (b.status === "SUBMITTED") return "Review submission";
    if (b.status === "DISPUTED") return "Awaiting admin resolution";
    if (b.escrowId == null && !b.tx.created) return "Not funded on-chain";
    return null;
  }
  if (b.status === "CLAIMED") return "Submit your pull request";
  if (b.status === "SUBMITTED") return "Waiting for creator review";
  if (b.status === "DISPUTED") return "Awaiting admin resolution";
  return null;
}

function sumXlm(list: Bounty[]): string {
  const total = list.reduce((acc, b) => acc + Number(b.rewardAmount || 0), 0);
  return total.toLocaleString(undefined, { maximumFractionDigits: 7 });
}

function Row({ b, role }: { b: Bounty; role: Role }) {
  const step = nextStep(b, role);
  const lastTx = b.tx.approved || b.tx.refunded || b.tx.cancelled || b.tx.submitted || b.tx.claimed || b.tx.created;
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className={`status ${b.status}`}>{b.status}</span>
        <span className="reward">{b.rewardAmount} {b.asset}</span>
      </div>
      <h3 style={{ margin: 0 }}>
        <Link href={`/bounties/${b.id}`}>{b.title}</Link>
      </h3>
      <div className="meta-row" style={{ marginTop: 0 }}>
        <span>◈ {b.githubRepository}</span>
        {b.escrowId != null && <span>escrow #{b.escrowId}</span>}
        {lastTx && (
          <a className="tx-link" href={explorerTx(lastTx)} target="_blank" rel="noreferrer">
            last tx {lastTx.slice(0, 8)}…
          </a>
        )}
      </div>
      {step && (
        <Link
          href={b.status === "CLAIMED" && role === "developer" ? `/bounties/${b.id}/submit` : `/bounties/${b.id}`}
          className={`btn ${step.startsWith("Review") || step.startsWith("Submit") ? "btn-primary" : "btn-secondary"}`}
          style={{ alignSelf: "flex-start" }}
        >
          {step}
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { address, connect, connecting } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [chosenRole, setRole] = useState<Role | null>(null);

  useEffect(() => {
    fetch("/api/bounties")
      .then((r) => r.json())
      .then((d) => setBounties(d.bounties || []))
      .finally(() => setLoading(false));
  }, []);

  const created = useMemo(() => bounties.filter((b) => b.creator === address), [bounties, address]);
  const claimed = useMemo(() => bounties.filter((b) => b.claimedBy === address), [bounties, address]);

  // Default to the developer tab when this wallet only has claims.
  const role: Role =
    chosenRole ?? (created.length === 0 && claimed.length > 0 ? "developer" : "creator");

  if (!address) {
    return (
      <section className="block">
        <div className="container" style={{ maxWidth: 560 }}>
          <h2 className="section-title">Dashboard</h2>
          <p style={{ color: "var(--text-dim)" }}>
            Connect your Stellar wallet to see the bounties you created and the ones you are working on.
          </p>
          <button className="btn btn-primary" onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </div>
      </section>
    );
  }

  const list = role === "creator" ? created : claimed;
  const actionable = list.filter((b) => {
    const s = nextStep(b, role);
    return s === "Review submission" || s === "Submit your pull request";
  });
  const settled = (role === "creator" ? created : claimed).filter((b) => b.status === "COMPLETED");

  const stats =
    role === "creator"
      ? [
          { label: "Created", value: String(created.length) },
          { label: "Needs review", value: String(actionable.length) },
          {
            label: "In escrow",
            value: `${sumXlm(created.filter((b) => ["OPEN", "CLAIMED", "SUBMITTED", "DISPUTED"].includes(b.status)))} XLM`,
          },
          { label: "Paid out", value: `${sumXlm(settled)} XLM` },
        ]
      : [
          { label: "Claimed", value: String(claimed.length) },
          { label: "To submit", value: String(actionable.length) },
          { label: "In review", value: String(claimed.filter((b) => b.status === "SUBMITTED").length) },
          { label: "Earned", value: `${sumXlm(settled)} XLM` },
        ];

  // Bounties needing this wallet's action first, then newest.
  const sorted = [...list].sort((a, b) => {
    const pa = actionable.includes(a) ? 0 : 1;
    const pb = actionable.includes(b) ? 0 : 1;
    return pa - pb || b.updatedAt.localeCompare(a.updatedAt);
  });

  return (
    <section className="block">
      <div className="container">
        <div className="row-between" style={{ marginBottom: 20 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {(["creator", "developer"] as Role[]).map((r) => (
              <button
                key={r}
                className={`btn ${role === r ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setRole(r)}
                aria-pressed={role === r}
              >
                {r === "creator" ? `As creator (${created.length})` : `As developer (${claimed.length})`}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="notice info">
            {role === "creator" ? (
              <>You have not created any bounties. <Link href="/create" style={{ color: "var(--accent)" }}>Create one.</Link></>
            ) : (
              <>You have not claimed any bounties. <Link href="/bounties" style={{ color: "var(--accent)" }}>Browse open bounties.</Link></>
            )}
          </div>
        ) : (
          <div className="grid">
            {sorted.map((b) => <Row key={b.id} b={b} role={role} />)}
          </div>
        )}

        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 24 }}>
          Balances and payouts are settled by the Soroban escrow contract. Open a bounty to re-sync its status from chain.
        </p>
      </div>
    </section>
  );
}
