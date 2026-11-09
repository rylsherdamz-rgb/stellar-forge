// sha256 -> 32-byte Uint8Array, matching the contract's BytesN<32> metadata_hash
// and submission_hash. Isomorphic: uses Web Crypto in the browser and node:crypto
// on the server.

export async function sha256Bytes(input: string): Promise<Uint8Array> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input);
    // Copy into a fresh ArrayBuffer-backed view to satisfy BufferSource typing.
    const buf = new Uint8Array(encoded.length);
    buf.set(encoded);
    const digest = await window.crypto.subtle.digest("SHA-256", buf);
    return new Uint8Array(digest);
  }
  const { createHash } = await import("crypto");
  return new Uint8Array(createHash("sha256").update(input).digest());
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Commitment to the off-chain bounty description, stored on-chain as
 * `metadata_hash`. Anyone can recompute it from the metadata record to check
 * the description was not edited after funding.
 */
export async function metadataHash(b: {
  title: string;
  description: string;
  requirements: string;
  acceptanceCriteria: string;
  githubRepository: string;
  rewardAmount: string;
}): Promise<Uint8Array> {
  return sha256Bytes(
    JSON.stringify([
      b.title,
      b.description,
      b.requirements,
      b.acceptanceCriteria,
      b.githubRepository,
      b.rewardAmount,
    ]),
  );
}

/** Commitment to a submission (`submission_hash`): PR url + optional commit. */
export async function submissionHash(prUrl: string, commitHash?: string): Promise<Uint8Array> {
  return sha256Bytes(`${prUrl.trim()}\n${(commitHash ?? "").trim()}`);
}
