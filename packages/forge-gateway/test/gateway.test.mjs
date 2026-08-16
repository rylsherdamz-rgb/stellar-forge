import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog, searchCatalog, getEntry } from "../src/catalog.mjs";
import { runSandboxed } from "../src/sandbox.mjs";
import { createApp } from "../src/server.mjs";

const entries = buildCatalog();

test("catalog builds with all entry types", () => {
  const types = new Set(entries.map((e) => e.type));
  for (const t of ["skill", "eval", "agent", "template", "standard", "ecosystem", "intel", "playbook", "operation", "doc"]) {
    assert.ok(types.has(t), `missing type ${t}`);
  }
  assert.ok(entries.length >= 50, `expected >=50 entries, got ${entries.length}`);
});

test("search ranks exact keyword match first", () => {
  const ids = searchCatalog(entries, "x402");
  assert.equal(ids[0], "x402-org");
  assert.ok(ids.includes("playbook-x402-api"));
});

test("search respects type filter", () => {
  const ids = searchCatalog(entries, "milestone", { type: "playbook" });
  assert.ok(ids.includes("playbook-vault"));
  assert.ok(!ids.includes("sep-41"));
});

test("getEntry returns null for unknown id", () => {
  assert.equal(getEntry(entries, "does-not-exist"), null);
  assert.ok(getEntry(entries, "sep-41").title.includes("SEP-41"));
});

test("sandbox executes catalog calls", () => {
  const api = { get: (id) => getEntry(entries, id), search: (q) => searchCatalog(entries, q) };
  const out = runSandboxed("catalog.get('sep-41').title", api);
  assert.equal(out.error, null);
  assert.ok(String(out.result).includes("SEP-41"));
});

test("sandbox blocks require/fetch/process", () => {
  const api = { get: () => null, search: () => [] };
  for (const code of ["require('fs')", "fetch('https://x')", "process.env", "globalThis"]) {
    const out = runSandboxed(code, api);
    assert.ok(out.error, `expected block for: ${code}`);
    assert.ok(out.error.includes("blocked"), out.error);
  }
});

test("sandbox captures console and serializes results", () => {
  const api = { get: () => null, search: () => [] };
  const out = runSandboxed("console.log('hello', 42); ({ a: 1 })", api);
  assert.deepEqual(out.result, { a: 1 });
  assert.ok(out.logs.some((l) => l.includes("hello 42")));
});

test("sandbox times out runaway code", () => {
  const api = { get: () => null, search: () => [] };
  const out = runSandboxed("while(true){}", api, { timeout: 100 });
  assert.ok(out.error);
});

test("auth: 401 without token when configured", async () => {
  const { httpServer } = createApp({ token: "sekret" });
  const server = httpServer.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/mcp`, { method: "POST", body: "{}" });
    assert.equal(res.status, 401);
    const ok = await fetch(`http://localhost:${port}/health`);
    assert.equal(ok.status, 200);
  } finally {
    server.close();
  }
});

test("health reports catalog size", async () => {
  const { httpServer } = createApp();
  const server = httpServer.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/health`);
    const j = await res.json();
    assert.equal(j.status, "ok");
    assert.equal(j.catalog, entries.length);
    const play = await fetch(`http://localhost:${port}/playground`);
    assert.ok((await play.text()).includes("Forge Gateway"));
  } finally {
    server.close();
  }
});