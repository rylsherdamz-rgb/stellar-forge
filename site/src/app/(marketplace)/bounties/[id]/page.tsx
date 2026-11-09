"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { StatusPill } from "@/components/BountyCard";
import Lifecycle from "@/components/Lifecycle";
import { useChain } from "@/hooks/useChain";
import { runAction, PHASE_LABEL, type Phase } from "@/lib/actions";
import { CONFIG, explorerContract, explorerTx } from "@/lib/config";
import { blockReason, shortAddr, timeLeft, type Action } from "@/lib/lifecycle";
import type { Bounty } from "@/lib/store";

type Btn = { action: Action; label: string; kind: "primary" | "secondary" };

// The single "next step" for each status, in priority order per role.
const BUTTONS: Btn[] = [
  { action: "create", label: "Fund escrow", kind: "primary" },
  { action: "claim", label: "Claim bounty", kind: "primary" },
  { action: "approve", label: "Approve & pay", kind: "primary" },
  { action: "cancel", label: "Cancel & refund", kind: "secondary" },
  { action: "refund", label: "Refund after deadline", kind: "secondary" },
];

export default function BountyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, connect } = useWallet();
  const { chain } = useChain();
  const ledger = chain?.latestLedger ?? null;
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [missing, setMissing] = useState(false);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetch(`/api/bounties/${id}`)
        .then((r) => {
          if (r.status === 404) setMissing(true);
          return r.json();
        })
        .then((d) => d.bounty && setBounty(d.bounty)),
    [id],
  );
  useEffect(() => {
    load().then(() => {
      if (new URLSearchParams(window.location.search).get("fund") === "retry") {
        setError("Details saved, but the escrow was not funded. Use “Fund escrow” to try again.");
      }
    });
  }, [load]);

  async function act(action: Action) {
    setError(null);
    setLastTx(null);
    const who = address ?? (await connect());
    if (!who) return;
    try {
      const { txHash } = await runAction(id, action, who, {}, setPhase);
      setLastTx(txHash);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setPhase(null);
    }
  }

  if (missing) {
    return (
      <section className="block"><div className="container empty">
        <p>That bounty does not exist.</p>
        <Link href="/bounties" className="btn btn-secondary">Back to bounties</Link>
      </div></section>
    );
  }
  if (!bounty) {
    return (
      <section className="block"><div className="container detail-layout">
        <div className="skeleton tall" /><div className="skeleton" />
      </div></section>
    );
  }

  const role = !address ? null : address === bounty.creator ? "creator" : address === bounty.claimedBy ? "developer" : "visitor";
  const available = bounty.demo ? [] : BUTTONS.filter((b) => !blockReason(bounty, b.action, address, ledger));
  const canSubmit = !bounty.demo && !blockReason(bounty, "submit", address, ledger);
  const settled = ["COMPLETED", "REFUNDED", "CANCELLED"].includes(bounty.status);
  const left = bounty.status === "OPEN" || bounty.status === "CLAIMED" ? timeLeft(bounty.deadlineLedger, ledger) : null;

  return (
    <section className="block">
      <div className="container">
        <Link href="/bounties" className="back">← All bounties</Link>
        <div className="detail-layout">
          <article className="detail">
            <div className="detail-head">
              <StatusPill status={bounty.status} />
              {bounty.demo && <span className="demo-tag">sample listing</span>}
            </div>
            <h1>{bounty.title}</h1>
            <div className="meta-row">
              <a className="mono" href={`https://github.com/${bounty.githubRepository}`} target="_blank" rel="noreferrer">
                {bounty.githubRepository} ↗
              </a>
              {(bounty.tech ?? []).map((t) => <span key={t} className="chip">{t}</span>)}
            </div>

            <Lifecycle bounty={bounty} />

            <h2 className="label">Description</h2>
            <p className="prose">{bounty.description}</p>
            <h2 className="label">Requirements</h2>
            <p className="prose">{bounty.requirements}</p>
            <h2 className="label">Acceptance criteria</h2>
            <p className="prose">{bounty.acceptanceCriteria}</p>

            {bounty.submission && (
              <>
                <h2 className="label">Submission</h2>
                <div className="submission">
                  <a className="tx-link mono" href={bounty.submission.githubPrUrl} target="_blank" rel="noreferrer">
                    {bounty.submission.githubPrUrl.replace("https://github.com/", "")} ↗
                  </a>
                  {bounty.submission.description && <p className="prose">{bounty.submission.description}</p>}
                  {bounty.submission.verified === true && (
                    <div className="notice ok">✓ PR exists in {bounty.githubRepository} and the author matches.</div>
                  )}
                  {bounty.submission.verified === false && (
                    <div className="notice warn">
                      Not verified: {bounty.submission.verifyReasons?.join("; ")}. Review the PR before approving.
                    </div>
                  )}
                </div>
              </>
            )}
          </article>

          <aside className="side">
            <div className="panel reward-panel">
              <span className="stat-k">Reward</span>
              <div className="big-reward mono">{bounty.rewardAmount} <small>{bounty.asset}</small></div>
              <span className="dim small">
                {bounty.demo
                  ? "Sample listing — not escrowed"
                  : bounty.escrowId == null
                    ? "Not funded yet"
                    : bounty.status === "COMPLETED"
                      ? "Paid to the developer"
                      : bounty.status === "REFUNDED" || bounty.status === "CANCELLED"
                        ? "Returned to the creator"
                        : "Held by the escrow contract"}
              </span>
            </div>

            <div className="panel">
              {bounty.demo ? (
                <>
                  <p className="small">
                    This is a sample so you can see how listings look. It has no escrow behind it,
                    so actions are disabled.
                  </p>
                  <Link href="/create" className="btn btn-primary block-btn">Post a real bounty</Link>
                </>
              ) : settled ? (
                <p className="small">
                  {bounty.status === "COMPLETED"
                    ? "Settled — the contract released the reward to the developer. Every step is linked below."
                    : "Closed — the reward went back to the creator."}
                  {role && <> You were the <strong>{role}</strong>.</>}
                </p>
              ) : (
                <>
                  {role && <p className="small dim">You are the <strong>{role}</strong>.</p>}
                  {!address && <p className="small dim">Connect a wallet to take part.</p>}
                  <div className="actions">
                    {canSubmit && (
                      <Link href={`/bounties/${id}/submit`} className="btn btn-primary block-btn">Submit proof of work</Link>
                    )}
                    {available.map((b) => (
                      <button key={b.action} className={`btn btn-${b.kind} block-btn`} onClick={() => act(b.action)} disabled={!!phase}>
                        {b.label}
                      </button>
                    ))}
                    {!address && (
                      <button className="btn btn-primary block-btn" onClick={connect}>Connect wallet</button>
                    )}
                    {address && available.length === 0 && !canSubmit && (
                      <p className="small dim">
                        {blockReason(bounty, bounty.status === "OPEN" ? "claim" : bounty.status === "SUBMITTED" ? "approve" : "submit", address, ledger) ?? "Nothing to do right now."}
                      </p>
                    )}
                  </div>
                  {phase && <div className="notice info" role="status"><span className="spinner" /> {PHASE_LABEL[phase]}</div>}
                  {error && <div className="notice err" role="alert">{error}</div>}
                  {lastTx && (
                    <div className="notice ok" role="status">
                      Confirmed on Stellar · <a className="tx-link" href={explorerTx(lastTx)} target="_blank" rel="noreferrer">view transaction ↗</a>
                    </div>
                  )}
                </>
              )}
            </div>

            <dl className="panel facts">
              <div><dt>Escrow ID</dt><dd className="mono">{bounty.escrowId != null ? `#${bounty.escrowId}` : "—"}</dd></div>
              <div><dt>Creator</dt><dd className="mono" title={bounty.creator}>{shortAddr(bounty.creator)}</dd></div>
              <div><dt>Developer</dt><dd className="mono" title={bounty.claimedBy ?? ""}>{shortAddr(bounty.claimedBy)}</dd></div>
              <div><dt>Deadline</dt><dd>{bounty.deadlineLedger ? <><span className="mono">#{bounty.deadlineLedger.toLocaleString()}</span>{left && <span className="dim"> · {left}</span>}</> : "—"}</dd></div>
              <div><dt>Contract</dt><dd><a className="tx-link mono" href={explorerContract(CONFIG.contractId)} target="_blank" rel="noreferrer">{shortAddr(CONFIG.contractId)} ↗</a></dd></div>
              {Object.entries(bounty.tx).filter(([, h]) => h).map(([k, h]) => (
                <div key={k}><dt>{k[0].toUpperCase() + k.slice(1)} tx</dt><dd><a className="tx-link mono" href={explorerTx(h!)} target="_blank" rel="noreferrer">{h!.slice(0, 10)}… ↗</a></dd></div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
