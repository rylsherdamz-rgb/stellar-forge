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
import { dbEnabled, getDb } from "./db/client";

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
  if (dbEnabled()) return pgLoad();
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
  if (dbEnabled()) return pgSave(s);
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(s, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

// ---- Postgres backend (contract_events + indexer_state) ----

async function pgLoad(): Promise<IndexState> {
  const db = await getDb();
  const [st] = await db.query<{ cursor: string | null; last_ledger: number | null; synced_at: string | Date | null }>(
    "select cursor, last_ledger, synced_at from indexer_state where contract_id = $1",
    [CONFIG.contractId],
  );
  const rows = await db.query<{
    id: string; ledger: number; closed_at: string | Date; tx_hash: string; kind: string; escrow_id: string | number;
    data: IndexedEvent["data"] | string;
  }>(
    "select id, ledger, closed_at, tx_hash, kind, escrow_id, data from contract_events where contract_id = $1 order by ledger, id",
    [CONFIG.contractId],
  );
  const iso = (v: string | Date) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString());
  return {
    contractId: CONFIG.contractId,
    cursor: st?.cursor ?? null,
    lastLedger: st?.last_ledger ?? null,
    syncedAt: st?.synced_at ? iso(st.synced_at) : null,
    events: rows.map((r) => ({
      id: r.id,
      ledger: r.ledger,
      closedAt: iso(r.closed_at),
      txHash: r.tx_hash,
      kind: r.kind as IndexedEvent["kind"],
      bountyId: Number(r.escrow_id),
      data: typeof r.data === "string" ? JSON.parse(r.data) : r.data,
    })),
  };
}

async function pgSave(s: IndexState): Promise<void> {
  const db = await getDb();
  await db.tx(async (t) => {
    for (const e of s.events) {
      await t.query(
        `insert into contract_events (id, contract_id, ledger, closed_at, tx_hash, kind, escrow_id, data)
         values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing`,
        [e.id, s.contractId, e.ledger, e.closedAt, e.txHash, e.kind, e.bountyId, JSON.stringify(e.data)],
      );
    }
    await t.query(
      `insert into indexer_state (contract_id, cursor, last_ledger, synced_at) values ($1,$2,$3,$4)
       on conflict (contract_id) do update set cursor = excluded.cursor,
         last_ledger = excluded.last_ledger, synced_at = excluded.synced_at`,
      [s.contractId, s.cursor, s.lastLedger, s.syncedAt],
    );
  });
}

/** Exposed for tests: storage round-trip without RPC. */
export const _indexStorage = { load, save };

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
