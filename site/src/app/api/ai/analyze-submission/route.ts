import { NextResponse } from "next/server";
import { reviewSubmission, rateLimited, AiNotConfiguredError } from "@/lib/ai";
import { fetchPrForReview } from "@/lib/github";
import { getBounty, updateBounty } from "@/lib/store";
import { sessionAddress } from "@/lib/session";

// POST /api/ai/analyze-submission { bountyId, refresh? }
// Advisory only: returns a summary for the creator. Approval and payment stay a
// signed creator action against the contract; nothing here can trigger them.
export async function POST(req: Request) {
  const address = sessionAddress(req);
  if (!address) return NextResponse.json({ error: "Connect your wallet first" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const bounty = await getBounty(String(body.bountyId || ""));
  if (!bounty) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bounty.creator !== address) {
    return NextResponse.json({ error: "Only the bounty creator can request a review" }, { status: 403 });
  }
  if (!bounty.submission?.githubPrUrl) {
    return NextResponse.json({ error: "This bounty has no submission yet" }, { status: 409 });
  }
  const cached = bounty.aiReview;
  if (cached && cached.prUrl === bounty.submission.githubPrUrl && !body.refresh) {
    return NextResponse.json({ review: cached, advisory: true, cached: true });
  }
  if (rateLimited(`review:${address}`)) {
    return NextResponse.json({ error: "Assistant limit reached, try again later" }, { status: 429 });
  }

  try {
    const pr = await fetchPrForReview(bounty.submission.githubPrUrl, { token: process.env.GITHUB_TOKEN });
    const result = await reviewSubmission({ bounty, pr });
    const review = { ...result, prUrl: bounty.submission.githubPrUrl, createdAt: new Date().toISOString() };
    await updateBounty(bounty.id, { aiReview: review });
    return NextResponse.json({ review, advisory: true });
  } catch (e) {
    const status = e instanceof AiNotConfiguredError ? 503 : 502;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
