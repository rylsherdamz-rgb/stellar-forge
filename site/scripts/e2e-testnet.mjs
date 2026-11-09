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

import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
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

const created = await api("/api/bounties", {
  title: "E2E: lifecycle smoke test",
  description: "Automated end-to-end check of the escrow lifecycle.",
  requirements: "- none",
  acceptanceCriteria: "- script passes",
  githubRepository: "rylsherdamz-rgb/stellar-forge",
  tech: ["E2E"],
  rewardAmount: REWARD,
  deadlineLedger: chain.body.latestLedger + 17280,
  creator: creator.publicKey(),
});
assert.equal(created.status, 201, JSON.stringify(created.body));
const id = created.body.bounty.id;
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
  const r = await act(id, action, kp, extra);
  assert.equal(r.status, 200, `${action}: ${JSON.stringify(r.body)}`);
  assert.equal(r.body.bounty.status, expected);
  log(`${action.padEnd(7)} ✓ ${expected.padEnd(9)} on-chain=${r.body.bounty.onchainStatus ?? "?"} tx ${r.body.txHash}`);
}

const final = (await api(`/api/bounties/${id}`)).body.bounty;
assert.equal(final.onchainStatus, "Completed");
assert.equal(final.claimedBy, dev.publicKey());
assert.equal(typeof final.escrowId, "number");
log(`done: escrow #${final.escrowId} paid ${REWARD} XLM to ${dev.publicKey().slice(0, 6)}…`);
console.log(JSON.stringify({ bountyId: id, escrowId: final.escrowId, tx: final.tx }, null, 2));
