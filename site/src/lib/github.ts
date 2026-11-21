// GitHub Pull Request verification (self-contained for the hosted site).
//
// A bounty is only eligible for on-chain approval once a real Pull Request,
// in the expected repository, authored by the claiming developer, exists.
// Merge status is reported but does NOT auto-release funds (v1). This module
// never touches escrow funds.

const GITHUB_API = "https://api.github.com";

export function parsePrUrl(url: string): { owner: string; repo: string; number: number } {
  const m = url
    .trim()
    .match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:[/?#].*)?$/i);
  if (!m) throw new Error(`Not a valid GitHub PR url: ${url}`);
  return { owner: m[1], repo: m[2], number: Number(m[3]) };
}

export function parseRepo(ref: string): { owner: string; repo: string } {
  const cleaned = ref
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/, "");
  const parts = cleaned.split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    throw new Error(`repository must be "owner/repo": ${ref}`);
  }
  return { owner: parts[0], repo: parts[1] };
}

export interface VerifyResult {
  verified: boolean;
  reasons: string[];
  checks: { exists: boolean; repoMatches: boolean; authorMatches: boolean; merged: boolean };
}

export async function verifySubmission(
  params: { prUrl: string; expectedRepo: string; expectedGithubLogin?: string },
  opts: { token?: string } = {},
): Promise<VerifyResult> {
  const reasons: string[] = [];
  const checks = { exists: false, repoMatches: false, authorMatches: false, merged: false };

  let parsedPr;
  try {
    parsedPr = parsePrUrl(params.prUrl);
  } catch (e) {
    return { verified: false, reasons: [(e as Error).message], checks };
  }
  const expected = parseRepo(params.expectedRepo);

  checks.repoMatches =
    parsedPr.owner.toLowerCase() === expected.owner.toLowerCase() &&
    parsedPr.repo.toLowerCase() === expected.repo.toLowerCase();
  if (!checks.repoMatches) {
    reasons.push(`PR is in ${parsedPr.owner}/${parsedPr.repo}, expected ${expected.owner}/${expected.repo}`);
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "stellar-forge",
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let pr: { user?: { login?: string }; merged?: boolean; merged_at?: string } | null = null;
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${parsedPr.owner}/${parsedPr.repo}/pulls/${parsedPr.number}`,
      { headers },
    );
    if (res.status === 404) {
      reasons.push("PR does not exist");
      return { verified: false, reasons, checks };
    }
    if (!res.ok) {
      reasons.push(`GitHub lookup failed: ${res.status}`);
      return { verified: false, reasons, checks };
    }
    pr = await res.json();
    checks.exists = true;
  } catch (e) {
    reasons.push(`GitHub lookup failed: ${(e as Error).message}`);
    return { verified: false, reasons, checks };
  }

  const author = pr?.user?.login ?? "";
  checks.authorMatches =
    !!params.expectedGithubLogin &&
    author.toLowerCase() === String(params.expectedGithubLogin).toLowerCase();
  if (!checks.authorMatches) {
    reasons.push(`PR author is "${author}", expected "${params.expectedGithubLogin}"`);
  }

  checks.merged = pr?.merged === true || !!pr?.merged_at;

  const verified = checks.exists && checks.repoMatches && checks.authorMatches;
  return { verified, reasons, checks };
}

export interface PrForReview {
  title: string;
  body: string;
  author: string;
  merged: boolean;
  files: { filename: string; status: string; additions: number; deletions: number; patch?: string }[];
  truncated: boolean;
}

/** Fetch PR title/body/changed files (patches capped) for an advisory review. */
export async function fetchPrForReview(
  prUrl: string,
  opts: { token?: string; maxPatchChars?: number } = {},
): Promise<PrForReview> {
  const { owner, repo, number } = parsePrUrl(prUrl);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "stellar-forge",
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const base = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}`;
  const [prRes, filesRes] = await Promise.all([
    fetch(base, { headers }),
    fetch(`${base}/files?per_page=100`, { headers }),
  ]);
  if (!prRes.ok) throw new Error(`GitHub PR lookup failed: ${prRes.status}`);
  const pr = await prRes.json();
  const files = filesRes.ok ? ((await filesRes.json()) as PrForReview["files"]) : [];

  let budget = opts.maxPatchChars ?? 40_000;
  let truncated = false;
  const trimmed = files.map((f) => {
    const patch = f.patch ?? "";
    if (patch.length <= budget) {
      budget -= patch.length;
      return { ...f, patch };
    }
    truncated = true;
    const part = patch.slice(0, Math.max(0, budget));
    budget = 0;
    return { ...f, patch: part ? `${part}\n…[truncated]` : undefined };
  });
  return {
    title: String(pr.title ?? ""),
    body: String(pr.body ?? "").slice(0, 8_000),
    author: String(pr.user?.login ?? ""),
    merged: pr.merged === true || !!pr.merged_at,
    files: trimmed,
    truncated,
  };
}
