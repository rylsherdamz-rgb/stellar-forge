"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { runAction } from "@/lib/actions";
import { explorerTx } from "@/lib/config";
import type { Bounty } from "@/lib/store";

const EVENT_STATUS: Record<string, string> = {
  created: "OPEN",
  claimed: "CLAIMED",
  unclaimed: "OPEN",
  submitted: "SUBMITTED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  disputed: "DISPUTED",
  deadline: "CLAIMED",
};

export default function BountyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, connect } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const [aiEnabled, setAiEnabled] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  useEffect(() => {
    fetch("/api/ai/status").then((r) => r.json()).then((d) => setAiEnabled(!!d.enabled)).catch(() => {});
  }, []);

  async function aiReview(refresh = false) {
    setError(null);
    setReviewing(true);
    try {
      const res = await fetch("/api/ai/analyze-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId: id, refresh }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      setBounty((b) => (b ? { ...b, aiReview: data.review } : b));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setReviewing(false);
    }
  }

  type ChainEvent = { id: string; kind: string; ledger: number; closedAt: string; txHash: string; explorer: string; data: Record<string, unknown> };
  const [events, setEvents] = useState<ChainEvent[]>([]);
  useEffect(() => {
    fetch(`/api/bounties/${id}/events`).then((r) => r.json()).then((d) => setEvents(d.events || [])).catch(() => {});
  }, [id, lastTx]);

  const load = () =>
    fetch(`/api/bounties/${id}?sync=1`).then((r) => r.json()).then((d) => setBounty(d.bounty));

  useEffect(() => { load(); }, [id]);

  async function act(action: "claim" | "approve" | "refund" | "cancel") {
    setError(null); setLastTx(null);
    if (!address) { await connect(); return; }
    setBusy(true);
    try {
      const { txHash } = await runAction(id, action, address);
      setLastTx(txHash);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!bounty) {
    return <section className="block"><div className="container"><p style={{ color: "var(--text-dim)" }}>Loading…</p></div></section>;
  }

  const isCreator = address && address === bounty.creator;
  const isClaimer = address && address === bounty.claimedBy;

  return (
    <section className="block">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="detail">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <span className={`status ${bounty.status}`}>{bounty.status}</span>
            <span className="reward">{bounty.rewardAmount} XLM</span>
          </div>
          <h1>{bounty.title}</h1>
          <div className="meta-row">
            <span>◈ {bounty.githubRepository}</span>
            {bounty.escrowId != null && <span>escrow #{bounty.escrowId}</span>}
            <span>creator {bounty.creator.slice(0, 6)}…</span>
          </div>

          <div className="label">Description</div>
          <pre>{bounty.description}</pre>
          <div className="label">Requirements</div>
          <pre>{bounty.requirements}</pre>
          <div className="label">Acceptance criteria</div>
          <pre>{bounty.acceptanceCriteria}</pre>

          {bounty.submission && (
            <>
              <div className="label">Submission</div>
              <p style={{ margin: "0 0 6px" }}>
                <a className="tx-link" href={bounty.submission.githubPrUrl} target="_blank" rel="noreferrer">
                  {bounty.submission.githubPrUrl}
                </a>
              </p>
              {bounty.submission.verified === true && (
                <div className="notice ok">✓ PR verified against {bounty.githubRepository}</div>
              )}
              {bounty.submission.verified === false && (
                <div className="notice err">
                  PR not verified: {bounty.submission.verifyReasons?.join("; ")}
                </div>
              )}
            </>
          )}

          {bounty.submission && isCreator && aiEnabled && (
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <strong>AI first-pass review</strong>
                <button className="btn btn-secondary" onClick={() => aiReview(!!bounty.aiReview)} disabled={reviewing}>
                  {reviewing ? "Reviewing…" : bounty.aiReview ? "Re-run" : "Review against criteria"}
                </button>
              </div>
              {bounty.aiReview && bounty.aiReview.prUrl === bounty.submission.githubPrUrl && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ margin: "0 0 8px" }}>
                    <span className={`status ${bounty.aiReview.verdict === "likely_meets" ? "COMPLETED" : bounty.aiReview.verdict === "unclear" ? "CLAIMED" : "DISPUTED"}`}>
                      {bounty.aiReview.verdict.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p style={{ margin: "0 0 10px" }}>{bounty.aiReview.summary}</p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {bounty.aiReview.criteria.map((c, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        <strong>{c.status === "met" ? "✓" : c.status === "not_met" ? "✗" : "?"}</strong> {c.criterion}
                        <span style={{ color: "var(--text-dim)" }}> - {c.note}</span>
                      </li>
                    ))}
                  </ul>
                  {bounty.aiReview.concerns.length > 0 && (
                    <div className="notice err" style={{ marginBottom: 0 }}>
                      {bounty.aiReview.concerns.join(" · ")}
                    </div>
                  )}
                </div>
              )}
              <small style={{ display: "block", color: "var(--text-dim)", marginTop: 10 }}>
                Advisory only. The assistant cannot approve or pay; you decide, and only your signature releases funds.
              </small>
            </div>
          )}

          {error && <div className="notice err">{error}</div>}
          {lastTx && (
            <div className="notice ok">
              Settled on Stellar ·{" "}
              <a className="tx-link" href={explorerTx(lastTx)} target="_blank" rel="noreferrer">
                view transaction
              </a>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            {bounty.status === "OPEN" && !isCreator && (
              <button className="btn btn-primary" onClick={() => act("claim")} disabled={busy}>
                {busy ? "Working…" : "Claim Bounty"}
              </button>
            )}
            {bounty.status === "CLAIMED" && isClaimer && (
              <Link href={`/bounties/${id}/submit`} className="btn btn-primary">
                Submit Proof of Work
              </Link>
            )}
            {bounty.status === "SUBMITTED" && isCreator && (
              <button className="btn btn-primary" onClick={() => act("approve")} disabled={busy}>
                {busy ? "Releasing…" : "Approve & Pay"}
              </button>
            )}
            {bounty.status === "OPEN" && isCreator && (
              <button className="btn btn-secondary" onClick={() => act("cancel")} disabled={busy}>
                Cancel & Refund
              </button>
            )}
            {(bounty.status === "OPEN" || bounty.status === "CLAIMED") && isCreator && (
              <button className="btn btn-secondary" onClick={() => act("refund")} disabled={busy}>
                Refund (after deadline)
              </button>
            )}
          </div>

          {events.length > 0 ? (
            <>
              <div className="label" style={{ marginTop: 24 }}>On-chain history</div>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {events.map((e) => (
                  <li key={e.id} style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span className={`status ${EVENT_STATUS[e.kind] ?? "OPEN"}`}>{e.kind}</span>
                    <span style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                      {new Date(e.closedAt).toLocaleString()} · ledger {e.ledger}
                    </span>
                    <a className="tx-link" href={e.explorer} target="_blank" rel="noreferrer">
                      {e.txHash.slice(0, 12)}…
                    </a>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            Object.values(bounty.tx).some(Boolean) && (
              <>
                <div className="label" style={{ marginTop: 24 }}>On-chain transactions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {Object.entries(bounty.tx).map(([k, h]) =>
                    h ? (
                      <a key={k} className="tx-link" href={explorerTx(h)} target="_blank" rel="noreferrer">
                        {k}: {h.slice(0, 16)}…
                      </a>
                    ) : null,
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </section>
  );
}
