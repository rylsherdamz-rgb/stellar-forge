// Unit tests for the site's pure logic. Run with `npm test` in site/
// (node --test with built-in TypeScript type stripping; no extra deps).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blockReason,
  fromOnchainStatus,
  decodeStatus,
  stepIndex,
  timeLeft,
  shortAddr,
  METHOD_FOR,
  STATUS_AFTER,
  type ActionContext,
} from "../src/lib/lifecycle.ts";
import { decodeContractError, CONTRACT_ERRORS } from "../src/lib/errors.ts";
import { validateBountyForm, EMPTY_FORM } from "../src/lib/forms.ts";
import { metadataHash, submissionHash, toHex } from "../src/lib/hash.ts";

const CREATOR = "GCREATOR";
const DEV = "GDEV";
const OTHER = "GOTHER";

const bounty = (over: Partial<ActionContext> = {}): ActionContext => ({
  status: "OPEN",
  creator: CREATOR,
  claimedBy: null,
  deadlineLedger: 1000,
  escrowId: 3,
  ...over,
});

test("claim: open bounty can be claimed by anyone but the creator", () => {
  assert.equal(blockReason(bounty(), "claim", OTHER, 500), null);
  assert.match(blockReason(bounty(), "claim", CREATOR, 500)!, /Creators cannot claim/);
  assert.match(blockReason(bounty(), "claim", null)!, /Connect a wallet/);
  assert.match(blockReason(bounty({ status: "CLAIMED", claimedBy: DEV }), "claim", OTHER, 500)!, /Only open/);
  assert.match(blockReason(bounty(), "claim", OTHER, 1001)!, /deadline has passed/);
});

test("submit: only the claiming developer, before the deadline", () => {
  const b = bounty({ status: "CLAIMED", claimedBy: DEV });
  assert.equal(blockReason(b, "submit", DEV, 999), null);
  assert.match(blockReason(b, "submit", OTHER, 999)!, /Only the developer/);
  assert.match(blockReason(b, "submit", DEV, 1001)!, /deadline/);
  assert.match(blockReason(bounty(), "submit", DEV)!, /Claim the bounty/);
});

test("approve: creator only, and only once submitted", () => {
  const b = bounty({ status: "SUBMITTED", claimedBy: DEV });
  assert.equal(blockReason(b, "approve", CREATOR), null);
  assert.match(blockReason(b, "approve", DEV)!, /Only the creator/);
  assert.match(blockReason(bounty(), "approve", CREATOR)!, /no submission/);
});

test("cancel only while open; refund only after the deadline", () => {
  assert.equal(blockReason(bounty(), "cancel", CREATOR), null);
  assert.match(blockReason(bounty({ status: "CLAIMED", claimedBy: DEV }), "cancel", CREATOR)!, /unclaimed/);
  assert.match(blockReason(bounty(), "refund", CREATOR, 900)!, /after the deadline/);
  assert.equal(blockReason(bounty(), "refund", CREATOR, 1001), null);
  assert.equal(blockReason(bounty({ status: "CLAIMED", claimedBy: DEV }), "refund", CREATOR, 1001), null);
  assert.match(blockReason(bounty({ status: "SUBMITTED" }), "refund", CREATOR, 1001)!, /cannot be refunded/);
  // Unknown ledger: defer the deadline check to the contract.
  assert.equal(blockReason(bounty(), "refund", CREATOR, null), null);
});

test("unfunded drafts: only the creator can fund, nothing else is allowed", () => {
  const draft = bounty({ escrowId: null });
  assert.equal(blockReason(draft, "create", CREATOR), null);
  assert.match(blockReason(draft, "create", OTHER)!, /Only the creator/);
  assert.match(blockReason(draft, "claim", OTHER)!, /not been funded/);
  assert.match(blockReason(bounty(), "create", CREATOR)!, /already funded/);
});

