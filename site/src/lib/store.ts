// Lightweight metadata layer (SOW Deliverable 2 / §29).
//
// The database is NOT the source of truth for funds - the Soroban contract is.
// This store keeps off-chain descriptions and submission records and LINKS them
// to on-chain state via `escrowId` (the contract bounty id) and tx hashes.
//
// Backends: Postgres/Supabase when DATABASE_URL is set (db/migrations, lib/db),
// otherwise a JSON file so the reference implementation runs with zero
// external services.

import { promises as fs } from "fs";
import path from "path";
import { dbEnabled, getDb } from "./db/client";
import { pgCreate, pgGet, pgList, pgUpdate } from "./db/pg-store";

export type BountyStatus =
  | "OPEN"
  | "CLAIMED"
  | "SUBMITTED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "DISPUTED"
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
  /** hex sha256 committed on-chain as submission_hash. */
  submissionHash?: string;
}

export interface Bounty {
  id: string; // local id
  escrowId: number | null; // on-chain bounty id (source of truth link)
  title: string;
  description: string;
  requirements: string;
  acceptanceCriteria: string;
  githubRepository: string; // owner/repo
  /** Technology tags; optional for records created before filters shipped. */
  tech?: string[];
  rewardAmount: string; // human XLM amount, e.g. "25"
  asset: "XLM";
  deadlineLedger: number | null;
  status: BountyStatus;
  /** Last status read from the contract (authoritative when present). */
  onchainStatus?: BountyStatus;
  /** hex sha256 committed on-chain as metadata_hash at create time. */
  metadataHash?: string;
  creator: string; // wallet address
  claimedBy: string | null;
  submission: Submission | null;
  /** Cached advisory AI review of the current submission (never affects funds). */
  aiReview?: {
    verdict: "likely_meets" | "unclear" | "likely_does_not_meet";
    summary: string;
    criteria: { criterion: string; status: "met" | "unclear" | "not_met"; note: string }[];
    concerns: string[];
    prUrl: string;
    createdAt: string;
  };
  // On-chain evidence (tx hashes) - independently verifiable.
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
  if (dbEnabled()) return pgList(await getDb());
  const all = await readAll();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBounty(id: string): Promise<Bounty | null> {
  if (dbEnabled()) return pgGet(await getDb(), id);
  const all = await readAll();
  return all.find((b) => b.id === id) ?? null;
}

export async function createBounty(
  input: Omit<
    Bounty,
    "id" | "status" | "claimedBy" | "submission" | "tx" | "createdAt" | "updatedAt"
  >,
): Promise<Bounty> {
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
  if (dbEnabled()) return pgCreate(await getDb(), bounty);
  const all = await readAll();
  all.push(bounty);
  await writeAll(all);
  return bounty;
}

export async function updateBounty(
  id: string,
  patch: Partial<Bounty>,
): Promise<Bounty | null> {
  if (dbEnabled()) return pgUpdate(await getDb(), id, patch);
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
