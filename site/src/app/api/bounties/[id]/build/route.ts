import { NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import { getBounty } from "@/lib/store";
import {
  buildCreateBounty,
  buildClaimBounty,
  buildSubmitBounty,
  buildApproveBounty,
  buildRefundBounty,
  buildCancelBounty,
  buildRejectSubmission,
  buildClaimAfterReview,
  explainContractError,
} from "@/lib/contract";
import { metadataHash, submissionHash, reasonHash } from "@/lib/commitments";
import { sessionAddress } from "@/lib/session";

const PR_URL = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\/?$/;

type Action = "create" | "claim" | "submit" | "approve" | "refund" | "cancel" | "reject" | "claim_review";

// POST /api/bounties/:id/build
// Body: { action, address, ...extra }
// Returns { xdr } — an UNSIGNED, simulated + prepared transaction for the
// wallet to sign. The server never signs anything. These checks only give
// early, readable errors; the contract re-enforces every rule on-chain.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bounty = await getBounty(id);
  if (!bounty) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as Action;
  const address = String(body.address || "");
  if (!StrKey.isValidEd25519PublicKey(address)) {
    return NextResponse.json({ error: "A valid Stellar address is required" }, { status: 400 });
  }

  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
  if (sessionAddress(req) !== address) {
    return fail("Sign in with this wallet first", 401);
  }
  const isCreator = address === bounty.creator;
  const escrowId = bounty.escrowId;

  try {
    let xdr: string;
    switch (action) {
      case "create": {
        if (!isCreator) return fail("Only the bounty creator can fund it", 403);
        if (escrowId != null || bounty.tx.created) return fail("Bounty is already funded", 409);
        if (!bounty.deadlineLedger) return fail("Bounty has no deadline ledger");
        xdr = await buildCreateBounty({
          creator: address,
          amountXlm: bounty.rewardAmount,
          deadlineLedger: bounty.deadlineLedger,
          metadataHash: await metadataHash(bounty),
        });
        break;
      }
      case "claim": {
        if (escrowId == null) return fail("Bounty is not funded on-chain yet", 409);
        if (isCreator) return fail("Creators cannot claim their own bounty", 403);
        xdr = await buildClaimBounty({ developer: address, escrowId });
        break;
      }
      case "submit": {
        if (escrowId == null) return fail("Bounty is not funded on-chain yet", 409);
        if (address !== bounty.claimedBy) return fail("Only the developer who claimed this bounty can submit", 403);
        const prUrl = String(body.githubPrUrl || "").trim();
        if (!PR_URL.test(prUrl)) return fail("A GitHub pull request URL is required");
        xdr = await buildSubmitBounty({
          developer: address,
          escrowId,
          submissionHash: await submissionHash(prUrl, body.commitHash),
        });
        break;
      }
      case "reject": {
        if (escrowId == null) return fail("Bounty is not funded on-chain yet", 409);
        if (!isCreator) return fail("Only the bounty creator can request a revision", 403);
        const reason = String(body.reason || "").trim();
        if (reason.length < 10) return fail("Explain what needs to change (at least 10 characters)");
        if (reason.length > 2000) return fail("Keep the revision note under 2000 characters");
        xdr = await buildRejectSubmission({ creator: address, escrowId, reasonHash: await reasonHash(reason) });
        break;
      }
      case "claim_review": {
        if (escrowId == null) return fail("Bounty is not funded on-chain yet", 409);
        if (address !== bounty.claimedBy) return fail("Only the developer who submitted can collect", 403);
        xdr = await buildClaimAfterReview({ developer: address, escrowId });
        break;
      }
      case "approve":
      case "refund":
      case "cancel": {
        if (escrowId == null) return fail("Bounty is not funded on-chain yet", 409);
        if (!isCreator) return fail("Only the bounty creator can do this", 403);
        const build = { approve: buildApproveBounty, refund: buildRefundBounty, cancel: buildCancelBounty }[action];
        xdr = await build({ creator: address, escrowId });
        break;
      }
      default:
        return fail("Unknown action");
    }
    return NextResponse.json({ xdr });
  } catch (e) {
    // Simulation failures surface contract errors (e.g. BeforeDeadline, AlreadyClaimed).
    return fail(e instanceof Error ? explainContractError(e.message) : "Failed to build transaction", 422);
  }
}
