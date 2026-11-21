import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { decodeEvent, mergeEvents, projectBounty, type RawEvent, type IndexedEvent } from "../src/lib/events";

const sym = (s: string) => xdr.ScVal.scvSymbol(s);
const u64 = (n: number) => nativeToScVal(n, { type: "u64" });
const addr = (a: string) => nativeToScVal(a, { type: "address" });
const i128 = (n: number) => nativeToScVal(n, { type: "i128" });

const creator = Keypair.random().publicKey();
const dev = Keypair.random().publicKey();
const token = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

let seq = 0;
function raw(kind: string, id: number, value: xdr.ScVal, ns = "bounty"): RawEvent {
  seq++;
  return {
    id: `000000${1000 + seq}-0000000001`,
    ledger: 1000 + seq,
    ledgerClosedAt: new Date(1_700_000_000_000 + seq * 5000).toISOString(),
    txHash: `tx${seq}`.padEnd(64, "0"),
    topic: [sym(ns), sym(kind), u64(id)],
    value,
  };
}

const created = raw("created", 7, xdr.ScVal.scvVec([addr(creator), addr(token), i128(250_000_000), nativeToScVal(5000, { type: "u32" })]));
const claimed = raw("claimed", 7, addr(dev));
const unclaimed = raw("unclaimed", 7, addr(dev));
const claimed2 = raw("claimed", 7, addr(dev));
const submitted = raw("submitted", 7, xdr.ScVal.scvVec([addr(dev), xdr.ScVal.scvBytes(Buffer.alloc(32, 0xab))]));
const completed = raw("completed", 7, xdr.ScVal.scvVec([addr(dev), i128(250_000_000)]));

const decodeAll = (rs: RawEvent[]) => rs.map(decodeEvent).filter((e): e is IndexedEvent => !!e);

test("decodes vec and single-value payloads", () => {
  const c = decodeEvent(created)!;
  assert.equal(c.kind, "created");
  assert.equal(c.bountyId, 7);
  assert.equal(c.data.creator, creator);
  assert.equal(c.data.amount, "250000000");
  assert.equal(c.data.deadline, 5000);
  const s = decodeEvent(submitted)!;
  assert.equal(s.data.submissionHash, "ab".repeat(32));
  assert.equal(decodeEvent(claimed)!.data.developer, dev);
});

test("ignores admin and unrelated events", () => {
  const paused: RawEvent = { ...raw("paused", 0, xdr.ScVal.scvBool(true), "admin"), topic: [sym("admin"), sym("paused")] };
  assert.equal(decodeEvent(paused), null);
  assert.equal(decodeEvent(raw("weird", 1, xdr.ScVal.scvVoid())), null);
});

test("projection follows the full lifecycle, including unclaim", () => {
  const p = projectBounty(decodeAll([created, claimed, unclaimed, claimed2, submitted, completed]))!;
  assert.equal(p.status, "COMPLETED");
  assert.equal(p.claimedBy, dev);
  assert.equal(p.deadlineLedger, 5000);
  assert.equal(p.tx.created, created.txHash);
  assert.equal(p.tx.claimed, claimed2.txHash);
  assert.equal(p.tx.approved, completed.txHash);

  const mid = projectBounty(decodeAll([created, claimed, unclaimed]))!;
  assert.equal(mid.status, "OPEN");
  assert.equal(mid.claimedBy, null);
});

test("re-ingesting the same events is idempotent", () => {
  const first = decodeAll([created, claimed, submitted]);
  const once = mergeEvents([], first);
  const twice = mergeEvents(once, decodeAll([claimed, submitted, created]));
  assert.deepEqual(twice, once);
  assert.deepEqual(projectBounty(twice), projectBounty(once));
});

test("merge keeps chain order regardless of arrival order", () => {
  const merged = mergeEvents([], decodeAll([completed, created, submitted]));
  assert.deepEqual(merged.map((e) => e.kind), ["created", "submitted", "completed"]);
});
