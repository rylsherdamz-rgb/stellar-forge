import { test } from "node:test";
import assert from "node:assert/strict";
import { submissionHash, metadataHash, toHex } from "../src/lib/commitments";
import type { Bounty } from "../src/lib/store";

test("submission hash is stable and trims input", async () => {
  const a = toHex(await submissionHash("https://github.com/a/b/pull/1", "abc"));
  const b = toHex(await submissionHash("  https://github.com/a/b/pull/1 ", " abc "));
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.notEqual(a, toHex(await submissionHash("https://github.com/a/b/pull/2", "abc")));
});

test("metadata hash commits to the bounty terms, not mutable status", async () => {
  const base = {
    title: "t", description: "d", requirements: "r", acceptanceCriteria: "c",
    githubRepository: "a/b", rewardAmount: "10", asset: "XLM", status: "OPEN",
  } as unknown as Bounty;
  const h1 = toHex(await metadataHash(base));
  const h2 = toHex(await metadataHash({ ...base, status: "COMPLETED" }));
  const h3 = toHex(await metadataHash({ ...base, rewardAmount: "11" }));
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
});
