// Soroban contract client for the bounty-escrow contract.
//
// Builds unsigned transaction XDRs for each lifecycle action. The wallet signs
// them (Stellar Wallets Kit); the app never holds keys. The contract is the
// source of truth - this client only assembles and submits what the user signs.

import {
  rpc,
  Contract,
  TransactionBuilder,
  Address,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  Networks,
  xdr,
} from "@stellar/stellar-sdk";
import { CONFIG } from "./config";

const server = new rpc.Server(CONFIG.rpcUrl, { allowHttp: false });

function contract(): Contract {
  return new Contract(CONFIG.contractId);
}

/** i128 stroops for a human XLM amount (7 decimals). */
export function xlmToStroops(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = (frac + "0000000").slice(0, 7);
  return BigInt(whole || "0") * BigInt(10000000) + BigInt(fracPadded || "0");
}

async function buildInvoke(
  source: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string> {
  const account = await server.getAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(180)
    .build();
  // Simulate + prepare so auth + resource footprint are attached.
  const prepared = await server.prepareTransaction(tx);
  return prepared.toXDR();
}

/** create_bounty(creator, token, amount, deadline, metadata_hash) -> unsigned XDR */
export async function buildCreateBounty(params: {
  creator: string;
  amountXlm: string;
  deadlineLedger: number;
  metadataHash: Uint8Array; // 32 bytes
}): Promise<string> {
  return buildInvoke(params.creator, "create_bounty", [
    new Address(params.creator).toScVal(),
    new Address(CONFIG.xlmSac).toScVal(),
    nativeToScVal(xlmToStroops(params.amountXlm), { type: "i128" }),
    nativeToScVal(params.deadlineLedger, { type: "u32" }),
    nativeToScVal(Buffer.from(params.metadataHash), { type: "bytes" }),
  ]);
}

export async function buildClaimBounty(params: {
  developer: string;
  escrowId: number;
}): Promise<string> {
  return buildInvoke(params.developer, "claim_bounty", [
    nativeToScVal(params.escrowId, { type: "u64" }),
    new Address(params.developer).toScVal(),
  ]);
}

export async function buildSubmitBounty(params: {
  developer: string;
  escrowId: number;
  submissionHash: Uint8Array;
}): Promise<string> {
  return buildInvoke(params.developer, "submit_bounty", [
    nativeToScVal(params.escrowId, { type: "u64" }),
    new Address(params.developer).toScVal(),
    nativeToScVal(Buffer.from(params.submissionHash), { type: "bytes" }),
  ]);
}

export async function buildApproveBounty(params: {
  creator: string;
  escrowId: number;
}): Promise<string> {
  return buildInvoke(params.creator, "approve_bounty", [
    nativeToScVal(params.escrowId, { type: "u64" }),
  ]);
}

export async function buildRefundBounty(params: {
  creator: string;
  escrowId: number;
}): Promise<string> {
  return buildInvoke(params.creator, "refund_bounty", [
    nativeToScVal(params.escrowId, { type: "u64" }),
  ]);
}

export async function buildCancelBounty(params: {
  creator: string;
  escrowId: number;
}): Promise<string> {
  return buildInvoke(params.creator, "cancel_bounty", [
    nativeToScVal(params.escrowId, { type: "u64" }),
  ]);
}

/** Submit a signed transaction XDR and wait for the result. Returns tx hash. */
export async function submitSigned(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, CONFIG.networkPassphrase);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${JSON.stringify(sent.errorResult)}`);
  }
  let got = await server.getTransaction(sent.hash);
  const deadline = Date.now() + 30_000;
  while (got.status === "NOT_FOUND" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") {
    throw new Error(`Transaction did not succeed: ${got.status}`);
  }
  return sent.hash;
}

/** Read on-chain bounty state via simulation (no signature needed). */
export async function readBounty(escrowId: number): Promise<Record<string, unknown> | null> {
  try {
    const account = await server.getAccount(
      // any funded account works as a read source; reuse the contract's admin-free view
      CONFIG.contractId,
    ).catch(() => null);
    if (!account) return null;
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: CONFIG.networkPassphrase,
    })
      .addOperation(contract().call("get_bounty", nativeToScVal(escrowId, { type: "u64" })))
      .setTimeout(60)
      .build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return scValToNative(sim.result.retval) as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export const NETWORKS = Networks;
