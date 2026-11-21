// Postgres implementation of the metadata store (selected when DATABASE_URL
// is set). Mirrors the JSON store's API so routes don't change.

import type { Db } from "./client";
import type { Bounty, BountyStatus, Submission } from "../store";
import { CONFIG } from "../config";

const TX_TYPE: Record<keyof Bounty["tx"], string> = {
  created: "ESCROW_DEPOSIT",
  claimed: "CLAIM",
  submitted: "SUBMIT",
  approved: "BOUNTY_RELEASE",
  refunded: "REFUND",
  cancelled: "CANCEL",
  rejected: "REJECT",
};
const TX_KEY = Object.fromEntries(Object.entries(TX_TYPE).map(([k, v]) => [v, k])) as Record<
  string,
  keyof Bounty["tx"]
>;

interface BountyRow {
  id: string;
  escrow_id: string | number | null;
  title: string;
  description: string;
  requirements: string;
  acceptance_criteria: string;
  github_repository: string;
  tech: string[];
  reward_amount: string;
  asset: "XLM";
  deadline_ledger: number | null;
  status: BountyStatus;
  onchain_status: BountyStatus | null;
  metadata_hash: string | null;
  creator: string;
  claimed_by: string | null;
  ai_review: Bounty["aiReview"] | string | null;
  rejections: Bounty["rejections"] | string | null;
  created_at: string | Date;
  updated_at: string | Date;
  submission: Record<string, unknown> | string | null;
  tx: Record<string, string> | string | null;
}

/** Normalize numeric(20,7) text like "25.0000000" back to "25". */
function amount(v: string): string {
  return v.includes(".") ? v.replace(/0+$/, "").replace(/\.$/, "") : v;
}
const iso = (v: string | Date) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString());
const json = <T>(v: T | string | null): T | null => (typeof v === "string" ? (JSON.parse(v) as T) : v);

