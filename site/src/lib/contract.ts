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
import { decodeStatus, METHOD_FOR } from "./lifecycle";

const server = new rpc.Server(CONFIG.rpcUrl, { allowHttp: false });

// Read-only calls are simulated, never submitted, so the source account does
// not need to exist or sign. Any valid G-address works; this one is the
// contract admin from data/deployments/testnet.json.
const READ_SOURCE = "GD4QKRYD5ZCVU4ZT6MLGYYQZGNCMMN54BTIXMYJONML66M3HTHCKECDW";

function contract(id: string): Contract {
  return new Contract(id);
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
  contractId: string,
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
    .addOperation(contract(contractId).call(method, ...args))
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

export type ActionArgs =
  | { action: "create"; amountXlm: string; deadlineLedger: number; metadataHash: Uint8Array }
  | { action: "claim" | "unclaim" | "dispute" }
  | { action: "submit"; submissionHash: Uint8Array }
  | { action: "approve" | "refund" | "cancel" }
  | { action: "extend"; newDeadline: number };

/** Contract arguments for each action, in the order the contract expects. */
function encodeArgs(a: ActionArgs, source: string, escrowId: number | null): xdr.ScVal[] {
  const id = () => nativeToScVal(escrowId!, { type: "u64" });
  const who = () => new Address(source).toScVal();
  switch (a.action) {
    case "create":
      return [
        who(),
        new Address(CONFIG.xlmSac).toScVal(),
        nativeToScVal(xlmToStroops(a.amountXlm), { type: "i128" }),
        nativeToScVal(a.deadlineLedger, { type: "u32" }),
        nativeToScVal(Buffer.from(a.metadataHash), { type: "bytes" }),
      ];
    case "claim":
    case "unclaim":
    case "dispute":
      return [id(), who()];
    case "submit":
      return [id(), who(), nativeToScVal(Buffer.from(a.submissionHash), { type: "bytes" })];
    case "approve":
    case "refund":
    case "cancel":
      return [id()];
    case "extend":
      return [id(), nativeToScVal(a.newDeadline, { type: "u32" })];
  }
}

/** Unsigned, simulated XDR for `args.action` on the bounty's contract. */
export async function buildAction(params: {
  contractId: string;
  source: string;
  escrowId: number | null;
  args: ActionArgs;
}): Promise<string> {
  return buildInvoke(
    params.contractId,
    params.source,
    METHOD_FOR[params.args.action],
    encodeArgs(params.args, params.source, params.escrowId),
  );
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

async function simulateRead(contractId: string, method: string, args: xdr.ScVal[] = []): Promise<unknown> {
  const tx = new TransactionBuilder(new Account(READ_SOURCE, "0"), {
    fee: BASE_FEE,
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(contract(contractId).call(method, ...args))
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
export async function readBounty(
  escrowId: number,
  contractId: string = CONFIG.contractId,
): Promise<OnchainBounty | null> {
  try {
    const raw = (await simulateRead(contractId, "get_bounty", [
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
    const v = await simulateRead(CONFIG.contractId, "next_id");
    return v === undefined ? null : Number(v);
  } catch {
    return null;
  }
}

export async function latestLedger(): Promise<number> {
  const { sequence } = await server.getLatestLedger();
  return sequence;
}

/** v0.2 pause switch; null when unreadable or on a contract without it. */
export async function readPaused(): Promise<boolean | null> {
  try {
    const v = await simulateRead(CONFIG.contractId, "is_paused");
    return typeof v === "boolean" ? v : null;
  } catch {
    return null;
  }
}
