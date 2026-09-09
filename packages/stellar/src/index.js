// @stellar-forge/stellar
//
// The wallet layer for Stellar Forge. Signing is done exclusively through
// Stellar Wallets Kit (Freighter, xBull, Albedo, Lobstr, Hana, ...). Forge
// never sees, requests, or stores private keys or seed phrases — every
// financial action is an explicit user signature. The Soroban contract, not
// this client, is the source of truth for whether funds move.

/**
 * Contract method identifiers on the bounty-escrow contract.
 * These mirror contracts/bounty-escrow/src/lib.rs.
 */
export const METHODS = Object.freeze({
  CREATE: "create_bounty",
  CLAIM: "claim_bounty",
  SUBMIT: "submit_bounty",
  APPROVE: "approve_bounty",
  RELEASE: "release_payment",
  CANCEL: "cancel_bounty",
  REFUND: "refund_bounty",
  GET: "get_bounty",
  NEXT_ID: "next_id",
  ADMIN: "admin",
});

/** On-chain status enum, matching the contract's Status. */
export const STATUS = Object.freeze([
  "Open",
  "Claimed",
  "Submitted",
  "Completed",
  "Cancelled",
  "Expired",
  "Disputed",
  "Refunded",
]);

/**
 * Verified asset registry. Deposits are only allowed for assets we can
 * verify by (code, issuer, network). XLM is native; USDC uses the canonical
 * issuer per network. (Per SPEC.md §17.)
 */
export const ASSETS = Object.freeze({
  testnet: {
    XLM: { code: "XLM", issuer: null, native: true },
    USDC: {
      code: "USDC",
      issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      native: false,
    },
  },
  public: {
    XLM: { code: "XLM", issuer: null, native: true },
    USDC: {
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      native: false,
    },
  },
});

/**
 * Assert an asset is in the verified registry for the given network.
 * Throws before any deposit is ever assembled.
 * @param {"testnet"|"public"} network
 * @param {string} code
 * @param {string|null} [issuer]
 */
export function assertVerifiedAsset(network, code, issuer = null) {
  const table = ASSETS[network];
  if (!table) throw new Error(`Unknown network: ${network}`);
  const entry = table[code];
  if (!entry) throw new Error(`Unverified asset: ${code} on ${network}`);
  if (!entry.native && issuer && issuer !== entry.issuer) {
    throw new Error(`Asset ${code} issuer mismatch on ${network}`);
  }
  return entry;
}

/**
 * Thin adapter around Stellar Wallets Kit. Constructed with an already-created
 * kit instance so this module has no hard runtime dependency and stays testable.
 *
 * @example
 *   import { StellarWalletsKit, WalletNetwork, allowAllModules } from "@creit.tech/stellar-wallets-kit";
 *   const kit = new StellarWalletsKit({ network: WalletNetwork.TESTNET, modules: allowAllModules() });
 *   const wallet = new ForgeWallet(kit);
 *   await wallet.connect();
 */
export class ForgeWallet {
  constructor(kit) {
    if (!kit) throw new Error("ForgeWallet requires a Stellar Wallets Kit instance");
    this.kit = kit;
    this.address = null;
  }

  /** Open the wallet selector and capture the public address. */
  async connect() {
    // Stellar Wallets Kit drives wallet selection + address retrieval.
    if (typeof this.kit.openModal === "function") {
      await this.kit.openModal({
        onWalletSelected: async (option) => {
          this.kit.setWallet(option.id);
          const { address } = await this.kit.getAddress();
          this.address = address;
        },
      });
    } else {
      const { address } = await this.kit.getAddress();
      this.address = address;
    }
    return this.address;
  }

  disconnect() {
    this.address = null;
    if (typeof this.kit.disconnect === "function") return this.kit.disconnect();
  }

  /**
   * Sign a base64 transaction XDR with the connected wallet.
   * Forge never handles secret keys; the wallet signs.
   * @param {string} xdr
   * @param {string} networkPassphrase
   */
  async signTransaction(xdr, networkPassphrase) {
    if (!this.address) throw new Error("Wallet not connected");
    const res = await this.kit.signTransaction(xdr, {
      address: this.address,
      networkPassphrase,
    });
    return res.signedTxXdr ?? res;
  }
}
