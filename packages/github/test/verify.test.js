import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePrUrl,
  parseRepo,
  verifySubmission,
} from "../src/index.js";

// A fake fetch that returns a canned PR payload or a 404.
function mockFetch({ status = 200, body = {} } = {}) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

test("parsePrUrl parses a standard PR url", () => {
  assert.deepEqual(parsePrUrl("https://github.com/alice/project/pull/42"), {
    owner: "alice",
    repo: "project",
    number: 42,
  });
});

test("parsePrUrl tolerates trailing paths and query strings", () => {
  assert.deepEqual(
    parsePrUrl("https://github.com/alice/project/pull/42/files?w=1"),
    { owner: "alice", repo: "project", number: 42 },
  );
});

test("parsePrUrl rejects non-PR urls", () => {
  assert.throws(() => parsePrUrl("https://github.com/alice/project/issues/42"));
  assert.throws(() => parsePrUrl("not a url"));
});

test("parseRepo accepts owner/repo and full urls", () => {
  assert.deepEqual(parseRepo("alice/project"), { owner: "alice", repo: "project" });
  assert.deepEqual(parseRepo("https://github.com/alice/project.git"), {
    owner: "alice",
    repo: "project",
  });
});

test("verifySubmission passes when repo, existence, and author all match", async () => {
  const res = await verifySubmission(
    {
      prUrl: "https://github.com/alice/project/pull/42",
      expectedRepo: "alice/project",
      expectedGithubLogin: "bob",
    },
    { fetchImpl: mockFetch({ body: { user: { login: "bob" }, merged: false } }) },
  );
  assert.equal(res.verified, true);
  assert.equal(res.checks.exists, true);
  assert.equal(res.checks.repoMatches, true);
  assert.equal(res.checks.authorMatches, true);
  assert.deepEqual(res.reasons, []);
});

test("verifySubmission fails on repo mismatch (no network call needed)", async () => {
  const res = await verifySubmission(
    {
      prUrl: "https://github.com/mallory/evil/pull/1",
      expectedRepo: "alice/project",
      expectedGithubLogin: "bob",
    },
    {
      fetchImpl: mockFetch({ body: { user: { login: "bob" } } }),
    },
  );
  assert.equal(res.verified, false);
  assert.equal(res.checks.repoMatches, false);
  assert.ok(res.reasons.some((r) => r.includes("expected alice/project")));
});

test("verifySubmission fails when the PR does not exist", async () => {
  const res = await verifySubmission(
    {
      prUrl: "https://github.com/alice/project/pull/999",
      expectedRepo: "alice/project",
      expectedGithubLogin: "bob",
    },
    { fetchImpl: mockFetch({ status: 404 }) },
  );
  assert.equal(res.verified, false);
  assert.equal(res.checks.exists, false);
  assert.ok(res.reasons.includes("PR does not exist"));
});

test("verifySubmission fails when author does not match claimed developer", async () => {
  const res = await verifySubmission(
    {
      prUrl: "https://github.com/alice/project/pull/42",
      expectedRepo: "alice/project",
      expectedGithubLogin: "bob",
    },
    { fetchImpl: mockFetch({ body: { user: { login: "imposter" } } }) },
  );
  assert.equal(res.verified, false);
  assert.equal(res.checks.authorMatches, false);
  assert.ok(res.reasons.some((r) => r.includes("imposter")));
});

test("verifySubmission reports merged status but does not gate on it", async () => {
  const res = await verifySubmission(
    {
      prUrl: "https://github.com/alice/project/pull/42",
      expectedRepo: "alice/project",
      expectedGithubLogin: "bob",
    },
    {
      fetchImpl: mockFetch({
        body: { user: { login: "bob" }, merged: true, merged_at: "2026-01-01T00:00:00Z" },
      }),
    },
  );
  assert.equal(res.verified, true);
  assert.equal(res.checks.merged, true);
});
