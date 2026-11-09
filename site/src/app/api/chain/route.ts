import { NextResponse } from "next/server";
import { latestLedger, readNextId, readPaused } from "@/lib/contract";
import { CONFIG } from "@/lib/config";

// GET /api/chain - network status for the UI: latest ledger and next escrow id.
export async function GET() {
  try {
    const [ledger, nextId, paused] = await Promise.all([latestLedger(), readNextId(), readPaused()]);
    return NextResponse.json({
      network: CONFIG.network,
      contractId: CONFIG.contractId,
      latestLedger: ledger,
      nextId,
      paused,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "chain read failed" },
      { status: 502 },
    );
  }
}
