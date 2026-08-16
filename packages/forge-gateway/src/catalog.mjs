import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURATED_ENTRIES } from "./curated.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(__dirname, "..", "..", "..");

export function buildCatalog(root = process.env.FORGE_CATALOG_ROOT || DEFAULT_ROOT) {
  const entries = [];
  const seen = new Set();

  const add = (entry) => {
    if (!entry.id || seen.has(entry.id)) return;
    seen.add(entry.id);
    entries.push({
      updated: new Date().toISOString().slice(0, 10),
      ...entry,
    });
  };

  const scanDir = (dir, type, idPrefix, pick = () => ({})) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        const skillMd = path.join(p, "SKILL.md");
        if (fs.existsSync(skillMd)) {
          const text = fs.readFileSync(skillMd, "utf8");
          const title = (text.match(/^#\s+(.+)$/m) || [])[1] || name;
          const desc = (text.match(/^##?\s*Description\s*\n(.+)$/im) || [])[1]
            || (text.match(/^#\s+.+\n\n(.+)$/m) || [])[1]
            || `${title} — see ${p}`;
          add({
            id: `${idPrefix}-${name}`,
            type,
            title,
            description: desc.trim().slice(0, 400),
            keywords: name.split("-"),
            source: path.relative(root, p),
            ...pick(name, p),
          });
        } else if (idPrefix === "template") {
          add({
            id: `${idPrefix}-${name}`,
            type,
            title: `${name} contract template`,
            source: path.relative(root, p),
            ...pick(name, p),
          });
        }
      } else if (stat.isFile() && (name.endsWith(".md") || name.endsWith(".json"))) {
        const title = name.replace(/\.md$/, "").replace(/^\d+-/, "").replace(/-/g, " ");
        add({
          id: `${idPrefix}-${name.replace(/\.(md|json)$/, "")}`,
          type,
          title,
          source: path.relative(root, p),
          ...pick(name, p),
        });
      }
    }
  };

  scanDir(path.join(root, "skills"), "skill", "skill");
  scanDir(path.join(root, "evals"), "eval", "eval", (name, p) => ({
    description: `Evaluation criteria for the ${name.replace(/^\d+-/, "").replace(/-eval$/, "")} zone — verifier gates agent outputs.`,
    keywords: ["eval", "verifier", name.replace(/^\d+-/, "").replace(/-eval\.md$/, ""), "scoring"],
  }));
  scanDir(path.join(root, "agents"), "agent", "agent", (name, p) => {
    const text = fs.readFileSync(p, "utf8");
    const zone = (text.match(/^##\s+Zone\s*\n(.+)$/m) || [])[1] || name;
    return { description: `Specialist agent: ${zone.trim().slice(0, 200)}`, keywords: ["agent", name, "specialist", "graph"] };
  });
  scanDir(path.join(root, "templates", "contracts"), "template", "template", (name, p) => ({
    description: `Soroban contract template: ${name} (Rust, soroban-sdk).`,
    keywords: ["template", "contract", "soroban", "rust", name],
  }));
  scanDir(path.join(root, "docs"), "doc", "doc", (name, p) => ({
    keywords: ["docs", "guide", name.replace(/\.md$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")],
  }));

  for (const c of CURATED_ENTRIES) add(c);
  return entries;
}

export function searchCatalog(entries, query, { type } = {}) {
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries.slice(0, 10).map((e) => e.id);

  const scored = [];
  for (const e of entries) {
    if (type && e.type !== type) continue;
    const hay = [e.id, e.title, e.description, e.keywords.join(" ")].join(" ").toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (hay.includes(t)) {
        score += 2;
        if (e.title.toLowerCase().includes(t)) score += 4;
        if (e.id.includes(t)) score += 3;
        if ((e.keywords || []).some((k) => k.toLowerCase() === t)) score += 3;
      }
    }
    if (score > 0) scored.push({ score, entry: e });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.entry.id);
}

export function getEntry(entries, id) {
  return entries.find((e) => e.id === id) || null;
}