import { NextResponse } from "next/server";
import { getBounty } from "@/lib/store";
import { eventsFor, syncIfStale } from "@/lib/indexer";
import { explorerTx } from "@/lib/config";

// GET /api/bounties/:id/events -> chain-ordered lifecycle events with tx links.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bounty = await getBounty(id);
  if (!bounty) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bounty.escrowId == null) return NextResponse.json({ events: [] });

  await syncIfStale(60_000);
  const events = (await eventsFor(bounty.escrowId)).map((e) => ({
    ...e,
    explorer: explorerTx(e.txHash),
  }));
  return NextResponse.json({ events });
}
