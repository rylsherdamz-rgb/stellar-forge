#!/usr/bin/env node

import { existsSync, mkdirSync, cpSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";
import { cmdList, cmdAdd, cmdInstallAll, listMissing, installSkill, skillExists, isInstalled, listAvailable } from "./skill-manager.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = existsSync(join(__dirname, "templates"))
  ? __dirname
  : join(__dirname, "../..");
const TEMPLATES_DIR = join(PKG_ROOT, "templates");
const SKILLS_DIR = join(PKG_ROOT, "skills");

const IS_TTY = process.stdout.isTTY;

const BANNER = `
  ╭─────────────────────────────────────────────────╮
  │  ✦ Stellar Agentic Framework ✦                  │
  │  Eval-driven multi-agent harness for Stellar dApps│
  ╰─────────────────────────────────────────────────╯
`;

function color(s, c) {
  if (!IS_TTY) return s;
  const codes = { green: 32, cyan: 36, yellow: 33, red: 31, dim: 2, bold: 1 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}

function symbol(name) {
  if (!IS_TTY) return { check: "✓", cross: "✗", arrow: "→", dot: "•", star: "*" }[name] || name;
  return { check: "✔", cross: "✘", arrow: "➜", dot: "●", star: "✦" }[name] || name;
}

function log(label, msg, labelColor = "cyan") {
  console.log(`  ${color(symbol("dot"), labelColor)} ${color(label + ":", "bold")} ${msg}`);
}

function logStep(step, total, msg) {
  console.log(`\n  ${color(`[${step}/${total}]`, "dim")} ${color(msg, "bold")}`);
  console.log();
}

function logOk(msg) {
  console.log(`    ${color(symbol("check"), "green")} ${msg}`);
}

function logWarn(msg) {
  console.log(`    ${color(symbol("dot"), "yellow")} ${color(msg, "yellow")}`);
}

function logItem(label, desc) {
  console.log(`    ${color(symbol("arrow"), "cyan")} ${color(label, "bold")}  ${desc}`);
}

async function runAsync(cmd, args, opts = {}) {
  const { spawn } = await import("child_process");
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "pipe", ...opts });
    let out = "";
    proc.stdout.on("data", (d) => { out += d; });
    proc.stderr.on("data", (d) => { out += d; });
    proc.on("close", (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(out.trim() || `exit code ${code}`));
    });
    proc.on("error", reject);
  });
}

function startSpinner(msg) {
  const stderr = process.stderr;
  const tty = stderr.isTTY || (IS_TTY && process.stdout.isTTY);
  if (!tty) {
    let dots = 0;
    process.stdout.write(`  ${msg}...`);
    const td = setInterval(() => {
      dots = (dots + 1) % 4;
      process.stdout.write(`\r  ${msg}${".".repeat(dots)}   `);
    }, 500);
    return { stop: (ok = true) => { clearInterval(td); process.stdout.write(`\r  ${ok ? "✓" : "✗"} ${msg}   \n`); } };
  }
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const t = setInterval(() => {
    stderr.write(`\r  ${frames[i]} ${msg}...`);
    i = (i + 1) % frames.length;
  }, 80);
  return {
    stop: (ok = true) => {
      clearInterval(t);
      stderr.write(`\r  ${ok ? "✔" : "✘"} ${msg}   \n`);
    },
  };
}

function ask(query) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`  ${color("?", "yellow")} ${query} `, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function installDependencySkills() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) { logWarn("Cannot determine home dir, skipping skill install"); return; }
  const missing = listMissing();
  if (missing.length === 0) {
    logOk("All 10 skills already installed at ~/.claude/skills/");
    return;
  }
  const sp3 = startSpinner(`Installing ${missing.length} dependency skills`);
  const warnings = [];
  for (const name of missing) {
    const result = installSkill(name);
    if (!result.ok) warnings.push(name);
  }
  sp3.stop(true);
  for (const name of missing) {
    if (skillExists(name) && isInstalled(name)) logOk(`${name} installed`);
    else if (skillExists(name)) logWarn(`"${name}" skill not found in framework`);
  }
}

