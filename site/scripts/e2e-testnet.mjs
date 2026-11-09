#!/usr/bin/env node
// End-to-end lifecycle test against a running site + live Stellar testnet.
//
//   npm run build && npm start            # in another shell
//   node scripts/e2e-testnet.mjs          # BASE=http://localhost:3000 by default
//
// Creates two throwaway Friendbot-funded accounts and plays both wallets:
// the script signs the XDRs the app builds, exactly like a browser wallet
// would. Walks create -> claim -> submit -> approve through the app's own API,
// checks the contract state after each step, and checks that the API refuses
// actions the contract would reject. Uses testnet XLM only.
//
// Scenario 2 covers the v0.2 calls: release a claim, re-claim, extend the
// deadline, submit, dispute. With ADMIN_SECRET set (the contract admin key)
// it also resolves the dispute on-chain and checks the app syncs it on read.

import {
  Keypair, TransactionBuilder, Networks, rpc, Contract, BASE_FEE, nativeToScVal,
} from "@stellar/stellar-sdk";
import assert from "node:assert/strict";

const BASE = process.env.BASE || "http://localhost:3000";
const REWARD = "1.5";

const log = (...a) => console.log("•", ...a);
const json = async (res) => ({ status: res.status, body: await res.json() });

async function api(path, body) {
  return json(
    await fetch(`${BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

async function fund(kp) {
  const r = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
  if (!r.ok) throw new Error(`friendbot failed for ${kp.publicKey()}: ${r.status}`);
}

/** build -> sign locally -> confirm; mirrors src/lib/actions.ts. */
async function act(bountyId, action, kp, extra = {}) {
  const built = await api(`/api/bounties/${bountyId}/build`, { action, address: kp.publicKey(), ...extra });
  if (built.status !== 200) return built;
  const tx = TransactionBuilder.fromXDR(built.body.xdr, Networks.TESTNET);
  tx.sign(kp);
  return api(`/api/bounties/${bountyId}/confirm`, {
    action,
    address: kp.publicKey(),
    signedXdr: tx.toXDR(),
    ...extra,
  });
}

const creator = Keypair.random();
const dev = Keypair.random();

log("funding creator + developer via friendbot");
await Promise.all([fund(creator), fund(dev)]);

const chain = await api("/api/chain");
assert.equal(chain.status, 200, "chain endpoint");
log(`ledger ${chain.body.latestLedger}, next escrow id ${chain.body.nextId}`);

async function newBounty(title) {
  const r = await api("/api/bounties", {
    title,
    description: "Automated end-to-end check of the escrow lifecycle.",
    requirements: "- none",
    acceptanceCriteria: "- script passes",
    githubRepository: "rylsherdamz-rgb/stellar-forge",
    tech: ["E2E"],
    rewardAmount: REWARD,
    deadlineLedger: chain.body.latestLedger + 17280,
    creator: creator.publicKey(),
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.bounty.id;
}

async function step(id, action, kp, extra, expected) {
  const r = await act(id, action, kp, extra);
  assert.equal(r.status, 200, `${action}: ${JSON.stringify(r.body)}`);
  if (expected) assert.equal(r.body.bounty.status, expected, action);
  log(`${action.padEnd(7)} ✓ ${String(r.body.bounty.status).padEnd(9)} on-chain=${r.body.bounty.onchainStatus ?? "?"} tx ${r.body.txHash}`);
  return r.body.bounty;
}

console.log("\n— scenario 1: happy path —");
const id = await newBounty("E2E: lifecycle smoke test");
log(`metadata saved as ${id}`);

// Unfunded drafts stay off the public list.
const pub = await api("/api/bounties");
assert.ok(!pub.body.bounties.some((b) => b.id === id), "draft must not be public before funding");

// Nobody but the creator can fund it.
const wrongFunder = await api(`/api/bounties/${id}/build`, { action: "create", address: dev.publicKey() });
assert.equal(wrongFunder.status, 409);

const steps = [
  ["create", creator, {}, "OPEN"],
  ["claim", dev, {}, "CLAIMED"],
  ["submit", dev, { githubPrUrl: "https://github.com/rylsherdamz-rgb/stellar-forge/pull/33", githubLogin: "e2e" }, "SUBMITTED"],
  ["approve", creator, {}, "COMPLETED"],
];

for (const [action, kp, extra, expected] of steps) {
  if (action === "claim") {
    const self = await api(`/api/bounties/${id}/build`, { action: "claim", address: creator.publicKey() });
    assert.equal(self.status, 409, "creator must not be able to claim");
    log(`  refused creator self-claim: ${self.body.error}`);
  }
  if (action === "approve") {
    const devApprove = await api(`/api/bounties/${id}/build`, { action: "approve", address: dev.publicKey() });
    assert.equal(devApprove.status, 409, "developer must not be able to approve");
    log(`  refused developer approve: ${devApprove.body.error}`);
  }
  await step(id, action, kp, extra, expected);
}

const final = (await api(`/api/bounties/${id}`)).body.bounty;
assert.equal(final.onchainStatus, "Completed");
assert.equal(final.claimedBy, dev.publicKey());
assert.equal(typeof final.escrowId, "number");
log(`done: escrow #${final.escrowId} paid ${REWARD} XLM to ${dev.publicKey().slice(0, 6)}…`);
console.log(JSON.stringify({ bountyId: id, escrowId: final.escrowId, tx: final.tx }, null, 2));

console.log("\n— scenario 2: v0.2 calls (release, extend, dispute) —");
const id2 = await newBounty("E2E: release, extend and dispute");
const funded = await step(id2, "create", creator, {}, "OPEN");
assert.equal(funded.contractId, chain.body.contractId, "new escrows go to the configured contract");
await step(id2, "claim", dev, {}, "CLAIMED");
const released = await step(id2, "unclaim", dev, {}, "OPEN");
assert.equal(released.claimedBy, null, "release clears the developer");
await step(id2, "claim", dev, {}, "CLAIMED");
const before = released.deadlineLedger;
const extended = await step(id2, "extend", creator, { extendDays: 2 }, "CLAIMED");
assert.ok(extended.deadlineLedger > before, "deadline moved later (read back from the contract)");
log(`  deadline ${before} -> ${extended.deadlineLedger}`);
const devExtend = await api(`/api/bounties/${id2}/build`, { action: "extend", address: dev.publicKey(), extendDays: 1 });
assert.equal(devExtend.status, 409, "developer must not extend");
await step(id2, "submit", dev, { githubPrUrl: "https://github.com/rylsherdamz-rgb/stellar-forge/pull/33" }, "SUBMITTED");
await step(id2, "dispute", dev, {}, "DISPUTED");
const lockedApprove = await api(`/api/bounties/${id2}/build`, { action: "approve", address: creator.publicKey() });
assert.equal(lockedApprove.status, 409, "approve is locked during a dispute");
log(`  refused approve during dispute: ${lockedApprove.body.error}`);

if (process.env.ADMIN_SECRET) {
  const admin = Keypair.fromSecret(process.env.ADMIN_SECRET);
  const server = new rpc.Server(process.env.RPC_URL || "https://soroban-testnet.stellar.org");
  const escrowId = (await api(`/api/bounties/${id2}`)).body.bounty.escrowId;
  const tx = new TransactionBuilder(await server.getAccount(admin.publicKey()), { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(chain.body.contractId).call("resolve_dispute", nativeToScVal(escrowId, { type: "u64" }), nativeToScVal(true)))
    .setTimeout(120).build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(admin);
  const sent = await server.sendTransaction(prepared);
  let got = await server.getTransaction(sent.hash);
  for (let i = 0; got.status === "NOT_FOUND" && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await server.getTransaction(sent.hash);
  }
  assert.equal(got.status, "SUCCESS", "resolve_dispute");
  log(`resolve ✓ admin paid the developer directly on-chain, tx ${sent.hash}`);
  // Nothing told the app; reading the bounty must pick it up from the chain.
  const synced = (await api(`/api/bounties/${id2}`)).body.bounty;
  assert.equal(synced.status, "COMPLETED", "app syncs out-of-band changes on read");
  log("  app picked up the resolution on read: COMPLETED");
} else {
  log("ADMIN_SECRET not set: skipping on-chain dispute resolution");
}
console.log("\nall scenarios passed");
