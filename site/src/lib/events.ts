// Pure decoding + projection of bounty-escrow contract events.
//
// Contract events (contracts/bounty-escrow) have topics ("bounty", <kind>, id).
// Decoding and projection are kept free of I/O so they are unit-testable and
// deterministic: re-running them over the same event list always yields the
// same state, which is what makes re-ingest idempotent.

import { scValToNative, xdr } from "@stellar/stellar-sdk";
import type { Bounty, BountyStatus } from "./store";

export type EventKind =
  | "created"
  | "claimed"
  | "unclaimed"
  | "submitted"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed"
  | "rejected"
  | "deadline";

const KINDS = new Set<EventKind>([
  "created",
  "claimed",
  "unclaimed",
  "submitted",
  "completed",
  "cancelled",
  "refunded",
  "disputed",
  "rejected",
  "deadline",
]);

export interface IndexedEvent {
  /** RPC event id (unique, ordered: "<toid>-<index>"). */
  id: string;
  ledger: number;
  closedAt: string;
  txHash: string;
  kind: EventKind;
  bountyId: number;
  /** Decoded payload, JSON-safe (bigints and bytes stringified). */
  data: Record<string, string | number | boolean | null>;
}

export interface RawEvent {
  id: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  topic: xdr.ScVal[];
  value: xdr.ScVal;
}

function jsonSafe(v: unknown): string | number | boolean | null {
  if (v == null) return null;
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") return v;
  if (v instanceof Uint8Array) return Buffer.from(v).toString("hex");
  return String(v);
}

// Field names per event, in the order the contract emits them (data_format
// "vec" => array, "single-value" => one value).
const FIELDS: Record<EventKind, string[]> = {
  created: ["creator", "token", "amount", "deadline"],
  claimed: ["developer"],
  unclaimed: ["developer"],
  submitted: ["developer", "submissionHash"],
  // v0.3 adds the withheld platform fee; v0.2 events simply lack it.
  completed: ["developer", "amount", "fee"],
  cancelled: ["amount"],
  refunded: ["amount"],
  disputed: ["by"],
  rejected: ["reasonHash"],
  deadline: ["deadline"],
};

/** Decode one RPC event, or null if it is not a bounty lifecycle event. */
export function decodeEvent(raw: RawEvent): IndexedEvent | null {
  if (raw.topic.length < 3) return null;
  let ns: unknown, kind: unknown, id: unknown;
  try {
    [ns, kind, id] = raw.topic.slice(0, 3).map((t) => scValToNative(t));
  } catch {
    return null;
  }
  if (ns !== "bounty" || !KINDS.has(kind as EventKind)) return null;
  const k = kind as EventKind;

  let value: unknown;
  try {
    value = scValToNative(raw.value);
  } catch {
    value = null;
  }
  const fields = FIELDS[k];
  const values = fields.length > 1 && Array.isArray(value) ? value : [value];
  const data: IndexedEvent["data"] = {};
  fields.forEach((f, i) => {
    data[f] = jsonSafe(values[i]);
  });

  return {
    id: raw.id,
    ledger: raw.ledger,
    closedAt: raw.ledgerClosedAt,
    txHash: raw.txHash,
    kind: k,
    bountyId: Number(id),
    data,
  };
}

/** Merge new events into a list, deduplicated by id and kept in chain order. */
export function mergeEvents(existing: IndexedEvent[], incoming: IndexedEvent[]): IndexedEvent[] {
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const e of incoming) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => a.ledger - b.ledger || a.id.localeCompare(b.id));
}

const STATUS_AFTER: Partial<Record<EventKind, BountyStatus>> = {
  created: "OPEN",
  claimed: "CLAIMED",
  unclaimed: "OPEN",
  submitted: "SUBMITTED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  disputed: "DISPUTED",
  rejected: "CLAIMED",
};

const TX_KEY: Partial<Record<EventKind, keyof Bounty["tx"]>> = {
  created: "created",
  claimed: "claimed",
  submitted: "submitted",
  completed: "approved",
  cancelled: "cancelled",
  refunded: "refunded",
  rejected: "rejected",
};

/**
 * Project a bounty's chain-ordered events onto the fields the app caches.
 * Returns only the fields the events determine, or null if there are none.
 */
export function projectBounty(
  events: IndexedEvent[],
): Pick<Bounty, "status" | "claimedBy" | "tx" | "deadlineLedger"> | null {
  if (events.length === 0) return null;
  let status: BountyStatus = "OPEN";
  let claimedBy: string | null = null;
  let deadline: number | null = null;
  const tx: Bounty["tx"] = {};
  for (const e of events) {
    const next = STATUS_AFTER[e.kind];
    if (next) status = next;
    if (e.kind === "claimed") claimedBy = String(e.data.developer);
    if (e.kind === "unclaimed") claimedBy = null;
    if (e.kind === "created" || e.kind === "deadline") deadline = Number(e.data.deadline);
    const key = TX_KEY[e.kind];
    if (key) tx[key] = e.txHash;
  }
  return { status, claimedBy, tx, deadlineLedger: deadline };
}
