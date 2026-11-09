// Soroban contract client for the bounty-escrow contract.
//
// Builds unsigned transaction XDRs for each lifecycle action. The wallet signs
// them (Stellar Wallets Kit); the app never holds keys. The contract is the
// source of truth - this client only assembles and submits what the user signs.

import {
  rpc,
  Account,
  Contract,
  TransactionBuilder,
  Address,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  xdr,
  type Transaction,
} from "@stellar/stellar-sdk";
import { CONFIG } from "./config";
import { decodeContractError } from "./errors";
import { decodeStatus } from "./lifecycle";

const server = new rpc.Server(CONFIG.rpcUrl, { allowHttp: false });

// Read-only calls are simulated, never submitted, so the source account does
// not need to exist or sign. Any valid G-address works; this one is the
// contract admin from data/deployments/testnet.json.
const READ_SOURCE = "GD4QKRYD5ZCVU4ZT6MLGYYQZGNCMMN54BTIXMYJONML66M3HTHCKECDW";

function contract(): Contract {
  return new Contract(CONFIG.contractId);
}

/** i128 stroops for a human XLM amount (7 decimals). */
export function xlmToStroops(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
    throw new Error(`Invalid XLM amount: ${amount}`);
  }
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "0000000").slice(0, 7);
  return BigInt(whole || "0") * BigInt(10000000) + BigInt(fracPadded || "0");
}

/** Human XLM string for an i128 stroop amount. */
export function stroopsToXlm(stroops: bigint): string {
  const neg = stroops < BigInt(0);
  const abs = neg ? -stroops : stroops;
  const whole = abs / BigInt(10000000);
  const frac = (abs % BigInt(10000000)).toString().padStart(7, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

async function buildInvoke(
  source: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string> {
  const account = await server.getAccount(source).catch(() => {
    throw new Error(
      `Account ${source.slice(0, 6)}… is not funded on ${CONFIG.network}. Fund it with Friendbot first.`,
    );
  });
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(180)
    .build();
  // Simulate + prepare so auth + resource footprint are attached.
  try {
    const prepared = await server.prepareTransaction(tx);
    return prepared.toXDR();
  } catch (e) {
    const decoded = decodeContractError(e);
    if (decoded) throw new Error(`${decoded.name}: ${decoded.message}`);
    throw e;
  }
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

/** Creator-only actions that take just the bounty id. */
export async function buildCreatorAction(
  method: "approve_bounty" | "refund_bounty" | "cancel_bounty",
  params: { creator: string; escrowId: number },
): Promise<string> {
  return buildInvoke(params.creator, method, [
    nativeToScVal(params.escrowId, { type: "u64" }),
  ]);
}

/**
 * Inspect a signed transaction and return the contract + function it invokes.
 * Used by /confirm so a caller cannot submit an unrelated transaction and have
 * it recorded against a bounty.
 */
export function inspectInvocation(signedXdr: string): {
  contractId: string;
  method: string;
  args: unknown[];
} | null {
  try {
    const tx = TransactionBuilder.fromXDR(signedXdr, CONFIG.networkPassphrase) as Transaction;
    if (!("operations" in tx) || tx.operations.length !== 1) return null;
    const op = tx.operations[0];
    if (op.type !== "invokeHostFunction") return null;
    // stellar-sdk >=14 exposes XDR unions as plain objects.
    const fn = op.func as unknown as {
      type: string;
      invokeContract?: { contractAddress: never; functionName: unknown; args: xdr.ScVal[] };
    };
    if (fn.type !== "hostFunctionTypeInvokeContract" || !fn.invokeContract) return null;
    const inv = fn.invokeContract;
    return {
      contractId: Address.fromScAddress(inv.contractAddress).toString(),
      method: String(inv.functionName),
      args: inv.args.map((a) => scValToNative(a)),
    };
  } catch {
    return null;
  }
}

/** Submit a signed transaction XDR and wait for the result. */
export async function submitSigned(
  signedXdr: string,
): Promise<{ hash: string; returnValue: unknown }> {
  const tx = TransactionBuilder.fromXDR(signedXdr, CONFIG.networkPassphrase);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") {
    throw new Error(`Transaction rejected by the network (${sent.errorResult ? JSON.stringify(sent.errorResult).slice(0, 160) : "unknown"})`);
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
  return {
    hash: sent.hash,
    returnValue: got.returnValue ? scValToNative(got.returnValue) : undefined,
  };
}

async function simulateRead(method: string, args: xdr.ScVal[] = []): Promise<unknown> {
  const tx = new TransactionBuilder(new Account(READ_SOURCE, "0"), {
    fee: BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(contract().call(method, ...args))
    .setTimeout(60)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
    return scValToNative(sim.result.retval);
  }
  return undefined;
}

export interface OnchainBounty {
  id: number;
  creator: string;
  developer: string | null;
  amount: string; // XLM
  deadline: number;
  status: string; // contract Status variant name, e.g. "Open"
}

/** Read on-chain bounty state via simulation (no signature needed). */
export async function readBounty(escrowId: number): Promise<OnchainBounty | null> {
  try {
    const raw = (await simulateRead("get_bounty", [
      nativeToScVal(escrowId, { type: "u64" }),
    ])) as Record<string, unknown> | undefined;
    if (!raw) return null;
    const status = decodeStatus(raw.status);
    return {
      id: Number(raw.id),
      creator: String(raw.creator),
      developer: raw.developer ? String(raw.developer) : null,
      amount: stroopsToXlm(BigInt(raw.amount as bigint)),
      deadline: Number(raw.deadline),
      status,
    };
  } catch {
    return null;
  }
}

export async function readNextId(): Promise<number | null> {
  try {
    const v = await simulateRead("next_id");
    return v === undefined ? null : Number(v);
  } catch {
    return null;
  }
}

export async function latestLedger(): Promise<number> {
  const { sequence } = await server.getLatestLedger();
  return sequence;
}
