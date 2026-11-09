// Sample listings shown on a fresh checkout (no data/bounties.json yet).
//
// These are clearly flagged `demo: true`, have no escrowId and no transaction
// hashes: nothing here claims to be funded or settled on-chain. The UI labels
// them as samples and disables lifecycle actions. Disable with FORGE_DEMO_SEED=0.

import type { Bounty } from "./store";

const CREATOR = "GDVMGW24MB7C6PYIFCFGSOOW26TI2NQGMIQGO7ZZ4EZE7NPKLC5E44RL";
const DEV_A = "GAJAT5TLPHYVXTF23CBUISRUEWERUNGOVC5E57S7XOV5K65ELPL7H7RG";
const DEV_B = "GDPJZA5EHF5XFFXO6HM7EPUVSO3KHSCD3IJHWPP5GG6F4XD6UNERAWHV";
const CREATOR_B = "GDIRUYSXPTUSUZ45JFBDQPKQ7WK2PWFQN7L53MBFFMJXVZNYNIC32SRI";

const base = {
  escrowId: null,
  asset: "XLM" as const,
  deadlineLedger: null,
  claimedBy: null,
  submission: null,
  tx: {},
  demo: true,
};

export const DEMO_BOUNTIES: Bounty[] = [
  {
    ...base,
    id: "demo-wallet-reconnect",
    title: "Persist wallet session across page reloads",
    description:
      "The wallet connection is lost on every hard refresh. Restore the last selected wallet module and address from storage so users do not have to reconnect.",
    requirements:
      "- Remember the selected wallet id and address\n- Re-hydrate on load without opening the modal\n- Clear on explicit disconnect",
    acceptanceCriteria:
      "- Reload keeps the user connected\n- Disconnect clears storage\n- No private data stored",
    githubRepository: "rylsherdamz-rgb/stellar-forge",
    tech: ["React", "TypeScript", "Stellar Wallets Kit"],
    rewardAmount: "40",
    status: "OPEN",
    creator: CREATOR,
    createdAt: "2026-11-08T09:12:00.000Z",
    updatedAt: "2026-11-08T09:12:00.000Z",
  },
  {
    ...base,
    id: "demo-usdc-support",
    title: "Add USDC as a reward asset",
    description:
      "Let creators fund bounties in Stellar USDC as well as XLM. The asset must be verified against the known issuer for the selected network before any deposit.",
    requirements:
      "- Asset selector on the create form\n- Verify the USDC SAC address per network\n- Display amounts with the right decimals",
    acceptanceCriteria:
      "- USDC bounty can be created and approved on testnet\n- Unknown assets are rejected before signing",
    githubRepository: "rylsherdamz-rgb/stellar-forge",
    tech: ["Soroban", "Next.js", "USDC"],
    rewardAmount: "120",
    status: "OPEN",
    creator: CREATOR_B,
    createdAt: "2026-11-07T15:40:00.000Z",
    updatedAt: "2026-11-07T15:40:00.000Z",
  },
  {
    ...base,
    id: "demo-indexer",
    title: "Index bounty events from Soroban RPC",
    description:
      "Build a small indexer that reads `bounty` contract events and keeps the metadata store in sync, so state changes made outside the web app still show up.",
    requirements:
      "- Poll getEvents for the escrow contract\n- Map each event to a status update\n- Resume from the last processed ledger",
    acceptanceCriteria:
      "- Claim made from the CLI appears in the UI within one minute\n- Restarting the indexer does not duplicate updates",
    githubRepository: "rylsherdamz-rgb/stellar-forge",
    tech: ["Node.js", "Soroban RPC"],
    rewardAmount: "75",
    status: "CLAIMED",
    claimedBy: DEV_A,
    creator: CREATOR,
    createdAt: "2026-11-05T11:02:00.000Z",
    updatedAt: "2026-11-06T08:30:00.000Z",
  },
  {
    ...base,
    id: "demo-a11y-audit",
    title: "Keyboard and screen-reader pass on the create form",
    description:
      "Audit the create-bounty flow for keyboard traps, missing labels and contrast issues, and fix what you find.",
    requirements:
      "- Every input has a programmatic label\n- Focus order follows the visual order\n- Errors are announced",
    acceptanceCriteria: "- axe reports zero serious issues on /create",
    githubRepository: "rylsherdamz-rgb/stellar-forge",
    tech: ["Accessibility", "React"],
    rewardAmount: "25",
    status: "SUBMITTED",
    claimedBy: DEV_B,
    creator: CREATOR_B,
    createdAt: "2026-11-02T13:20:00.000Z",
    updatedAt: "2026-11-04T17:45:00.000Z",
  },
  {
    ...base,
    id: "demo-error-copy",
    title: "Human-readable contract error messages",
    description:
      "Map `Error(Contract, #n)` codes from the escrow contract to plain-language messages in the UI.",
    requirements: "- Cover every BountyError code\n- Fall back gracefully for unknown codes",
    acceptanceCriteria: "- Claiming your own bounty shows a clear message instead of a raw XDR error",
    githubRepository: "rylsherdamz-rgb/stellar-forge",
    tech: ["TypeScript"],
    rewardAmount: "15",
    status: "COMPLETED",
    claimedBy: DEV_A,
    creator: CREATOR,
    createdAt: "2026-10-28T10:00:00.000Z",
    updatedAt: "2026-10-30T16:10:00.000Z",
  },
];