function toBounty(r: BountyRow): Bounty {
  const s = json<Record<string, unknown>>(r.submission);
  const txRows = json<Record<string, string>>(r.tx) ?? {};
  const tx: Bounty["tx"] = {};
  for (const [type, hash] of Object.entries(txRows)) if (TX_KEY[type]) tx[TX_KEY[type]] = hash;
  return {
    id: r.id,
    escrowId: r.escrow_id == null ? null : Number(r.escrow_id),
    title: r.title,
    description: r.description,
    requirements: r.requirements,
    acceptanceCriteria: r.acceptance_criteria,
    githubRepository: r.github_repository,
    tech: r.tech ?? [],
    rewardAmount: amount(String(r.reward_amount)),
    asset: r.asset,
    deadlineLedger: r.deadline_ledger,
    status: r.status,
    ...(r.onchain_status ? { onchainStatus: r.onchain_status } : {}),
    ...(r.metadata_hash ? { metadataHash: r.metadata_hash } : {}),
    creator: r.creator,
    claimedBy: r.claimed_by,
    submission: s
      ? {
          githubPrUrl: String(s.github_pr_url),
          description: String(s.description ?? ""),
          commitHash: (s.commit_hash as string) ?? undefined,
          developer: String(s.developer),
          githubLogin: (s.github_login as string) ?? undefined,
          submittedAt: iso(String(s.submitted_at)),
          verified: (s.verified as boolean | null) ?? undefined,
          verifyReasons: (s.verify_reasons as string[]) ?? [],
          submissionHash: (s.submission_hash as string) ?? undefined,
        }
      : null,
    ...(r.ai_review ? { aiReview: json(r.ai_review)! } : {}),
    ...(json(r.rejections)?.length ? { rejections: json(r.rejections)! } : {}),
    tx,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

const SELECT = `
  select b.*,
    (select row_to_json(s) from submissions s where s.bounty_id = b.id
       order by s.submitted_at desc, s.id desc limit 1) as submission,
    (select coalesce(json_object_agg(t.type, t.tx_hash), '{}'::json) from transactions t
       where t.bounty_id = b.id) as tx
  from bounties b`;

export async function pgList(db: Db): Promise<Bounty[]> {
  const rows = await db.query<BountyRow>(
    `${SELECT} where b.contract_id = $1 order by b.created_at desc`,
    [CONFIG.contractId],
  );
  return rows.map(toBounty);
}

export async function pgGet(db: Db, id: string): Promise<Bounty | null> {
  const rows = await db.query<BountyRow>(`${SELECT} where b.id = $1`, [id]);
  return rows[0] ? toBounty(rows[0]) : null;
}

async function ensureUser(db: Db, address: string | null | undefined, githubLogin?: string) {
  if (!address) return;
  await db.query(
    `insert into users (wallet_address, github_username) values ($1, $2)
     on conflict (wallet_address) do update
       set github_username = coalesce(excluded.github_username, users.github_username)`,
    [address, githubLogin ?? null],
  );
}

async function writeTx(db: Db, bounty: Bounty) {
  for (const [key, hash] of Object.entries(bounty.tx)) {
    if (!hash) continue;
    const type = TX_TYPE[key as keyof Bounty["tx"]];
    const value = ["ESCROW_DEPOSIT", "BOUNTY_RELEASE", "REFUND", "CANCEL"].includes(type)
      ? bounty.rewardAmount
      : null;
    await db.query(
      `insert into transactions (tx_hash, bounty_id, type, asset, amount)
       values ($1, $2, $3, $4, $5) on conflict (tx_hash) do nothing`,
      [hash, bounty.id, type, value ? bounty.asset : null, value],
    );
  }
}

async function writeSubmission(db: Db, bountyId: string, s: Submission) {
  await ensureUser(db, s.developer, s.githubLogin);
  await db.query(
    `insert into submissions (bounty_id, developer, github_pr_url, github_login, commit_hash,
       description, submission_hash, verified, verify_reasons, submitted_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      bountyId,
      s.developer,
      s.githubPrUrl,
      s.githubLogin ?? null,
      s.commitHash ?? null,
      s.description ?? "",
      s.submissionHash ?? null,
      s.verified ?? null,
      s.verifyReasons ?? [],
      s.submittedAt,
    ],
  );
}

async function upsertRow(db: Db, b: Bounty) {
  await ensureUser(db, b.creator);
  await ensureUser(db, b.claimedBy);
  await db.query(
    `insert into bounties (id, contract_id, escrow_id, title, description, requirements,
       acceptance_criteria, github_repository, tech, reward_amount, asset, deadline_ledger,
       status, onchain_status, metadata_hash, creator, claimed_by, ai_review, created_at, updated_at,
       rejections)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     on conflict (id) do update set
       escrow_id = excluded.escrow_id, title = excluded.title, description = excluded.description,
       requirements = excluded.requirements, acceptance_criteria = excluded.acceptance_criteria,
       github_repository = excluded.github_repository, tech = excluded.tech,
       reward_amount = excluded.reward_amount, asset = excluded.asset,
       deadline_ledger = excluded.deadline_ledger, status = excluded.status,
       onchain_status = excluded.onchain_status, metadata_hash = excluded.metadata_hash,
       claimed_by = excluded.claimed_by, ai_review = excluded.ai_review,
       rejections = excluded.rejections,
       updated_at = excluded.updated_at`,
    [
      b.id,
      CONFIG.contractId,
      b.escrowId,
      b.title,
      b.description,
      b.requirements,
      b.acceptanceCriteria,
      b.githubRepository,
      b.tech ?? [],
      b.rewardAmount,
      b.asset,
      b.deadlineLedger,
      b.status,
      b.onchainStatus ?? null,
      b.metadataHash ?? null,
      b.creator,
      b.claimedBy,
      b.aiReview ? JSON.stringify(b.aiReview) : null,
      b.createdAt,
      b.updatedAt,
      JSON.stringify(b.rejections ?? []),
    ],
  );
}

export async function pgCreate(db: Db, bounty: Bounty): Promise<Bounty> {
  await db.tx(async (t) => {
    await upsertRow(t, bounty);
    await writeTx(t, bounty);
  });
  return (await pgGet(db, bounty.id))!;
}

export async function pgUpdate(db: Db, id: string, patch: Partial<Bounty>): Promise<Bounty | null> {
  return db.tx(async (t) => {
    // Row lock so concurrent confirm/indexer updates serialize.
    const locked = await t.query("select id from bounties where id = $1 for update", [id]);
    if (locked.length === 0) return null;
    const current = (await pgGet(t, id))!;
    const next: Bounty = {
      ...current,
      ...patch,
      tx: { ...current.tx, ...(patch.tx || {}) },
      updatedAt: new Date().toISOString(),
    };
    await upsertRow(t, next);
    await writeTx(t, next);
    const s = patch.submission;
    if (s && (s.githubPrUrl !== current.submission?.githubPrUrl || s.submittedAt !== current.submission?.submittedAt)) {
      await writeSubmission(t, id, s);
    }
    return pgGet(t, id);
  });
}
