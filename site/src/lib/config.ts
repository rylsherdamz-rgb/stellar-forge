// Central runtime configuration, sourced from env with testnet defaults.
// Public values are safe for the browser; server-only values are read in API routes.

export const CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
  rpcUrl:
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
    "https://soroban-testnet.stellar.org",
  networkPassphrase:
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ||
    "Test SDF Network ; September 2015",
  // bounty-escrow v0.2 (data/deployments/testnet.json). New bounties go here.
  contractId:
    process.env.NEXT_PUBLIC_CONTRACT_ID ||
    "CAPDV2E543F5SHZJ4X5NOY4QQ6O5UDELLNHRBZG7HZCCEPBEVTYZRJOZ",
  // Native XLM Stellar Asset Contract on testnet - the required settlement token.
  xlmSac:
    process.env.NEXT_PUBLIC_XLM_SAC ||
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  explorerBase: "https://stellar.expert/explorer/testnet",
} as const;

export function explorerTx(hash: string): string {
  return `${CONFIG.explorerBase}/tx/${hash}`;
}
export function explorerContract(id: string): string {
  return `${CONFIG.explorerBase}/contract/${id}`;
}

/** The v0.1 deployment. Records funded before contractId was stored live here. */
export const LEGACY_CONTRACT_ID = "CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU";

/** Which contract holds this bounty's escrow. */
export function escrowContract(b: { contractId?: string; escrowId: number | null }): string {
  if (b.contractId) return b.contractId;
  return b.escrowId != null ? LEGACY_CONTRACT_ID : CONFIG.contractId;
}

export function isLegacy(b: { contractId?: string; escrowId: number | null }): boolean {
  return escrowContract(b) === LEGACY_CONTRACT_ID;
}
