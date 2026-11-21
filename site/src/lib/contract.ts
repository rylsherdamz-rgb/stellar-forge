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
  FeeBumpTransaction,
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

/**
 * Read-only calls are simulated from a null source account, the same trick the
 * SDK's generated contract clients use. Simulation never needs a real funded
 * account, and a contract id (C...) cannot be loaded as one.
 */
const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

async function simulateRead(method: string, args: xdr.ScVal[] = []): Promise<unknown> {
  const tx = new TransactionBuilder(new Account(NULL_ACCOUNT, "0"), {
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
  return null;
}

/** Contract `Status` discriminants (contracts/bounty-escrow, append-only). */
export const ONCHAIN_STATUS = [
  "OPEN",
  "CLAIMED",
  "SUBMITTED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "DISPUTED",
  "REFUNDED",
] as const;
export type OnchainStatus = (typeof ONCHAIN_STATUS)[number];

export interface OnchainBounty {
  id: number;
  creator: string;
  developer: string | null;
  token: string;
  amount: bigint;
  deadline: number;
  status: OnchainStatus;
  metadataHash: string | null; // hex
  submissionHash: string | null; // hex
}

/** Read on-chain bounty state via simulation (no signature needed). */
export async function readBounty(escrowId: number): Promise<OnchainBounty | null> {
  try {
    const raw = (await simulateRead("get_bounty", [
      nativeToScVal(escrowId, { type: "u64" }),
    ])) as Record<string, unknown> | null;
    if (!raw) return null;
    const statusIdx = Number(raw.status);
    return {
      id: Number(raw.id),
      creator: String(raw.creator),
      developer: raw.developer ? String(raw.developer) : null,
      token: String(raw.token),
      amount: BigInt(raw.amount as bigint | number),
      deadline: Number(raw.deadline),
      status: ONCHAIN_STATUS[statusIdx] ?? "OPEN",
      metadataHash: raw.metadata_hash ? Buffer.from(raw.metadata_hash as Uint8Array).toString("hex") : null,
      submissionHash: raw.submission_hash
        ? Buffer.from(raw.submission_hash as Uint8Array).toString("hex")
        : null,
    };
  } catch {
    return null;
  }
}

/** Next bounty id the contract will assign (informational only). */
export async function readNextId(): Promise<number | null> {
  try {
    const v = await simulateRead("next_id");
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
}

/**
 * Decode a signed XDR and return what it invokes, so the server can refuse to
 * relay anything other than a single call to the Forge contract.
 */
export function inspectInvoke(
  signedXdr: string,
): { source: string; contractId: string; method: string } | null {
  try {
    const tx = TransactionBuilder.fromXDR(signedXdr, CONFIG.networkPassphrase);
    if (tx instanceof FeeBumpTransaction || tx.operations.length !== 1) return null;
    const op = tx.operations[0];
    if (op.type !== "invokeHostFunction") return null;
    const fn = op.func;
    if (fn.switch() !== xdr.HostFunctionType.hostFunctionTypeInvokeContract()) return null;
    const ic = fn.invokeContract();
    return {
      source: tx.source,
      contractId: Address.fromScAddress(ic.contractAddress()).toString(),
      method: ic.functionName().toString(),
    };
  } catch {
    return null;
  }
}

/**
 * Submit a signed transaction XDR and wait for the result.
 * Returns the tx hash and the decoded contract return value (if any).
 */
export async function submitSigned(
  signedXdr: string,
): Promise<{ hash: string; returnValue: unknown }> {
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
  const returnValue = got.returnValue ? scValToNative(got.returnValue) : null;
  return { hash: sent.hash, returnValue };
}

export const NETWORKS = Networks;

/** BountyError codes (contracts/bounty-escrow, append-only ABI). */
const CONTRACT_ERRORS: Record<number, string> = {
  1: "Contract not initialized",
  2: "Contract already initialized",
  3: "Admin only",
  4: "Only the bounty creator can do this",
  5: "Only the assigned developer can do this",
  6: "Bounty not found on-chain",
  7: "Reward must be greater than zero",
  8: "Deadline must be in the future",
  9: "Bounty is not in the right state for this action",
  10: "Bounty is already claimed",
  11: "Bounty has not been claimed",
  12: "Bounty has no submission to review",
  13: "The bounty deadline has passed",
  14: "Refunds are only possible after the deadline",
  15: "Insufficient balance for the reward",
  16: "Internal contract error",
  17: "New bounties and claims are paused",
  18: "This asset is not allowed by the contract",
  19: "Creators cannot claim their own bounty",
  20: "Only the creator or developer can do this",
  21: "Bounty is not in dispute",
};

/** Turn a raw simulation/host error into a readable message where possible. */
export function explainContractError(message: string): string {
  const m = message.match(/Error\(Contract, #(\d+)\)/);
  if (m && CONTRACT_ERRORS[Number(m[1])]) {
    return `${CONTRACT_ERRORS[Number(m[1])]} (contract error #${m[1]})`;
  }
  return message;
}
