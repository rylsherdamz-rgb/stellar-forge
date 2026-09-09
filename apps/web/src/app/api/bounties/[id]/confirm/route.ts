import { NextResponse } from "next/server";
import { getBounty, updateBounty, type BountyStatus } from "@/lib/store";
import { submitSigned, readBounty } from "@/lib/contract";
import { verifySubmission } from "@stellar-forge/github";

// POST /api/bounties/:id/confirm
// Body: { action, signedXdr, address, ...meta }
// Submits the wallet-signed transaction, records the tx hash, syncs on-chain
// state into the metadata store, and (for submit) verifies the GitHub PR.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bounty = await getBounty(id);
  if (!bounty) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { action, signedXdr } = body;
  if (!signedXdr) return NextResponse.json({ error: "signedXdr required" }, { status: 400 });

  let hash: string;
  try {
    hash = await submitSigned(signedXdr);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Submission failed" },
      { status: 502 },
    );
  }

  const statusFor: Record<string, BountyStatus> = {
    create: "OPEN",
    claim: "CLAIMED",
    submit: "SUBMITTED",
    approve: "COMPLETED",
    refund: "REFUNDED",
    cancel: "CANCELLED",
  };
  const txKey: Record<string, keyof NonNullable<typeof bounty.tx>> = {
    create: "created",
    claim: "claimed",
    submit: "submitted",
    approve: "approved",
    refund: "refunded",
    cancel: "cancelled",
  };

  const patch: Record<string, unknown> = {
    status: statusFor[action] ?? bounty.status,
    tx: { [txKey[action]]: hash },
  };

  if (action === "create") {
    // Link the new on-chain bounty id (escrowId) if provided by the client
    // (read from the create_bounty return value / next_id).
    if (typeof body.escrowId === "number") patch.escrowId = body.escrowId;
  }
  if (action === "claim") {
    patch.claimedBy = body.address ?? bounty.creator;
  }
  if (action === "submit") {
    let verified: boolean | undefined;
    let verifyReasons: string[] = [];
    try {
      const result = await verifySubmission(
        {
          prUrl: body.githubPrUrl,
          expectedRepo: bounty.githubRepository,
          expectedGithubLogin: body.githubLogin,
        },
        { token: process.env.GITHUB_TOKEN },
      );
      verified = result.verified;
      verifyReasons = result.reasons;
    } catch (e) {
      verifyReasons = [e instanceof Error ? e.message : "verification error"];
    }
    patch.submission = {
      githubPrUrl: body.githubPrUrl,
      description: body.description || "",
      commitHash: body.commitHash,
      developer: body.address,
      githubLogin: body.githubLogin,
      submittedAt: new Date().toISOString(),
      verified,
      verifyReasons,
    };
  }

  // Sync authoritative on-chain state where possible (best-effort).
  if (bounty.escrowId != null) {
    const onchain = await readBounty(bounty.escrowId);
    if (onchain && typeof onchain.status === "string") {
      patch.onchainStatus = onchain.status;
    }
  }

  const updated = await updateBounty(id, patch);
  return NextResponse.json({ bounty: updated, txHash: hash });
}
