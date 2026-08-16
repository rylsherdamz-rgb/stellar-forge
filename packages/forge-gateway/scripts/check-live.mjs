import { buildCatalog } from "../src/catalog.mjs";

const ROOT = process.env.FORGE_CATALOG_ROOT || process.cwd();
const REPORT = [];

async function ping(name, fn) {
  const start = Date.now();
  try {
    const ok = await fn();
    REPORT.push({ service: name, status: "ok", ms: Date.now() - start, detail: ok });
  } catch (err) {
    REPORT.push({ service: name, status: "down", ms: Date.now() - start, detail: err.message });
  }
}

const entries = buildCatalog(ROOT);

await ping("soroban-testnet-rpc", async () => {
  const r = await fetch("https://soroban-testnet.stellar.org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`http ${r.status}`);
  return j.result?.status || "unknown";
});

await ping("horizon", async () => {
  const r = await fetch("https://horizon-testnet.stellar.org");
  if (!r.ok) throw new Error(`http ${r.status}`);
  const j = await r.json();
  return j.horizon_version || "ok";
});

await ping("npm-registry", async () => {
  const r = await fetch("https://registry.npmjs.org/create-stellar-agentic/latest");
  if (!r.ok) throw new Error(`http ${r.status}`);
  const j = await r.json();
  return `v${j.version}`;
});

await ping("docs-site", async () => {
  const r = await fetch("https://stellar-agentic-framework.vercel.app");
  if (!r.ok) throw new Error(`http ${r.status}`);
  return "ok";
});

await ping("github-repo", async () => {
  const r = await fetch("https://api.github.com/repos/rylsherdamz-rgb/stellar-forge", {
    headers: { "User-Agent": "forge-gateway" },
  });
  if (!r.ok) throw new Error(`http ${r.status}`);
  const j = await r.json();
  return `${j.full_name} (${j.visibility})`;
});

const summary = {
  date: new Date().toISOString(),
  catalog_entries: entries.length,
  services: REPORT,
  all_up: REPORT.every((s) => s.status === "ok"),
};
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.all_up ? 0 : 1);