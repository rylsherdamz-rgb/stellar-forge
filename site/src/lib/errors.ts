// Decode bounty-escrow contract errors into readable messages.
//
// Soroban surfaces a contract error as `Error(Contract, #<code>)` inside the
// simulation / submission error text. Codes are the contract's public ABI
// (contracts/bounty-escrow/src/lib.rs `BountyError`) — append only.

export const CONTRACT_ERRORS: Record<number, { name: string; message: string }> = {
  1: { name: "NotInitialized", message: "The escrow contract has not been initialized." },
  2: { name: "AlreadyInitialized", message: "The escrow contract is already initialized." },
  3: { name: "NotAdmin", message: "Only the contract admin can do this." },
  4: { name: "NotCreator", message: "Only the bounty creator can do this." },
  5: { name: "NotDeveloper", message: "Only the developer who claimed this bounty can do this." },
  6: { name: "NotFound", message: "This bounty does not exist on-chain." },
  7: { name: "ZeroAmount", message: "The reward must be greater than zero." },
  8: { name: "InvalidDeadline", message: "The deadline must be in the future." },
  9: { name: "BadStatus", message: "The bounty is not in a state that allows this action." },
  10: { name: "AlreadyClaimed", message: "Someone has already claimed this bounty." },
  11: { name: "NotClaimed", message: "The bounty has not been claimed yet." },
  12: { name: "NotSubmitted", message: "No work has been submitted for this bounty yet." },
  13: { name: "PastDeadline", message: "The bounty deadline has passed." },
  14: { name: "BeforeDeadline", message: "Refunds unlock only after the deadline passes." },
  15: { name: "Underfunded", message: "The escrow holds less than the reward." },
  16: { name: "Internal", message: "The contract hit an internal error." },
  17: { name: "Paused", message: "The escrow contract is paused by the admin." },
  18: { name: "TokenNotAllowed", message: "This token is not allowed by the escrow contract." },
  19: { name: "SelfClaim", message: "Creators cannot claim their own bounty." },
  20: { name: "NotParty", message: "Only the creator or developer can do this." },
  21: { name: "NotDisputed", message: "The bounty is not in dispute." },
};

export function decodeContractError(
  err: unknown,
): { code: number; name: string; message: string } | null {
  const text =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : (() => {
            try {
              return JSON.stringify(err);
            } catch {
              return String(err);
            }
          })();
  const m = text.match(/Error\(Contract,\s*#(\d+)\)/);
  if (!m) return null;
  const code = Number(m[1]);
  const known = CONTRACT_ERRORS[code];
  return {
    code,
    name: known?.name ?? "Unknown",
    message: known?.message ?? `Contract error #${code}.`,
  };
}
