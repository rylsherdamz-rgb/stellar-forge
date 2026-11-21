import { NextResponse } from "next/server";
import {
  createChallenge,
  verifyChallenge,
  issueSession,
  sessionAddress,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/session";

// GET /api/auth            -> { address | null }   current session
// GET /api/auth?address=G… -> { xdr }              challenge to sign
export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) return NextResponse.json({ address: sessionAddress(req) });
  try {
    return NextResponse.json({ xdr: createChallenge(address) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// POST /api/auth { address, signedXdr } -> sets the session cookie
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const address = verifyChallenge(String(body.signedXdr || ""), String(body.address || ""));
    const res = NextResponse.json({ address });
    res.cookies.set(SESSION_COOKIE, issueSession(address), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

// DELETE /api/auth -> sign out
export async function DELETE() {
  const res = NextResponse.json({ address: null });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
