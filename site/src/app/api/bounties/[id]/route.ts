import { NextResponse } from "next/server";
import { getBounty } from "@/lib/store";

// GET /api/bounties/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bounty = await getBounty(id);
  if (!bounty) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ bounty });
}
