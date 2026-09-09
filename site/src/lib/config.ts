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
  contractId:
    process.env.NEXT_PUBLIC_CONTRACT_ID ||
    "CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU",
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
