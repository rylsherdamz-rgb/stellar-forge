import { NextResponse } from "next/server";
import { draftBounty, rateLimited, AiNotConfiguredError } from "@/lib/ai";
import { sessionAddress } from "@/lib/session";

// POST /api/ai/generate-bounty { idea, githubRepository?, budgetXlm? }
// Returns a DRAFT for the creator to edit. Creates nothing and funds nothing.
export async function POST(req: Request) {
  const address = sessionAddress(req);
  if (!address) return NextResponse.json({ error: "Connect your wallet to use the assistant" }, { status: 401 });
  if (rateLimited(`gen:${address}`)) {
    return NextResponse.json({ error: "Assistant limit reached, try again later" }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const idea = String(body.idea || "").trim();
  if (idea.length < 15) return NextResponse.json({ error: "Describe the task in a sentence or two" }, { status: 400 });
  if (idea.length > 4000) return NextResponse.json({ error: "Keep the idea under 4000 characters" }, { status: 400 });

  try {
    const draft = await draftBounty({
      idea,
      githubRepository: body.githubRepository ? String(body.githubRepository).slice(0, 200) : undefined,
      budgetXlm: Number(body.budgetXlm) > 0 ? Number(body.budgetXlm) : undefined,
    });
    return NextResponse.json({ draft, advisory: true });
  } catch (e) {
    const status = e instanceof AiNotConfiguredError ? 503 : 502;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
