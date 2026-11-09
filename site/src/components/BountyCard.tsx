import Link from "next/link";
import type { Bounty } from "@/lib/store";
import { timeLeft } from "@/lib/lifecycle";

export function StatusPill({ status }: { status: string }) {
  return <span className={`status ${status}`}>{status.toLowerCase()}</span>;
}

export default function BountyCard({
  bounty: b,
  ledger,
}: {
  bounty: Bounty;
  ledger: number | null;
}) {
  const left = b.status === "OPEN" || b.status === "CLAIMED" ? timeLeft(b.deadlineLedger, ledger) : null;
  return (
    <Link href={`/bounties/${b.id}`} className="card bounty-card">
      <div className="card-top">
        <StatusPill status={b.status} />
        <span className="reward">
          {b.rewardAmount} <small>{b.asset}</small>
        </span>
      </div>
      <h3>{b.title}</h3>
      <p className="card-desc">{b.description}</p>
      {b.tech && b.tech.length > 0 && (
        <div className="chips">
          {b.tech.slice(0, 4).map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      )}
      <div className="meta-row">
        <span className="mono">{b.githubRepository}</span>
        {b.demo ? (
          <span className="demo-tag">sample</span>
        ) : (
          b.escrowId != null && <span className="mono">escrow #{b.escrowId}</span>
        )}
        {left && <span className={left === "Deadline passed" ? "late" : ""}>{left}</span>}
      </div>
    </Link>
  );
}
