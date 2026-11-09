import { NextResponse } from "next/server";
import { listBounties, createBounty } from "@/lib/store";

// GET /api/bounties - public list of bounties.
// Unfunded drafts (metadata saved but create_bounty never confirmed) are only
// returned to their creator via ?creator=G..., so every public "Open" listing
// is backed by escrow (or is a labelled sample).
export async function GET(req: Request) {
  const creator = new URL(req.url).searchParams.get("creator");
  const bounties = (await listBounties()).filter(
    (b) => b.demo || b.escrowId != null || (creator && b.creator === creator),
  );
  return NextResponse.json({ bounties });
}

// POST /api/bounties - create off-chain bounty metadata
export async function POST(req: Request) {
  const body = await req.json();

  const required = [
    "title",
    "description",
    "requirements",
    "acceptanceCriteria",
    "githubRepository",
    "tech",
    "rewardAmount",
    "creator",
  ];

  for (const field of required) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      String(body[field]).trim() === ""
    ) {
      return NextResponse.json(
        { error: `Missing field: ${field}` },
        { status: 400 },
      );
    }
  }

  // GitHub repository must be in owner/repo format.
  if (
    typeof body.githubRepository !== "string" ||
    !/^[^/]+\/[^/]+$/.test(body.githubRepository)
  ) {
    return NextResponse.json(
      { error: "githubRepository must be owner/repo" },
      { status: 400 },
    );
  }

  const reward = String(body.rewardAmount).trim();
  if (!/^\d+(\.\d{1,7})?$/.test(reward) || Number(reward) <= 0) {
    return NextResponse.json(
      { error: "rewardAmount must be a positive XLM amount with at most 7 decimals" },
      { status: 400 },
    );
  }

  if (typeof body.creator !== "string" || !/^G[A-Z2-7]{55}$/.test(body.creator)) {
    return NextResponse.json({ error: "creator must be a Stellar address" }, { status: 400 });
  }

  const deadlineLedger = Number(body.deadlineLedger);
  if (!Number.isInteger(deadlineLedger) || deadlineLedger <= 0) {
    return NextResponse.json({ error: "deadlineLedger is required" }, { status: 400 });
  }

  const tech = Array.isArray(body.tech)
    ? body.tech
        .map((item: unknown) => String(item).trim())
        .filter(Boolean)
    : [];

  if (tech.length === 0) {
    return NextResponse.json(
      { error: "At least one technology is required" },
      { status: 400 },
    );
  }

  const bounty = await createBounty({
    escrowId: null,
    title: body.title,
    description: body.description,
    requirements: body.requirements,
    acceptanceCriteria: body.acceptanceCriteria,
    githubRepository: body.githubRepository,
    tech,
    rewardAmount: reward,
    asset: "XLM",
    deadlineLedger,
    creator: body.creator,
  });

  return NextResponse.json({ bounty }, { status: 201 });
}
