import { NextResponse } from "next/server";
import { getBounty, updateBounty } from "@/lib/store";
import { readBounty } from "@/lib/contract";

// GET /api/bounties/:id[?sync=1]
// With sync=1, re-reads the bounty from the contract and reconciles the cached
// status/developer, so state changed outside this app (expiry refunds, admin
// dispute resolution) still shows up correctly.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let bounty = await getBounty(id);
  if (!bounty) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sync = new URL(req.url).searchParams.get("sync") === "1";
  if (sync && bounty.escrowId != null) {
    const onchain = await readBounty(bounty.escrowId);
    if (
      onchain &&
      (onchain.status !== bounty.status || onchain.developer !== bounty.claimedBy)
    ) {
      bounty =
        (await updateBounty(id, {
          status: onchain.status,
          onchainStatus: onchain.status,
          claimedBy: onchain.developer,
        })) ?? bounty;
    }
  }
  return NextResponse.json({ bounty });
}
