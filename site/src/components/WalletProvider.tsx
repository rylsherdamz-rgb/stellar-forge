"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface WalletCtx {
  address: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  connecting: boolean;
  error: string | null;
}

const Ctx = createContext<WalletCtx>({
  address: null,
  connect: async () => null,
  disconnect: () => {},
  connecting: false,
  error: null,
});

// The wallet kit touches `window` at import time, so it is loaded lazily on
// the client only.
const walletLib = () => import("@/lib/wallet");

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    walletLib().then((w) => {
      const saved = w.loadStoredWallet();
      if (saved) setAddress(saved.address);
    });
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await (await walletLib()).connectWallet();
      setAddress(addr);
      return addr;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not connect wallet";
      if (!/cancel/i.test(msg)) setError(msg);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    walletLib().then((w) => w.disconnectWallet());
    setAddress(null);
  }, []);

  return (
    <Ctx.Provider value={{ address, connect, disconnect, connecting, error }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
