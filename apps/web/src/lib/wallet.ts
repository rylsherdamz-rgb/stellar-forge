"use client";

// Browser wallet client. Wraps Stellar Wallets Kit so the app can connect a
// wallet and sign transaction XDRs. No private keys are ever handled here.

import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  XBULL_ID,
} from "@creit.tech/stellar-wallets-kit";
import { CONFIG } from "./config";

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

export async function connectWallet(): Promise<string> {
  const k = getKit();
  return new Promise<string>((resolve, reject) => {
    k.openModal({
      onWalletSelected: async (option) => {
        try {
          k.setWallet(option.id);
          const { address } = await k.getAddress();
          resolve(address);
        } catch (e) {
          reject(e);
        }
      },
      onClosed: () => reject(new Error("Wallet selection cancelled")),
    });
  });
}

export async function signXdr(xdr: string): Promise<string> {
  const k = getKit();
  const { signedTxXdr } = await k.signTransaction(xdr, {
    networkPassphrase: CONFIG.networkPassphrase,
  });
  return signedTxXdr;
}
