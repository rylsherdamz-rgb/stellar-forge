// Bounty lifecycle rules shared by the UI and the API.
//
// Mirrors the state machine enforced by contracts/bounty-escrow. The contract
// remains authoritative; these rules exist so the UI only offers actions the
// contract would accept, and so the API can reject obviously wrong requests
// before asking a wallet to sign anything.

export type BountyStatus =
  | "OPEN"
  | "CLAIMED"
  | "SUBMITTED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "REFUNDED";

export type Action = "create" | "claim" | "submit" | "approve" | "refund" | "cancel";

export const LEDGERS_PER_DAY = 17280; // ~5s ledgers

/** Contract function invoked for each app action. */
export const METHOD_FOR: Record<Action, string> = {
  create: "create_bounty",
  claim: "claim_bounty",
  submit: "submit_bounty",
  approve: "approve_bounty",
  refund: "refund_bounty",
  cancel: "cancel_bounty",
};

/** Status the bounty is in after the action succeeds. */
export const STATUS_AFTER: Record<Action, BountyStatus> = {
  create: "OPEN",
  claim: "CLAIMED",
  submit: "SUBMITTED",
  approve: "COMPLETED",
  refund: "REFUNDED",
  cancel: "CANCELLED",
};

// The contract's Status enum has explicit discriminants, so soroban encodes it
// as a u32 (Open = 0 … Refunded = 7). Order matches contracts/bounty-escrow.
const STATUS_NAMES = ["Open", "Claimed", "Submitted", "Completed", "Cancelled", "Expired", "Disputed", "Refunded"];

export function decodeStatus(v: unknown): string {
  if (typeof v === "number" || typeof v === "bigint") return STATUS_NAMES[Number(v)] ?? `Unknown(${v})`;
  // Defensive: a unit-variant enum would decode as ["Open"].
  if (Array.isArray(v)) return String(v[0]);
  return String(v);
}

/** Map the contract's Status variant name to the app status. */
export function fromOnchainStatus(s: string): BountyStatus | null {
  const map: Record<string, BountyStatus> = {
    Open: "OPEN",
    Claimed: "CLAIMED",
    Submitted: "SUBMITTED",
    Completed: "COMPLETED",
    Cancelled: "CANCELLED",
    Disputed: "DISPUTED",
    Refunded: "REFUNDED",
    Expired: "REFUNDED",
  };
  return map[s] ?? null;
}

export interface ActionContext {
  status: BountyStatus;
  creator: string;
  claimedBy: string | null;
  deadlineLedger: number | null;
  escrowId: number | null;
}

/**
 * Why `who` cannot run `action` right now, or null if allowed.
 * `ledger` is the latest ledger, used for deadline checks when known.
 */
export function blockReason(
  b: ActionContext,
  action: Action,
  who: string | null,
  ledger: number | null = null,
): string | null {
  if (!who) return "Connect a wallet first.";
  const isCreator = who === b.creator;
  const isDev = !!b.claimedBy && who === b.claimedBy;
  const past = ledger != null && b.deadlineLedger != null && ledger > b.deadlineLedger;

  if (action === "create") {
    if (b.escrowId != null) return "This bounty is already funded.";
    if (!isCreator) return "Only the creator can fund this bounty.";
    return null;
  }
  if (b.escrowId == null) return "This bounty has not been funded on-chain yet.";

  switch (action) {
    case "claim":
      if (b.status !== "OPEN") return "Only open bounties can be claimed.";
      if (isCreator) return "Creators cannot claim their own bounty.";
      if (past) return "The deadline has passed.";
      return null;
    case "submit":
      if (b.status !== "CLAIMED") return "Claim the bounty before submitting.";
      if (!isDev) return "Only the developer who claimed this bounty can submit.";
      if (past) return "The deadline has passed.";
      return null;
    case "approve":
      if (b.status !== "SUBMITTED") return "There is no submission to approve.";
      if (!isCreator) return "Only the creator can approve and pay.";
      return null;
    case "cancel":
      if (b.status !== "OPEN") return "Only unclaimed bounties can be cancelled.";
      if (!isCreator) return "Only the creator can cancel.";
      return null;
    case "refund":
      if (b.status !== "OPEN" && b.status !== "CLAIMED") return "This bounty cannot be refunded.";
      if (!isCreator) return "Only the creator can refund.";
      if (ledger != null && !past) return "Refunds unlock after the deadline.";
      return null;
  }
}

/** Ordered steps of the happy path, for progress UIs. */
export const HAPPY_PATH: BountyStatus[] = ["OPEN", "CLAIMED", "SUBMITTED", "COMPLETED"];

export function stepIndex(status: BountyStatus): number {
  return HAPPY_PATH.indexOf(status);
}

/** "3d 4h left", "expired", or null when unknown. */
export function timeLeft(deadlineLedger: number | null, ledger: number | null): string | null {
  if (deadlineLedger == null || ledger == null) return null;
  const remaining = deadlineLedger - ledger;
  if (remaining <= 0) return "Deadline passed";
  const hours = Math.floor((remaining * 5) / 3600);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ${hours % 24}h left`;
  if (hours >= 1) return `${hours}h left`;
  return "< 1h left";
}

export function shortAddr(a: string | null | undefined): string {
  if (!a) return "—";
  return a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
}
