"use client";

import type { Action } from "./lifecycle";

export type Phase = "building" | "signing" | "submitting";

// Runs the full build -> wallet sign -> confirm cycle for a bounty action.
// Returns the tx hash on success. The contract remains the source of truth;
// this only orchestrates the request/sign/submit steps.
export async function runAction(
  bountyId: string,
  action: Action,
  address: string,
  extra: Record<string, unknown> = {},
  onPhase?: (p: Phase) => void,
): Promise<{ txHash: string }> {
  onPhase?.("building");
  const buildRes = await fetch(`/api/bounties/${bountyId}/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, address, ...extra }),
  });
  const buildData = await buildRes.json();
  if (!buildRes.ok) throw new Error(buildData.error || "Failed to build transaction");

  onPhase?.("signing");
  const { signXdr } = await import("./wallet");
  const signed = await signXdr(buildData.xdr);

  onPhase?.("submitting");
  const confirmRes = await fetch(`/api/bounties/${bountyId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, address, signedXdr: signed, ...extra }),
  });
  const confirmData = await confirmRes.json();
  if (!confirmRes.ok) throw new Error(confirmData.error || "Failed to confirm transaction");
  return { txHash: confirmData.txHash };
}

export const PHASE_LABEL: Record<Phase, string> = {
  building: "Simulating transaction…",
  signing: "Waiting for wallet signature…",
  submitting: "Submitting to Stellar…",
};
