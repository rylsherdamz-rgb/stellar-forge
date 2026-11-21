// Canonical preimages for the 32-byte hashes committed on-chain.
//
// Both are computed on the server so the value the contract stores always
// matches what the metadata store can re-derive. Anyone can recompute them
// from the public bounty record and compare with `get_bounty`.

import { sha256Bytes, toHex } from "./hash";
import type { Bounty } from "./store";

/** metadata_hash = sha256 of the creator-facing terms of the bounty. */
export async function metadataHash(b: Bounty): Promise<Uint8Array> {
  const preimage = JSON.stringify({
    v: 1,
    title: b.title,
    description: b.description,
    requirements: b.requirements,
    acceptanceCriteria: b.acceptanceCriteria,
    githubRepository: b.githubRepository,
    rewardAmount: b.rewardAmount,
    asset: b.asset,
  });
  return sha256Bytes(preimage);
}

/** submission_hash = sha256("<pr url>#<commit or empty>"). */
export async function submissionHash(prUrl: string, commitHash?: string): Promise<Uint8Array> {
  return sha256Bytes(`${prUrl.trim()}#${(commitHash || "").trim()}`);
}

export { toHex };
