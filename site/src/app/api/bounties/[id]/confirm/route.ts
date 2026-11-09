import { NextResponse } from "next/server";
import { getBounty, updateBounty, type Bounty } from "@/lib/store";
import { submitSigned, readBounty, inspectInvocation } from "@/lib/contract";
import { verifySubmission } from "@/lib/github";
import { CONFIG, escrowContract } from "@/lib/config";
import {
  METHOD_FOR,
  STATUS_AFTER,
  fromOnchainStatus,
  type Action,
} from "@/lib/lifecycle";

const TX_KEY: Record<Action, keyof Bounty["tx"]> = {
  create: "created",
  claim: "claimed",
  submit: "submitted",
  approve: "approved",
  refund: "refunded",
  cancel: "cancelled",
  unclaim: "unclaimed",
  dispute: "disputed",
  extend: "extended",
};

// POST /api/bounties/:id/confirm
// Body: { action, signedXdr, githubPrUrl?, githubLogin?, description?, commitHash? }
//
// Submits the wallet-signed transaction, records the tx hash, and syncs
// on-chain state into the metadata store. Facts that matter (escrow id,
// developer address, status) are taken from the transaction and the contract,
// never from the request body.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bounty = await getBounty(id);
  if (!bounty) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bounty.demo) {
    return NextResponse.json({ error: "Sample listings cannot be confirmed" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as Action;
  const signedXdr = body.signedXdr;
  if (!(action in METHOD_FOR)) {
    return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }
  if (typeof signedXdr !== "string" || !signedXdr) {
    return NextResponse.json({ error: "signedXdr required" }, { status: 400 });
  }

  // The signed transaction must be exactly the call this action implies.
  const inv = inspectInvocation(signedXdr);
  const contractId = escrowContract(bounty);
  if (!inv || inv.contractId !== contractId || inv.method !== METHOD_FOR[action]) {
    return NextResponse.json(
      { error: `Transaction is not a ${METHOD_FOR[action]} call on the escrow contract` },
      { status: 400 },
    );
  }
  if (action === "create") {
    if (String(inv.args[0]) !== bounty.creator) {
      return NextResponse.json({ error: "Creator does not match this bounty" }, { status: 400 });
    }
  } else if (bounty.escrowId == null || Number(inv.args[0]) !== bounty.escrowId) {
    return NextResponse.json({ error: "Transaction targets a different bounty" }, { status: 400 });
  }

  let hash: string;
  let returnValue: unknown;
  try {
    ({ hash, returnValue } = await submitSigned(signedXdr));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Submission failed" },
      { status: 502 },
    );
  }

  const patch: Partial<Bounty> = {
    status: STATUS_AFTER[action] ?? bounty.status,
    tx: { [TX_KEY[action]]: hash },
  };

  let escrowId = bounty.escrowId;
  if (action === "create") {
    // create_bounty returns the new on-chain id.
    escrowId = Number(returnValue);
    patch.escrowId = Number.isFinite(escrowId) ? escrowId : null;
    patch.contractId = CONFIG.contractId;
  }
  if (action === "claim") {
    patch.claimedBy = String(inv.args[1]);
  }
  if (action === "unclaim") {
    patch.claimedBy = null;
  }
  if (action === "submit") {
    const prUrl = String(body.githubPrUrl ?? "");
    let verified: boolean | undefined;
    let verifyReasons: string[] = [];
    try {
      const result = await verifySubmission(
        {
          prUrl,
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
      githubPrUrl: prUrl,
      description: String(body.description ?? ""),
      commitHash: body.commitHash ? String(body.commitHash) : undefined,
      developer: String(inv.args[1]),
      githubLogin: body.githubLogin ? String(body.githubLogin) : undefined,
      submittedAt: new Date().toISOString(),
      verified,
      verifyReasons,
    };
  }

  // The contract is the source of truth: prefer its status when readable.
  if (escrowId != null && Number.isFinite(escrowId)) {
    const onchain = await readBounty(escrowId, contractId);
    if (onchain) {
      patch.onchainStatus = onchain.status;
      const s = fromOnchainStatus(onchain.status);
      if (s) patch.status = s;
      patch.claimedBy = onchain.developer;
      patch.deadlineLedger = onchain.deadline;
    }
  }

  const updated = await updateBounty(id, patch);
  return NextResponse.json({ bounty: updated, txHash: hash });
}
