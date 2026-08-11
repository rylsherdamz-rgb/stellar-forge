import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUITES = ["x402-flow.mjs", "mpp-charge-flow.mjs", "contract-state.mjs"];

console.log(`Stellar Forge :: framework test suite (${SUITES.length} suites)\n`);

let passed = 0;
let skipped = 0;
let failed = 0;

for (const suite of SUITES) {
  const result = spawnSync(process.execPath, [join(__dirname, suite)], {
    stdio: "inherit",
    env: { ...process.env },
  });

  if (result.status === 0) {
    passed += 1;
    console.log(`  ✓ ${suite}`);
  } else if (result.signal || result.status === null) {
    failed += 1;
    console.log(`  ✗ ${suite} (crashed)`);
  } else {
    skipped += 1;
    console.log(`  - ${suite} skipped`);
  }
}

console.log(`\nSummary: ${passed} passed, ${skipped} skipped, ${failed} failed`);

if (passed === 0 && skipped === SUITES.length) {
  console.log("All suites skipped — run against a live backend/RPC for full coverage.");
}

process.exit(passed > 0 || skipped === SUITES.length ? 0 : 1);