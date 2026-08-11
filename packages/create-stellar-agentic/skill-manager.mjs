#!/usr/bin/env node

import { existsSync, mkdirSync, cpSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = __dirname;
const SKILLS_DIR = join(PKG_ROOT, "skills");

const ALL_SKILLS = [
  "smart-contracts", "dapp", "data", "assets",
  "agentic-payments", "standards", "zk-proofs",
  "stellar-mcp", "frontend-design", "graphify",
];

const SKILL_DESCRIPTIONS = {
  "smart-contracts": "Rust/soroban-sdk contract development",
  "dapp": "Next.js frontend, Stellar Wallets Kit",
  "data": "Stellar RPC, Horizon queries",
  "assets": "Classic assets, SAC, trustlines",
  "agentic-payments": "x402, MPP Charge/Channel",
  "standards": "SEPs, CAPs, ecosystem references",
  "zk-proofs": "Zero-knowledge proofs, Groth16",
  "stellar-mcp": "MCP tools for Stellar dev",
  "frontend-design": "Stellar dApp UI design patterns",
  "graphify": "Knowledge graph for every project",
};

const IS_TTY = process.stdout.isTTY;

function color(s, c) {
  if (!IS_TTY) return s;
  const codes = { green: 32, cyan: 36, yellow: 33, red: 31, dim: 2, bold: 1 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}

function symbol(name) {
  if (!IS_TTY) return { check: "✓", cross: "✗", arrow: "→", dot: "•", star: "*" }[name] || name;
  return { check: "✔", cross: "✘", arrow: "➜", dot: "●", star: "✦" }[name] || name;
}

function logOk(msg) {
  console.log(`    ${color(symbol("check"), "green")} ${msg}`);
}

function logWarn(msg) {
  console.log(`    ${color(symbol("dot"), "yellow")} ${color(msg, "yellow")}`);
}

function logError(msg) {
  console.error(`    ${color(symbol("cross"), "red")} ${color(msg, "red")}`);
}

function getSkillBase() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) return null;
  return join(homeDir, ".claude", "skills");
}

function skillPath(name) {
  return join(SKILLS_DIR, name);
}

function installedPath(name) {
  const base = getSkillBase();
  return base ? join(base, name) : null;
}

function copyDir(src, dest) {
  if (!existsSync(src)) return false;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
  return true;
}

export function skillExists(name) {
  return ALL_SKILLS.includes(name) && existsSync(join(skillPath(name), "SKILL.md"));
}

export function isInstalled(name) {
  const dest = installedPath(name);
  return dest && existsSync(join(dest, "SKILL.md"));
}

export function listAvailable() {
  return ALL_SKILLS.filter((s) => skillExists(s));
}

export function listInstalled() {
  const base = getSkillBase();
  if (!base) return [];
  return ALL_SKILLS.filter((s) => existsSync(join(base, s, "SKILL.md")));
}

export function listMissing() {
  return ALL_SKILLS.filter((s) => !isInstalled(s));
}

export function installSkill(name) {
  if (!skillExists(name)) {
    return { ok: false, reason: `skill "${name}" not found in framework` };
  }
  const dest = installedPath(name);
  if (!dest) {
    return { ok: false, reason: "cannot determine home directory" };
  }
  mkdirSync(dest, { recursive: true });
  copyDir(skillPath(name), dest);
  return { ok: true };
}

export function installAll() {
  const results = [];
  for (const name of ALL_SKILLS) {
    if (!skillExists(name)) {
      results.push({ name, ok: false, reason: "not found in framework" });
      continue;
    }
    const dest = installedPath(name);
    if (!dest) {
      results.push({ name, ok: false, reason: "no home dir" });
      continue;
    }
    mkdirSync(dest, { recursive: true });
    copyDir(skillPath(name), dest);
    results.push({ name, ok: true });
  }
  return results;
}

export function cmdList(args) {
  const available = listAvailable();
  const installed = listInstalled();

  console.log(`\n  ${color("Available Skills", "bold")} (${available.length})\n`);
  for (const name of available) {
    const mark = installed.includes(name) ? color(symbol("check"), "green") : color("  ", "dim");
    const desc = SKILL_DESCRIPTIONS[name] || "";
    console.log(`  ${mark}  ${color(name, "bold")}  ${color(desc, "dim")}`);
  }

  console.log(`\n  ${color("Usage", "bold")}`);
  console.log(`    ${color("npx create-stellar-agentic skills add <name>", "cyan")}  ${color("Install a skill", "dim")}`);
  console.log(`    ${color("npx create-stellar-agentic skills install-all", "cyan")}  ${color("Install all skills", "dim")}`);
  console.log();
}

export function cmdAdd(names) {
  if (!names || names.length === 0) {
    logError("No skill name provided");
    console.log(`  ${color("Usage:", "bold")} ${color("npx create-stellar-agentic skills add <skill-name>", "cyan")}`);
    console.log(`  ${color("Available:", "bold")} ${listAvailable().join(", ")}`);
    console.log();
    process.exit(1);
  }

  console.log();
  for (const name of names) {
    if (!ALL_SKILLS.includes(name)) {
      logWarn(`"${name}" is not a valid skill. Available: ${listAvailable().join(", ")}`);
      continue;
    }
    if (isInstalled(name)) {
      logOk(`"${name}" already installed at ~/.claude/skills/${name}/`);
      continue;
    }
    const result = installSkill(name);
    if (result.ok) {
      logOk(`${name} installed`);
    } else {
      logWarn(result.reason);
    }
  }
  console.log();
}

export function cmdInstallAll() {
  const missing = listMissing();
  if (missing.length === 0) {
    console.log(`\n  ${color(symbol("check"), "green")} ${color("All skills already installed", "bold")}\n`);
    return;
  }

  console.log(`\n  ${color(`Installing ${missing.length} skills...`, "bold")}\n`);
  const results = installAll();
  for (const r of results) {
    if (r.ok) {
      logOk(`${r.name} installed`);
    } else {
      logWarn(`${r.name} — ${r.reason}`);
    }
  }
  console.log(`\n  ${color(symbol("star"), "green")} ${color("Done", "bold")}\n`);
}
