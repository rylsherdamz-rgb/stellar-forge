#!/usr/bin/env node
// suggest-compact.js — PreToolUse hook that suggests /compact at strategic intervals
//
// Install in ~/.claude/settings.json:
// {
//   "hooks": {
//     "PreToolUse": [
//       {
//         "matcher": "Edit",
//         "hooks": [{ "type": "command", "command": "node ~/.claude/scripts/hooks/suggest-compact.js" }]
//       },
//       {
//         "matcher": "Write",
//         "hooks": [{ "type": "command", "command": "node ~/.claude/scripts/hooks/suggest-compact.js" }]
//       }
//     ]
//   }
// }

const path = require("path");
const fs = require("fs");

const STATE_FILE = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".claude", ".compact-state.json");
const THRESHOLD = parseInt(process.env.COMPACT_THRESHOLD || "50", 10);
const REMINDER_INTERVAL = parseInt(process.env.COMPACT_REMINDER_INTERVAL || "25", 10);

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }
  } catch {}
  return { count: 0, lastSuggestionAt: 0, dismissed: false };
}

function saveState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch {}
}

function suggestCompact(count, threshold) {
  const messages = [
    `\n  tip: ${count} tool calls — consider /compact to free context`,
    `  good times: after research → before impl, after milestone, after debug`,
    `  what survives: CLAUDE.md, files on disk, git state, todo list`,
    `  what's lost: intermediate reasoning, read file contents, conversation`,
    "  run `/compact` with a note: /compact Focus on implementing X next\n"
  ];
  const isTTY = process.stderr && process.stderr.isTTY;
  const out = isTTY ? process.stderr : process.stdout;
  out.write(messages.join("\n"));
}

const state = loadState();
state.count += 1;

const callCount = state.count;
const threshold = state.dismissed ? THRESHOLD + REMINDER_INTERVAL : THRESHOLD;

if (callCount >= threshold && (callCount - state.lastSuggestionAt) >= REMINDER_INTERVAL) {
  suggestCompact(callCount, threshold);
  state.lastSuggestionAt = callCount;
  state.dismissed = false;
}

saveState(state);