test("on-chain status mapping covers every contract variant", () => {
  for (const s of ["Open", "Claimed", "Submitted", "Completed", "Cancelled", "Expired", "Disputed", "Refunded"]) {
    assert.ok(fromOnchainStatus(s), s);
  }
  assert.equal(fromOnchainStatus("Bogus"), null);
  // On-chain Status is a u32 discriminant (regression: was read as "3").
  assert.equal(decodeStatus(3), "Completed");
  assert.equal(decodeStatus(BigInt(7)), "Refunded");
  assert.equal(decodeStatus(["Open"]), "Open");
  assert.equal(fromOnchainStatus(decodeStatus(1)), "CLAIMED");
  assert.equal(stepIndex("SUBMITTED"), 2);
  assert.equal(stepIndex("REFUNDED"), -1);
});

test("every action maps to a contract method and a resulting status", () => {
  for (const a of Object.keys(METHOD_FOR) as (keyof typeof METHOD_FOR)[]) {
    assert.match(METHOD_FOR[a], /_bounty$/);
    assert.ok(STATUS_AFTER[a]);
  }
});

test("timeLeft and shortAddr formatting", () => {
  assert.equal(timeLeft(null, 1), null);
  assert.equal(timeLeft(100, 200), "Deadline passed");
  assert.equal(timeLeft(1000 + 17280 * 3, 1000), "3d 0h left");
  assert.equal(timeLeft(1000 + 720 * 5, 1000), "5h left");
  assert.equal(shortAddr("GAJAT5TLPHYVXTF23CBUISRUEWERUNGOVC5E57S7XOV5K65ELPL7H7RG"), "GAJA…H7RG");
  assert.equal(shortAddr(null), "—");
});

test("decodeContractError reads codes from Soroban error text", () => {
  const e = decodeContractError(new Error("HostError: Error(Contract, #19)\n event log …"));
  assert.deepEqual(e && { code: e.code, name: e.name }, { code: 19, name: "SelfClaim" });
  assert.equal(decodeContractError("Error(Contract, #99)")?.name, "Unknown");
  assert.equal(decodeContractError({ error: "Error(Contract, #14)" })?.name, "BeforeDeadline");
  assert.equal(decodeContractError(new Error("network down")), null);
  // Codes 1..21 match the contract's BountyError enum.
  assert.equal(Object.keys(CONTRACT_ERRORS).length, 21);
});

test("create form validation", () => {
  const errs = validateBountyForm(EMPTY_FORM);
  for (const k of ["title", "description", "requirements", "acceptanceCriteria", "githubRepository", "tech", "rewardAmount"]) {
    assert.ok(k in errs, k);
  }
  const ok = validateBountyForm({
    title: "Fix mobile nav",
    description: "d",
    requirements: "r",
    acceptanceCriteria: "a",
    githubRepository: "alice/project",
    tech: "React",
    rewardAmount: "25.5",
    deadlineDays: "7",
  });
  assert.deepEqual(ok, {});
  const bad = validateBountyForm({ ...EMPTY_FORM, rewardAmount: "1.12345678", githubRepository: "https://x", deadlineDays: "0" });
  assert.ok(bad.rewardAmount && bad.githubRepository && bad.deadlineDays);
});

test("metadata and submission hashes are deterministic 32-byte commitments", async () => {
  const meta = {
    title: "t", description: "d", requirements: "r",
    acceptanceCriteria: "a", githubRepository: "o/r", rewardAmount: "1",
  };
  const a = await metadataHash(meta);
  const b = await metadataHash({ ...meta });
  assert.equal(a.length, 32);
  assert.equal(toHex(a), toHex(b));
  assert.notEqual(toHex(a), toHex(await metadataHash({ ...meta, rewardAmount: "2" })));
  const s1 = await submissionHash("https://github.com/o/r/pull/1 ", "abc");
  const s2 = await submissionHash("https://github.com/o/r/pull/1", "abc");
  assert.equal(toHex(s1), toHex(s2));
});