function copyDir(src, dest, filter = () => true) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (!filter(srcPath)) continue;
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, filter);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

function copyFrameworkSkill(targetDir) {
  const files = [
    "SKILL.md", "CLAUDE.md", "package.json", "README.md", ".env.example",
  ];
  for (const f of files) {
    const src = join(PKG_ROOT, f);
    if (existsSync(src)) copyFile(src, join(targetDir, f));
  }
  copyDir(join(PKG_ROOT, "agents"), join(targetDir, "agents"));
  copyDir(join(PKG_ROOT, ".claude"), join(targetDir, ".claude"));
  copyDir(join(PKG_ROOT, "evals"), join(targetDir, "evals"));
  mkdirSync(join(targetDir, "data/projects"), { recursive: true });
  mkdirSync(join(targetDir, "data/decisions"), { recursive: true });
  mkdirSync(join(targetDir, "data/logs"), { recursive: true });
  mkdirSync(join(targetDir, "data/deployments"), { recursive: true });
  writeFileSync(join(targetDir, "data/README.md"),
    "# Data Directory\n\nPersistent file-based memory for the Stellar Agentic Framework.\n");
  copyDir(join(PKG_ROOT, "scripts"), join(targetDir, "scripts"));
}

async function scaffoldTemplates(targetDir, types, skipPrompts) {
  if (types.includes("contracts") || types.includes("full")) {
    copyDir(join(TEMPLATES_DIR, "contracts"), join(targetDir, "contracts"));
    logOk("contracts/");
  }
  if (types.includes("frontend") || types.includes("full")) {
    const frontendDir = join(targetDir, "frontend");
    const nextArgs = [
      "create-next-app@latest", frontendDir,
      "--ts", "--src-dir", "--app",
      "--use-npm",
      "--eslint",
      "--import-alias", "@/*",
    ];
    if (skipPrompts) nextArgs.push("--yes");

    const sp = startSpinner("Running create-next-app");
    try {
      await runAsync("npx", nextArgs, { timeout: 180000 });
      sp.stop(true);
      logOk("create-next-app scaffolded TypeScript project");
    } catch {
      sp.stop(false);
      logWarn("create-next-app failed, copying template directly");
      copyDir(join(TEMPLATES_DIR, "frontend"), frontendDir, (p) => !p.endsWith("package-lock.json"));
    }

    copyDir(join(TEMPLATES_DIR, "frontend/hooks"), join(frontendDir, "src/hooks"));
    copyDir(join(TEMPLATES_DIR, "frontend/components"), join(frontendDir, "src/components"));
    copyDir(join(TEMPLATES_DIR, "frontend/providers"), join(frontendDir, "src/providers"));
    copyDir(join(TEMPLATES_DIR, "frontend/lib"), join(frontendDir, "src/lib"));
    copyDir(join(TEMPLATES_DIR, "frontend/examples"), join(frontendDir, "src/examples"));
    logOk("frontend/ agentic kit overlay applied");
  }
  if (types.includes("backend") || types.includes("full")) {
    const dst = join(targetDir, "backend");
    copyDir(join(TEMPLATES_DIR, "backend"), dst, (p) => !p.endsWith("package-lock.json"));
    logOk("backend/");
  }
  if (types.includes("cicd") || types.includes("full")) {
    copyDir(join(TEMPLATES_DIR, "cicd"), join(targetDir, ".github/workflows"));
    logOk(".github/workflows/");
  }
  if (types.includes("tests") || types.includes("full")) {
    copyDir(join(PKG_ROOT, "tests"), join(targetDir, "tests"));
    logOk("tests/");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const usage = `
  ${color("Usage", "bold")}
    ${color("npx create-stellar-agentic <project-name>", "cyan")}              ${color("Scaffold a new project", "dim")}
    ${color("npx create-stellar-agentic skills add <name>", "cyan")}           ${color("Install a skill to ~/.claude/skills/", "dim")}
    ${color("npx create-stellar-agentic skills list", "cyan")}                 ${color("List available and installed skills", "dim")}
    ${color("npx create-stellar-agentic skills install-all", "cyan")}          ${color("Install all framework skills", "dim")}
    ${color("npx create-stellar-agentic --skill-only <dir>", "cyan")}         ${color("Install framework into existing project", "dim")}
    ${color("npx create-stellar-agentic --help", "cyan")}

  ${color("Options", "bold")}
    ${color("--skill-only", "yellow")}     Install only the Agentic OS skill files into an existing project
    ${color("--template <t>", "yellow")}   Scaffold type: full, contract-only, frontend-only, backend-only, payment-only
    ${color("--no-install", "yellow")}     Skip npm install step
    ${color("--yes, -y", "yellow")}        Skip all prompts

  ${color("Examples", "bold")}
    ${color("npx create-stellar-agentic my-stellar-dapp", "dim")}
    ${color("npx create-stellar-agentic skills add smart-contracts", "dim")}
    ${color("npx create-stellar-agentic skills add graphify data", "dim")}
    ${color("npx create-stellar-agentic . --skill-only", "dim")}
`;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(BANNER);
    console.log(usage);
    process.exit(0);
  }

  // Skills subcommand routing
  if (args[0] === "skills") {
    const sub = args[1];
    switch (sub) {
      case "list":
        cmdList();
        break;
      case "add":
        cmdAdd(args.slice(2));
        break;
      case "install-all":
        cmdInstallAll();
        break;
      default:
        console.error(`  ${color(symbol("cross"), "red")} Unknown subcommand: ${color(sub || "", "yellow")}`);
        console.log(usage);
        process.exit(1);
    }
    process.exit(0);
  }

  const skillOnly = args.includes("--skill-only");
  const noInstall = args.includes("--no-install");
  const skipPrompts = args.includes("--yes") || args.includes("-y");

  let tmplIdx = args.indexOf("--template");
  let tmplType = "full";
  if (tmplIdx !== -1 && tmplIdx + 1 < args.length) {
    tmplType = args[tmplIdx + 1];
  }

  let targetDir;
  if (skillOnly) {
    const dirIdx = args.indexOf("--skill-only");
    targetDir = args[dirIdx + 1] || ".";
  } else {
    const nameArg = args.find((a) => !a.startsWith("-"));
    targetDir = nameArg || (IS_TTY ? await ask("Project name:") : ".");
  }

  targetDir = targetDir.trim();
  if (!targetDir) {
    console.error(`  ${color(symbol("cross"), "red")} No project directory specified.`);
    console.log(usage);
    process.exit(1);
  }

  const resolved = join(process.cwd(), targetDir);

  console.log(BANNER);

  if (skillOnly) {
    console.log(`  ${color("Installing framework into", "bold")} ${color(targetDir, "cyan")}\n`);
    copyFrameworkSkill(resolved);
    logOk("SKILL.md + CLAUDE.md");
    logOk("6 specialist agents");
    logOk("4 slash commands (scaffold, deploy, test-e2e, graphify)");
    logOk("eval criteria per component");
    logOk("data/ directory for project memory");
    await installDependencySkills();
    console.log(`\n  ${color(symbol("star"), "green")} ${color("Stellar Agentic Framework ready!", "bold")}`);
    console.log(`  ${color("Run /scaffold to generate templates or use agents directly.", "dim")}\n`);
    process.exit(0);
  }

  const TOTAL = noInstall ? 3 : 4;
  let step = 0;

  console.log(`  ${color("Creating", "bold")} ${color(targetDir + "/", "cyan")}\n`);

  if (existsSync(resolved) && !skipPrompts) {
    const ok = await ask(`Directory "${targetDir}" already exists. Overwrite? (y/N)`);
    if (ok.toLowerCase() !== "y") {
      console.log(`  ${color(symbol("cross"), "red")} Aborted.\n`);
      process.exit(0);
    }
  }

  mkdirSync(resolved, { recursive: true });

  step++;
  logStep(step, TOTAL, "Copying framework skill files");
  copyFrameworkSkill(resolved);
  logOk("Framework kernel (SKILL.md, CLAUDE.md)");
  logOk("6 specialist agents");
  logOk("Slash commands + evals + data/");

  const types = tmplType === "full"
    ? ["contracts", "frontend", "backend", "cicd", "tests"]
    : tmplType === "contract-only" ? ["contracts"]
    : tmplType === "frontend-only" ? ["frontend"]
    : tmplType === "backend-only" ? ["backend"]
    : tmplType === "payment-only" ? ["backend"]
    : ["contracts", "frontend", "backend", "cicd"];

  step++;
  logStep(step, TOTAL, `Scaffolding ${tmplType} project`);
  await scaffoldTemplates(resolved, types, skipPrompts);

  // Install Stellar packages in frontend
  if (types.includes("frontend") || types.includes("full")) {
    const frontendDir = join(resolved, "frontend");
    if (existsSync(join(frontendDir, "package.json")) && !noInstall) {
      try {
        const sp2 = startSpinner("Installing Stellar packages");
        await runAsync("npm", ["install", "@stellar/stellar-sdk@^12.0.0", "@creit.tech/stellar-wallets-kit@^1.0.0", "@stellar/freighter-api@^2.0.0"], { cwd: frontendDir, timeout: 180000 });
        sp2.stop(true);
        logOk("Stellar packages installed");
      } catch {
        logWarn("npm install failed — run npm install manually in frontend/");
      }
    }
  }

  step++;
  logStep(step, TOTAL, "Installing Claude Code skills");
  if (!noInstall) {
    await installDependencySkills();
  }

  // Project README
  const projectName = basename(resolved);
  writeFileSync(join(resolved, "README.md"), `# ${projectName}

Scaffolded with [create-stellar-agentic](https://github.com/rylsherdamz-rgb/stellar-forge).

## Quick Start
\`\`\`bash
cd frontend && npm run dev     # Next.js + Stellar Wallets Kit
cd backend && npm run dev      # Express + x402/MPP
\`\`\`

## Components
${types.includes("contracts") ? "- **contracts/** — Rust smart contracts (soroban-sdk)\n" : ""}${types.includes("frontend") ? "- **frontend/** — Next.js 15 + Tailwind CSS v4 + Stellar Wallets Kit\n" : ""}${types.includes("backend") ? "- **backend/** — Express API + x402/MPP payments\n" : ""}- **agents/** — 6 specialist agents (contracts, frontend, backend, payments, ops, ZK)
- **evals/** — Evaluation criteria per component
- **.claude/commands/** — Slash commands for deploy, test-e2e, graphify

## Stellar Agentic Framework

This project uses the [Stellar Agentic Framework](https://github.com/rylsherdamz-rgb/stellar-forge) — an eval-driven, multi-agent harness for building production Stellar dApps.
`);

  console.log();
  console.log(`  ${color(symbol("star"), "green")} ${color("  " + projectName + " created!", "bold")}`);
  console.log();
  console.log(`  ${color("  cd " + targetDir, "cyan")}`);
  console.log();
  console.log(`  ${color("Next steps", "bold")}`);
  if (types.includes("contracts")) {
    logItem("cd contracts && cargo build --release", "Build Rust smart contracts");
  }
  if (types.includes("frontend")) {
    logItem("cd frontend && npm run dev", "Start the Next.js dev server");
  }
  if (types.includes("backend")) {
    logItem("cd backend && npm run dev", "Start the Express API server");
  }
  console.log();
  logItem("/graphify query \"architecture\"", "Explore project with knowledge graph");
  logItem("/deploy . testnet", "Deploy contracts to testnet");
  console.log();
}

main().catch((err) => {
  console.error(`\n  ${color(symbol("cross"), "red")} ${color("Error:", "bold")} ${err.message}\n`);
  process.exit(1);
});
