import { NextResponse } from "next/server";
import { verifySubmission } from "@stellar-forge/github";

// GET /api/github/pull-request?prUrl=...&repo=owner/repo&login=dev
// Verifies a PR exists, is in the expected repo, and matches the developer.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prUrl = searchParams.get("prUrl");
  const repo = searchParams.get("repo");
  const login = searchParams.get("login") || "";
  if (!prUrl || !repo) {
    return NextResponse.json(
      { error: "prUrl and repo are required" },
      { status: 400 },
    );
  }
  const result = await verifySubmission(
    { prUrl, expectedRepo: repo, expectedGithubLogin: login },
    { token: process.env.GITHUB_TOKEN },
  );
  return NextResponse.json(result);
}
