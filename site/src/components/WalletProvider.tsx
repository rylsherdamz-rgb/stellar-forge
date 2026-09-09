"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { connectWallet } from "@/lib/wallet";

interface WalletCtx {
  address: string | null;
  connect: () => Promise<void>;
  connecting: boolean;
}

const Ctx = createContext<WalletCtx>({
  address: null,
  connect: async () => {},
  connecting: false,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } finally {
      setConnecting(false);
    }
  }, []);

  return (
    <Ctx.Provider value={{ address, connect, connecting }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
