import type { Bounty } from "@/lib/store";
import { HAPPY_PATH, stepIndex } from "@/lib/lifecycle";

const LABEL: Record<string, { title: string; hint: string }> = {
  OPEN: { title: "Funded", hint: "Reward held in escrow" },
  CLAIMED: { title: "Claimed", hint: "Developer is building" },
  SUBMITTED: { title: "Submitted", hint: "PR awaiting review" },
  COMPLETED: { title: "Paid", hint: "Reward released" },
};

const TX_FOR: Record<string, keyof Bounty["tx"]> = {
  OPEN: "created",
  CLAIMED: "claimed",
  SUBMITTED: "submitted",
  COMPLETED: "approved",
};

/** Horizontal progress through the happy path, with off-path end states. */
export default function Lifecycle({ bounty }: { bounty: Bounty }) {
  const current = stepIndex(bounty.status);
  const offPath = current === -1;
  return (
    <div className="lifecycle">
      <ol className="stepper" aria-label="Bounty progress">
        {HAPPY_PATH.map((s, i) => {
          const state = offPath ? "idle" : i < current || bounty.status === "COMPLETED" ? "done" : i === current ? "now" : "idle";
          const tx = bounty.tx[TX_FOR[s]];
          return (
            <li key={s} className={`step ${state}`} aria-current={state === "now" ? "step" : undefined}>
              <span className="step-dot">{state === "done" ? "✓" : i + 1}</span>
              <span className="step-title">{LABEL[s].title}</span>
              <span className="step-hint">{tx ? `tx ${tx.slice(0, 8)}…` : LABEL[s].hint}</span>
            </li>
          );
        })}
      </ol>
      {offPath && (
        <p className="lifecycle-end">
          This bounty is <strong>{bounty.status.toLowerCase()}</strong>
          {bounty.status === "REFUNDED" || bounty.status === "CANCELLED"
            ? " — the reward went back to the creator."
            : bounty.status === "DISPUTED"
              ? " — the contract admin will resolve it."
              : "."}
        </p>
      )}
    </div>
  );
}
