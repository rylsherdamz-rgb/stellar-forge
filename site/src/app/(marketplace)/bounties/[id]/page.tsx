"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { runAction } from "@/lib/actions";
import { explorerTx } from "@/lib/config";
import type { Bounty } from "@/lib/store";

export default function BountyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, connect } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const load = () =>
    fetch(`/api/bounties/${id}`).then((r) => r.json()).then((d) => setBounty(d.bounty));

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

          {(bounty.tx.created || bounty.tx.approved || bounty.tx.refunded) && (
            <div className="label" style={{ marginTop: 24 }}>On-chain transactions</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.entries(bounty.tx).map(([k, h]) =>
              h ? (
                <a key={k} className="tx-link" href={explorerTx(h)} target="_blank" rel="noreferrer">
                  {k}: {h.slice(0, 16)}…
                </a>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
