// @stellar-forge/github
//
// GitHub is the vital verification point of Stellar Forge: a bounty is only
// eligible for on-chain approval once we can prove that a real Pull Request,
// in the expected repository, authored by the claiming developer, exists.
//
// Per SPEC.md §19-§20:
//   - PR exists
//   - AND the PR belongs to the expected repository
//   - AND the PR author matches the claimed developer (GitHub login)
//   - merge status is reported but does NOT auto-release funds in v1.
//
// This module NEVER touches escrow funds. It returns a verification verdict
// that the creator (a human) uses to decide whether to sign an approval.

const GITHUB_API = "https://api.github.com";

/**
 * Parse a GitHub Pull Request URL into {owner, repo, number}.
 * Accepts e.g. https://github.com/alice/project/pull/42
 * @param {string} url
 * @returns {{owner:string, repo:string, number:number}}
 */
export function parsePrUrl(url) {
  if (typeof url !== "string") throw new Error("PR url must be a string");
  const m = url
    .trim()
    .match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:[/?#].*)?$/i);
  if (!m) throw new Error(`Not a valid GitHub PR url: ${url}`);
  return { owner: m[1], repo: m[2], number: Number(m[3]) };
}

/**
 * Normalize a repository reference. Accepts "owner/repo" or a full URL.
 * @param {string} ref
 * @returns {{owner:string, repo:string}}
 */
export function parseRepo(ref) {
  if (typeof ref !== "string") throw new Error("repository must be a string");
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

/**
 * Fetch a Pull Request from the GitHub REST API.
 * Injectable `fetchImpl` keeps this testable without network access.
 * @param {{owner:string, repo:string, number:number}} pr
 * @param {{token?:string, fetchImpl?:typeof fetch}} [opts]
 */
export async function fetchPullRequest(pr, opts = {}) {
  const { token, fetchImpl = fetch } = opts;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "stellar-forge",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${GITHUB_API}/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`;
  const res = await fetchImpl(url, { headers });
  if (res.status === 404) {
    const err = new Error("PR_NOT_FOUND");
    err.code = "PR_NOT_FOUND";
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`GITHUB_ERROR_${res.status}`);
    err.code = "GITHUB_ERROR";
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Verify a bounty submission's PR against the expected repo + developer.
 *
 * @param {object} params
 * @param {string} params.prUrl              submitted Pull Request URL
 * @param {string} params.expectedRepo       "owner/repo" the bounty targets
 * @param {string} params.expectedGithubLogin the claiming developer's GitHub login
 * @param {object} [opts] { token, fetchImpl }
 * @returns {Promise<{verified:boolean, reasons:string[], pr:object|null,
 *   checks:{exists:boolean, repoMatches:boolean, authorMatches:boolean, merged:boolean}}>}
 */
export async function verifySubmission(params, opts = {}) {
  const { prUrl, expectedRepo, expectedGithubLogin } = params;
  const reasons = [];
  const checks = {
    exists: false,
    repoMatches: false,
    authorMatches: false,
    merged: false,
  };

  let parsedPr;
  try {
    parsedPr = parsePrUrl(prUrl);
  } catch (e) {
    return { verified: false, reasons: [e.message], pr: null, checks };
  }

  const expected = parseRepo(expectedRepo);

  // Check 1: repository match is a cheap structural check done before any call.
  checks.repoMatches =
    parsedPr.owner.toLowerCase() === expected.owner.toLowerCase() &&
    parsedPr.repo.toLowerCase() === expected.repo.toLowerCase();
  if (!checks.repoMatches) {
    reasons.push(
      `PR is in ${parsedPr.owner}/${parsedPr.repo}, expected ${expected.owner}/${expected.repo}`,
    );
  }

  let pr = null;
  try {
    pr = await fetchPullRequest(parsedPr, opts);
    checks.exists = true;
  } catch (e) {
    if (e.code === "PR_NOT_FOUND") reasons.push("PR does not exist");
    else reasons.push(`GitHub lookup failed: ${e.message}`);
    return { verified: false, reasons, pr: null, checks };
  }

  // Check 3: author matches the claimed developer's GitHub login.
  const author = pr?.user?.login ?? "";
  checks.authorMatches =
    !!expectedGithubLogin &&
    author.toLowerCase() === String(expectedGithubLogin).toLowerCase();
  if (!checks.authorMatches) {
    reasons.push(
      `PR author is "${author}", expected "${expectedGithubLogin}"`,
    );
  }

  // Reported, but NOT a gate for fund release in v1.
  checks.merged = pr?.merged === true || !!pr?.merged_at;

  const verified = checks.exists && checks.repoMatches && checks.authorMatches;
  return { verified, reasons, pr, checks };
}
