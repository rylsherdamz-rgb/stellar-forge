import { NextResponse } from "next/server";
import { listBounties, createBounty } from "@/lib/store";

// GET /api/bounties - public list of bounties
export async function GET() {
  const bounties = await listBounties();
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

  if (Number(body.rewardAmount) <= 0) {
    return NextResponse.json(
      { error: "rewardAmount must be > 0" },
      { status: 400 },
    );
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
    rewardAmount: String(body.rewardAmount),
    asset: "XLM",
    deadlineLedger: body.deadlineLedger ?? null,
    creator: body.creator,
  });

  return NextResponse.json({ bounty }, { status: 201 });
}
