import { NextResponse } from "next/server";
import { listBounties, createBounty } from "@/lib/store";

// GET /api/bounties - public list of bounties (metadata + on-chain link)
export async function GET() {
  const bounties = await listBounties();
  return NextResponse.json({ bounties });
}

// POST /api/bounties - create the off-chain metadata record (status OPEN,
// escrowId null). The on-chain deposit is confirmed separately via
// /api/bounties/:id/confirm-create once the wallet signs create_bounty.
export async function POST(req: Request) {
  const body = await req.json();
  const required = [
    "title",
    "description",
    "requirements",
    "acceptanceCriteria",
    "githubRepository",
    "rewardAmount",
    "creator",
  ];
  for (const f of required) {
    if (!body[f] || String(body[f]).trim() === "") {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 });
    }
  }
  if (!/^[^/]+\/[^/]+$/.test(body.githubRepository)) {
    return NextResponse.json(
      { error: "githubRepository must be owner/repo" },
      { status: 400 },
    );
  }
  if (Number(body.rewardAmount) <= 0) {
    return NextResponse.json({ error: "rewardAmount must be > 0" }, { status: 400 });
  }

  const bounty = await createBounty({
    escrowId: null,
    title: body.title,
    description: body.description,
    requirements: body.requirements,
    acceptanceCriteria: body.acceptanceCriteria,
    githubRepository: body.githubRepository,
    rewardAmount: String(body.rewardAmount),
    asset: "XLM",
    deadlineLedger: body.deadlineLedger ?? null,
    creator: body.creator,
  });
  return NextResponse.json({ bounty }, { status: 201 });
}
