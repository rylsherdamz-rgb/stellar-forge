// Contract event indexer (SPEC §33).
//
// Pulls bounty-escrow events from Soroban RPC, stores them deduplicated by
// event id, and re-projects every linked bounty from its full event history.
// Safe to run any number of times: same events in, same state out.
//
// Storage follows the metadata layer (JSON under ./data); swap with #12.

import { promises as fs } from "fs";
import path from "path";
import { rpc } from "@stellar/stellar-sdk";
import { CONFIG } from "./config";
import { decodeEvent, mergeEvents, projectBounty, type IndexedEvent, type RawEvent } from "./events";
import { listBounties, updateBounty } from "./store";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "events.json");
const PAGE = 200;
const MAX_PAGES = 20;
// Public RPC keeps roughly 7 days of events; start a cold index a bit inside that.
const COLD_START_LEDGERS = 17_280 * 6;

interface IndexState {
  contractId: string;
  cursor: string | null;
  lastLedger: number | null;
  syncedAt: string | null;
  events: IndexedEvent[];
}

async function load(): Promise<IndexState> {
  try {
    const s = JSON.parse(await fs.readFile(FILE, "utf8")) as IndexState;
    // A different contract id means a redeploy: start a fresh index.
    if (s.contractId === CONFIG.contractId) return s;
  } catch {
    /* first run */
  }
  return { contractId: CONFIG.contractId, cursor: null, lastLedger: null, syncedAt: null, events: [] };
}

async function save(s: IndexState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(s, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export async function eventsFor(bountyId: number): Promise<IndexedEvent[]> {
  const s = await load();
  return s.events.filter((e) => e.bountyId === bountyId);
}

export async function indexStatus(): Promise<{ lastLedger: number | null; syncedAt: string | null; events: number }> {
  const s = await load();
  return { lastLedger: s.lastLedger, syncedAt: s.syncedAt, events: s.events.length };
}

let inflight: Promise<SyncResult> | null = null;

export interface SyncResult {
  fetched: number;
  added: number;
  updatedBounties: number;
  lastLedger: number | null;
}

/** Sync once; concurrent callers share the same run. */
export function syncEvents(): Promise<SyncResult> {
  inflight ??= runSync().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Sync only if the last sync is older than `maxAgeMs`. */
export async function syncIfStale(maxAgeMs = 60_000): Promise<void> {
  const s = await load();
  if (s.syncedAt && Date.now() - Date.parse(s.syncedAt) < maxAgeMs) return;
  await syncEvents().catch(() => {
    /* best-effort: stale cache is still served */
  });
}

async function fetchPage(
  server: rpc.Server,
  from: { cursor: string } | { startLedger: number },
): Promise<rpc.Api.GetEventsResponse> {
  const filters = [{ type: "contract" as const, contractIds: [CONFIG.contractId] }];
  return "cursor" in from
    ? server.getEvents({ filters, cursor: from.cursor, limit: PAGE })
    : server.getEvents({ filters, startLedger: from.startLedger, limit: PAGE });
}

async function runSync(): Promise<SyncResult> {
  const server = new rpc.Server(CONFIG.rpcUrl, { allowHttp: false });
  const state = await load();
  const before = state.events.length;

  let from: { cursor: string } | { startLedger: number };
  if (state.cursor) {
    from = { cursor: state.cursor };
  } else {
    const { sequence } = await server.getLatestLedger();
    from = { startLedger: Math.max(1, sequence - COLD_START_LEDGERS) };
  }

  const fresh: IndexedEvent[] = [];
  let fetched = 0;
  let latest = state.lastLedger;
  for (let page = 0; page < MAX_PAGES; page++) {
    let res: rpc.Api.GetEventsResponse;
    try {
      res = await fetchPage(server, from);
    } catch (e) {
      // Cursor fell out of RPC retention: restart from the retention window.
      if ("cursor" in from && /cursor|range|retention|ledger/i.test(String(e))) {
        const { sequence } = await server.getLatestLedger();
        from = { startLedger: Math.max(1, sequence - COLD_START_LEDGERS) };
        continue;
      }
      throw e;
    }
    latest = res.latestLedger;
    fetched += res.events.length;
    for (const ev of res.events) {
      // Events from a failed invocation never changed state.
      if (ev.inSuccessfulContractCall === false) continue;
      const decoded = decodeEvent(ev as RawEvent);
      if (decoded) fresh.push(decoded);
    }
    if (res.cursor) from = { cursor: res.cursor };
    state.cursor = res.cursor ?? state.cursor;
    if (res.events.length < PAGE) break;
  }

  state.events = mergeEvents(state.events, fresh);
  state.lastLedger = latest;
  state.syncedAt = new Date().toISOString();
  await save(state);

  const updatedBounties = await projectAll(state.events);
  return { fetched, added: state.events.length - before, updatedBounties, lastLedger: latest };
}

/** Re-project every app bounty that is linked to an on-chain id. */
async function projectAll(events: IndexedEvent[]): Promise<number> {
  const byBounty = new Map<number, IndexedEvent[]>();
  for (const e of events) {
    const list = byBounty.get(e.bountyId) ?? [];
    list.push(e);
    byBounty.set(e.bountyId, list);
  }
  let updated = 0;
  for (const b of await listBounties()) {
    if (b.escrowId == null) continue;
    const p = projectBounty(byBounty.get(b.escrowId) ?? []);
    if (!p) continue;
    const changed =
      p.status !== b.status ||
      p.claimedBy !== b.claimedBy ||
      Object.entries(p.tx).some(([k, v]) => b.tx[k as keyof typeof b.tx] !== v);
    if (!changed) continue;
    await updateBounty(b.id, {
      status: p.status,
      onchainStatus: p.status,
      claimedBy: p.claimedBy,
      tx: p.tx,
      ...(p.deadlineLedger ? { deadlineLedger: p.deadlineLedger } : {}),
    });
    updated++;
  }
  return updated;
}
