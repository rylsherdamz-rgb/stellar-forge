import { NextResponse } from "next/server";
import { latestLedger, readNextId } from "@/lib/contract";
import { CONFIG } from "@/lib/config";

// GET /api/chain - network status for the UI: latest ledger and next escrow id.
export async function GET() {
  try {
    const [ledger, nextId] = await Promise.all([latestLedger(), readNextId()]);
    return NextResponse.json({
      network: CONFIG.network,
      contractId: CONFIG.contractId,
      latestLedger: ledger,
      nextId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "chain read failed" },
      { status: 502 },
    );
  }
}
