import { NextResponse } from "next/server";
import { rpc, Contract, TransactionBuilder, BASE_FEE, scValToNative } from "@stellar/stellar-sdk";
import { CONFIG } from "@/lib/config";

// GET /api/chain - returns { nextId, latestLedger } for the create flow.
export async function GET() {
  const server = new rpc.Server(CONFIG.rpcUrl, { allowHttp: false });
  try {
    const { sequence } = await server.getLatestLedger();
    let nextId = 0;
    try {
      const account = await server.getAccount(CONFIG.contractId).catch(() => null);
      if (account) {
        const tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: CONFIG.networkPassphrase,
        })
          .addOperation(new Contract(CONFIG.contractId).call("next_id"))
          .setTimeout(60)
          .build();
        const sim = await server.simulateTransaction(tx);
        if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
          nextId = Number(scValToNative(sim.result.retval));
        }
      }
    } catch {
      /* nextId stays 0 if unreadable */
    }
    return NextResponse.json({ nextId, latestLedger: sequence });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "chain read failed" },
      { status: 502 },
    );
  }
}
