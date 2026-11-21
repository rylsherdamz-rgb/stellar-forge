import { test, before } from "node:test";
import assert from "node:assert/strict";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { Keypair } from "@stellar/stellar-sdk";
import { migrate, setDbForTests, type Db } from "../src/lib/db/client";
import { createBounty, getBounty, listBounties, updateBounty } from "../src/lib/store";
import { _indexStorage, eventsFor } from "../src/lib/indexer";
import { CONFIG } from "../src/lib/config";

type Exec = PGlite | Transaction;
function wrap(pg: Exec, inTx = false): Db {
  return {
    query: async <T>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows,
    exec: async (text: string) => {
      await pg.exec(text);
    },
    tx: async (fn) => (inTx ? fn(wrap(pg, true)) : (pg as PGlite).transaction((t) => fn(wrap(t, true)))),
  };
}

const pg = new PGlite();
const db = wrap(pg);
const creator = Keypair.random().publicKey();
const dev = Keypair.random().publicKey();
const hash = (c: string) => c.repeat(64);

before(async () => {
  setDbForTests(db);
  assert.deepEqual(await migrate(db), ["0001_init.sql"]);
});

test("migrations are applied once", async () => {
  assert.deepEqual(await migrate(db), []);
});

test("RLS is enabled on every table", async () => {
  const rows = await db.query<{ relname: string; relrowsecurity: boolean }>(
    "select relname, relrowsecurity from pg_class where relname = any($1)",
    [["users", "bounties", "submissions", "transactions", "contract_events", "indexer_state"]],
  );
  assert.equal(rows.length, 6);
  for (const r of rows) assert.equal(r.relrowsecurity, true, r.relname);
});

test("bounty lifecycle round-trips through Postgres", async () => {
  const b = await createBounty({
    escrowId: null,
    title: "Fix nav",
    description: "d",
    requirements: "r",
    acceptanceCriteria: "c",
    githubRepository: "alice/app",
    tech: ["React", "TS"],
    rewardAmount: "25",
    asset: "XLM",
    deadlineLedger: 5000,
    creator,
  });
  assert.equal(b.status, "OPEN");
  assert.equal(b.rewardAmount, "25");
  assert.deepEqual(b.tech, ["React", "TS"]);

  await updateBounty(b.id, { escrowId: 3, metadataHash: hash("a"), tx: { created: hash("1") } });
  await updateBounty(b.id, { status: "CLAIMED", claimedBy: dev, tx: { claimed: hash("2") } });
  const submission = {
    githubPrUrl: "https://github.com/alice/app/pull/9",
    description: "done",
    developer: dev,
    githubLogin: "bob",
    submittedAt: new Date().toISOString(),
    verified: true,
    verifyReasons: [],
    submissionHash: hash("b"),
  };
  await updateBounty(b.id, { status: "SUBMITTED", submission, tx: { submitted: hash("3") } });
  const done = (await updateBounty(b.id, { status: "COMPLETED", tx: { approved: hash("4") } }))!;

  assert.equal(done.escrowId, 3);
  assert.equal(done.claimedBy, dev);
  assert.equal(done.submission?.githubPrUrl, submission.githubPrUrl);
  assert.equal(done.submission?.verified, true);
  assert.deepEqual(done.tx, { created: hash("1"), claimed: hash("2"), submitted: hash("3"), approved: hash("4") });
  assert.deepEqual(await getBounty(b.id), done);
  assert.equal((await listBounties()).length, 1);

  const users = await db.query<{ wallet_address: string; github_username: string | null }>(
    "select wallet_address, github_username from users order by wallet_address",
  );
  assert.equal(users.length, 2);
  assert.equal(users.find((u) => u.wallet_address === dev)?.github_username, "bob");

  const release = await db.query<{ type: string; amount: string }>(
    "select type, amount from transactions where tx_hash = $1",
    [hash("4")],
  );
  assert.equal(release[0].type, "BOUNTY_RELEASE");
  assert.equal(Number(release[0].amount), 25);
});

test("financial rows require a real tx hash", async () => {
  const [b] = await listBounties();
  await assert.rejects(
    db.query("insert into transactions (tx_hash, bounty_id, type) values ($1, $2, 'REFUND')", ["not-a-hash", b.id]),
  );
});

test("updating an unknown bounty returns null", async () => {
  assert.equal(await updateBounty("nope", { status: "OPEN" }), null);
});

test("indexer storage is idempotent in Postgres", async () => {
  const ev = {
    id: "0000001-0000000001",
    ledger: 1001,
    closedAt: new Date().toISOString(),
    txHash: hash("c"),
    kind: "created" as const,
    bountyId: 3,
    data: { amount: "250000000" },
  };
  const state = { contractId: CONFIG.contractId, cursor: "c1", lastLedger: 1001, syncedAt: new Date().toISOString(), events: [ev] };
  await _indexStorage.save(state);
  await _indexStorage.save(state);
  const loaded = await _indexStorage.load();
  assert.equal(loaded.cursor, "c1");
  assert.equal(loaded.events.length, 1);
  assert.deepEqual((await eventsFor(3))[0].data, { amount: "250000000" });
});
