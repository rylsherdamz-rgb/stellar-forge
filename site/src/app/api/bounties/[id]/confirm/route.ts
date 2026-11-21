import { NextResponse } from "next/server";
import { getBounty, updateBounty, type Bounty, type BountyStatus } from "@/lib/store";
import { submitSigned, readBounty, inspectInvoke, explainContractError } from "@/lib/contract";
import { metadataHash, submissionHash, toHex } from "@/lib/commitments";
import { verifySubmission } from "@/lib/github";
import { CONFIG } from "@/lib/config";
import { sessionAddress } from "@/lib/session";

type Action = "create" | "claim" | "submit" | "approve" | "refund" | "cancel";

const METHOD: Record<Action, string[]> = {
  create: ["create_bounty"],
  claim: ["claim_bounty"],
  submit: ["submit_bounty"],
  approve: ["approve_bounty", "release_payment"],
  refund: ["refund_bounty"],
  cancel: ["cancel_bounty"],
};

// Fallback when the chain can't be read right after the tx lands.
const STATUS_AFTER: Record<Action, BountyStatus> = {
  create: "OPEN",
  claim: "CLAIMED",
  submit: "SUBMITTED",
  approve: "COMPLETED",
  refund: "REFUNDED",
  cancel: "CANCELLED",
};

const TX_KEY: Record<Action, keyof Bounty["tx"]> = {
  create: "created",
  claim: "claimed",
  submit: "submitted",
  approve: "approved",
  refund: "refunded",
  cancel: "cancelled",
};

// POST /api/bounties/:id/confirm
// Body: { action, signedXdr, address, ...meta }
// Relays a wallet-signed transaction, then records the tx hash and syncs the
// metadata record from the contract. The contract is the source of truth: the
// stored status is whatever `get_bounty` reports after the tx, not what the
// client claims happened.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bounty = await getBounty(id);
  if (!bounty) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as Action;
  const signedXdr = body.signedXdr as string | undefined;
  if (!METHOD[action]) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (!signedXdr) return NextResponse.json({ error: "signedXdr required" }, { status: 400 });

  // Only relay a single call to the Forge contract for the declared action.
  const call = inspectInvoke(signedXdr);
  if (!call || call.contractId !== CONFIG.contractId || !METHOD[action].includes(call.method)) {
    return NextResponse.json(
      { error: "Signed transaction does not match this action" },
      { status: 400 },
    );
  }
  if (sessionAddress(req) !== call.source) {
    return NextResponse.json({ error: "Sign in with the wallet that signed this transaction" }, { status: 401 });
  }
  if (action === "create" && (bounty.escrowId != null || bounty.tx.created)) {
    return NextResponse.json({ error: "Bounty is already funded" }, { status: 409 });
  }

  let hash: string;
  let returnValue: unknown;
  try {
    ({ hash, returnValue } = await submitSigned(signedXdr));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? explainContractError(e.message) : "Submission failed" },
      { status: 502 },
    );
  }

  const patch: Partial<Bounty> = { tx: { [TX_KEY[action]]: hash } };

  let escrowId = bounty.escrowId;
  if (action === "create") {
    // create_bounty returns the on-chain id; never trust a client-supplied one.
    if (returnValue != null) escrowId = Number(returnValue);
    patch.escrowId = escrowId;
    patch.metadataHash = toHex(await metadataHash(bounty));
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
      developer: call.source,
      githubLogin: body.githubLogin,
      submittedAt: new Date().toISOString(),
      verified,
      verifyReasons,
      submissionHash: toHex(await submissionHash(body.githubPrUrl, body.commitHash)),
    };
  }

  // Sync authoritative on-chain state.
  const onchain = escrowId != null ? await readBounty(escrowId) : null;
  if (onchain) {
    // The PR link we store must be the one the developer committed on-chain.
    if (
      action === "submit" &&
      patch.submission &&
      onchain.submissionHash &&
      onchain.submissionHash !== patch.submission.submissionHash
    ) {
      patch.submission = {
        ...patch.submission,
        verified: false,
        verifyReasons: [
          ...(patch.submission.verifyReasons ?? []),
          "Submitted PR link does not match the on-chain submission hash",
        ],
      };
    }
    patch.status = onchain.status;
    patch.onchainStatus = onchain.status;
    patch.claimedBy = onchain.developer;
  } else {
    patch.status = STATUS_AFTER[action];
    if (action === "claim") patch.claimedBy = call.source;
  }

  const updated = await updateBounty(id, patch);
  return NextResponse.json({ bounty: updated, txHash: hash });
}
