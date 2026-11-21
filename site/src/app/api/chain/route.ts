import { NextResponse } from "next/server";
import { rpc } from "@stellar/stellar-sdk";
import { CONFIG } from "@/lib/config";
import { readNextId } from "@/lib/contract";

// GET /api/chain - returns { nextId, latestLedger } for the create flow.
export async function GET() {
  const server = new rpc.Server(CONFIG.rpcUrl, { allowHttp: false });
  try {
    const [{ sequence }, nextId] = await Promise.all([server.getLatestLedger(), readNextId()]);
    return NextResponse.json({ nextId, latestLedger: sequence });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "chain read failed" },
      { status: 502 },
    );
  }
}
