"use client";

import { createContext, useContext, ReactNode } from "react";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { useContract } from "@/hooks/use-contract";
import { useStellarData } from "@/hooks/use-stellar-data";

type WalletContext = ReturnType<typeof useStellarWallet> & { data: ReturnType<typeof useStellarData> };

const WalletContext = createContext<WalletContext | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useStellarWallet();
  return (
    <WalletContext.Provider value={{ ...wallet, data: wallet.data }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}

export { useContract, useStellarData };
