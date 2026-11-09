import { NextResponse } from "next/server";
import { getBounty, updateBounty, type Bounty } from "@/lib/store";
import { readBounty } from "@/lib/contract";
import { escrowContract } from "@/lib/config";
import { fromOnchainStatus } from "@/lib/lifecycle";

// GET /api/bounties/:id
// Refreshes funded bounties from the contract on read, so changes made
// outside this app (CLI, another frontend, admin dispute resolution) show up.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let bounty = await getBounty(id);
  if (!bounty) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!bounty.demo && bounty.escrowId != null) {
    const onchain = await readBounty(bounty.escrowId, escrowContract(bounty));
    if (onchain) {
      const status = fromOnchainStatus(onchain.status) ?? bounty.status;
      const patch: Partial<Bounty> = {};
      if (status !== bounty.status) patch.status = status;
      if (onchain.status !== bounty.onchainStatus) patch.onchainStatus = onchain.status;
      if (onchain.developer !== bounty.claimedBy) patch.claimedBy = onchain.developer;
      if (onchain.deadline !== bounty.deadlineLedger) patch.deadlineLedger = onchain.deadline;
      if (Object.keys(patch).length) bounty = (await updateBounty(id, patch)) ?? bounty;
    }
  }
  return NextResponse.json({ bounty });
}
