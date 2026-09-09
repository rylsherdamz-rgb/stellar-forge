// Lightweight metadata layer (SOW Deliverable 2 / §29).
//
// The database is NOT the source of truth for funds — the Soroban contract is.
// This store keeps off-chain descriptions and submission records and LINKS them
// to on-chain state via `escrowId` (the contract bounty id) and tx hashes.
//
// Uses a JSON file so the reference implementation is reproducible with zero
// external services. Swap `readAll`/`writeAll` for Supabase/Postgres later.

import { promises as fs } from "fs";
import path from "path";

export type BountyStatus =
  | "OPEN"
  | "CLAIMED"
  | "SUBMITTED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export interface Submission {
  githubPrUrl: string;
  description: string;
  commitHash?: string;
  developer: string; // wallet address
  githubLogin?: string;
  submittedAt: string;
  verified?: boolean;
  verifyReasons?: string[];
}

export interface Bounty {
  id: string; // local id
  escrowId: number | null; // on-chain bounty id (source of truth link)
  title: string;
  description: string;
  requirements: string;
  acceptanceCriteria: string;
  githubRepository: string; // owner/repo
  rewardAmount: string; // human XLM amount, e.g. "25"
  asset: "XLM";
  deadlineLedger: number | null;
  status: BountyStatus;
  creator: string; // wallet address
  claimedBy: string | null;
  submission: Submission | null;
  // On-chain evidence (tx hashes) — independently verifiable.
  tx: {
    created?: string;
    claimed?: string;
    submitted?: string;
    approved?: string;
    refunded?: string;
    cancelled?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bounties.json");

async function readAll(): Promise<Bounty[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Bounty[];
  } catch {
    return [];
  }
}

async function writeAll(list: Bounty[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

export async function listBounties(): Promise<Bounty[]> {
  const all = await readAll();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBounty(id: string): Promise<Bounty | null> {
  const all = await readAll();
  return all.find((b) => b.id === id) ?? null;
}

export async function createBounty(
  input: Omit<
    Bounty,
    "id" | "status" | "claimedBy" | "submission" | "tx" | "createdAt" | "updatedAt"
  >,
): Promise<Bounty> {
  const all = await readAll();
  const now = new Date().toISOString();
  const bounty: Bounty = {
    ...input,
    id: `b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    status: "OPEN",
    claimedBy: null,
    submission: null,
    tx: {},
    createdAt: now,
    updatedAt: now,
  };
  all.push(bounty);
  await writeAll(all);
  return bounty;
}

export async function updateBounty(
  id: string,
  patch: Partial<Bounty>,
): Promise<Bounty | null> {
  const all = await readAll();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    ...patch,
    tx: { ...all[idx].tx, ...(patch.tx || {}) },
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  return all[idx];
}
