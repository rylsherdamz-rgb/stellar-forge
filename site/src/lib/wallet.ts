"use client";

// Browser wallet client. Wraps Stellar Wallets Kit so the app can connect a
// wallet and sign transaction XDRs. No private keys are ever handled here;
// only the public address and the chosen wallet module id are remembered.

import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  XBULL_ID,
} from "@creit.tech/stellar-wallets-kit";
import { CONFIG } from "./config";

const STORAGE_KEY = "forge.wallet";

let kit: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (!kit) {
    kit = new StellarWalletsKit({
      network:
        CONFIG.network === "public"
          ? WalletNetwork.PUBLIC
          : WalletNetwork.TESTNET,
      selectedWalletId: XBULL_ID,
      modules: allowAllModules(),
    });
  }
  return kit;
}

export interface StoredWallet {
  address: string;
  walletId: string;
}

export function loadStoredWallet(): StoredWallet | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as StoredWallet;
    return /^G[A-Z2-7]{55}$/.test(v.address) && v.walletId ? v : null;
  } catch {
    return null;
  }
}

function store(v: StoredWallet | null) {
  try {
    if (v) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: session just won't persist */
  }
}

export async function connectWallet(): Promise<string> {
  const k = getKit();
  return new Promise<string>((resolve, reject) => {
    k.openModal({
      onWalletSelected: async (option) => {
        try {
          k.setWallet(option.id);
          const { address } = await k.getAddress();
          store({ address, walletId: option.id });
          resolve(address);
        } catch (e) {
          reject(e);
        }
      },
      onClosed: () => reject(new Error("Wallet selection cancelled")),
    });
  });
}

export function disconnectWallet() {
  store(null);
}

export async function signXdr(xdr: string): Promise<string> {
  const k = getKit();
  const saved = loadStoredWallet();
  if (saved) k.setWallet(saved.walletId);
  const { signedTxXdr } = await k.signTransaction(xdr, {
    networkPassphrase: CONFIG.networkPassphrase,
    address: saved?.address,
  });
  return signedTxXdr;
}
