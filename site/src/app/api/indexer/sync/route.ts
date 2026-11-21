import { NextResponse } from "next/server";
import { syncEvents, syncIfStale, indexStatus } from "@/lib/indexer";

// GET /api/indexer/sync
// - With `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this): full sync.
// - Otherwise: throttled sync (at most every 30s), so it is safe to expose.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  try {
    if (authorized) {
      const result = await syncEvents();
      return NextResponse.json({ ok: true, ...result });
    }
    await syncIfStale(30_000);
    return NextResponse.json({ ok: true, ...(await indexStatus()) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
