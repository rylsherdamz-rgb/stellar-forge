import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// SPEC §10: the AI assistant must never be able to create, transfer, release
// or refund funds. Enforced structurally: AI code may not import anything that
// builds, signs or submits a transaction.
const FORBIDDEN = [/@\/lib\/contract/, /@\/lib\/wallet/, /@\/lib\/actions/, /\.\/contract/, /\.\/wallet/, /\.\/actions/, /stellar-sdk/, /stellar-wallets-kit/];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

test("AI modules cannot reach transaction code", () => {
  const targets = ["src/lib/ai.ts", ...files("src/app/api/ai")];
  assert.ok(targets.length >= 4);
  for (const file of targets) {
    const src = readFileSync(file, "utf8");
    const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const imp of imports) {
      for (const bad of FORBIDDEN) {
        assert.ok(!bad.test(imp), `${file} imports ${imp}, which can move funds`);
      }
    }
  }
});
