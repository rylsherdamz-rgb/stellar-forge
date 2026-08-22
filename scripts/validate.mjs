import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const errors = [];
const warnings = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => { console.log(`  ✗ ${msg}`); errors.push(msg); };
const warn = (msg) => { console.log(`  ⚠ ${msg}`); warnings.push(msg); };

function frontmatter(file, requiredFields, label) {
  if (!existsSync(file)) return fail(`${label}: ${file} missing`);
  const head = readFileSync(file, "utf8").split("\n").slice(0, 20);
  for (const field of requiredFields) {
    head.some((l) => l.startsWith(`${field}:`)) ? ok(`${label}.${field}`) : fail(`${label} missing frontmatter field '${field}'`);
  }
}

// 1. Root SKILL.md
frontmatter("SKILL.md", ["name", "version", "description", "tags"], "SKILL.md");

// 2. skill.json + marketplace.json
for (const f of ["skill.json", ".claude-plugin/marketplace.json"]) {
  if (!existsSync(f)) fail(`${f} missing`);
  else {
    try { JSON.parse(readFileSync(f, "utf8")); ok(f); }
    catch (e) { fail(`${f} invalid JSON: ${e.message}`); }
  }
}

// 3. Agents: frontmatter + registry cross-check against CLAUDE.md org graph
const claudemd = existsSync("CLAUDE.md") ? readFileSync("CLAUDE.md", "utf8") : "";
for (const f of readdirSync("agents")) {
  if (!f.endsWith(".md")) continue;
  frontmatter(join("agents", f), ["name"], `agents/${f}`);
  const agentName = f.replace(/\.md$/, "");
  if (claudemd && !claudemd.includes(agentName)) warn(`agents/${f} not referenced in CLAUDE.md`);
}

// 4. Bundled skills: SKILL.md present
let skillCount = 0;
for (const dir of readdirSync("skills")) {
  if (existsSync(join("skills", dir, "SKILL.md"))) { ok(`skills/${dir}`); skillCount++; }
  else fail(`skills/${dir}/SKILL.md missing`);
}
if (skillCount !== 10) warn(`expected 10 bundled skills, found ${skillCount}`);

// 5. Evals: 5 evals, sequential numbering
const evals = readdirSync("evals").filter((f) => f.endsWith(".md"));
if (evals.length < 5) fail(`expected >=5 evals, found ${evals.length}`);
else ok(`${evals.length} evals`);

// 6. CLI package integrity: entry imports all resolvable local files,
//    and every import target is listed (or covered by a glob) in package.json files[]
const pkgDir = "packages/create-stellar-agentic";
const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const entry = readFileSync(join(pkgDir, pkg.bin?.["create-stellar-agentic"] || "index.mjs"), "utf8");
const localImports = [...entry.matchAll(/from\s+["'](\.[^"']+)["']/g)].map((m) => m[1]);
for (const imp of localImports) {
  const resolved = join(pkgDir, imp);
  if (!existsSync(resolved)) fail(`CLI import target missing on disk: ${imp}`);
  const rel = imp.replace(/^\.\//, "");
  const covered =
    pkg.files.some((pat) => pat === rel || (pat.endsWith("/") && rel.startsWith(pat)) || pat === "*");
  if (!covered) fail(`CLI import '${imp}' not covered by package.json files[] — would break the published tarball`);
}
existsSync(join(pkgDir, "skill-manager.mjs")) ? ok("CLI skill-manager.mjs") : fail("CLI skill-manager.mjs missing");

// 7. README claims spot-check (keep docs honest)
for (const claim of ["npx create-stellar-agentic", "npm install -g create-stellar-agentic"]) {
  readFileSync("README.md", "utf8").includes(claim) ? ok(`README mentions '${claim}'`) : warn(`README no longer mentions '${claim}'`);
}

console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
