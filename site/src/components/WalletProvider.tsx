"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { connectWallet, disconnectWallet, signXdr } from "@/lib/wallet";

interface WalletCtx {
  /** Address of the signed-in wallet (server session verified), or null. */
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connecting: boolean;
  /** True until the existing session (if any) has been restored. */
  restoring: boolean;
  error: string | null;
}

const Ctx = createContext<WalletCtx>({
  address: null,
  connect: async () => {},
  disconnect: async () => {},
  connecting: false,
  restoring: true,
  error: null,
});

// Connecting = pick a wallet, then prove ownership by signing a one-time
// challenge (never submitted on-chain). The server answers with an httpOnly
// session cookie, so the session survives reloads without storing any secret
// in the browser.
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setAddress(d.address ?? null))
      .catch(() => setAddress(null))
      .finally(() => setRestoring(false));
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      const ch = await fetch(`/api/auth?address=${encodeURIComponent(addr)}`).then((r) => r.json());
      if (!ch.xdr) throw new Error(ch.error || "Could not start sign-in");
      const signedXdr = await signXdr(ch.xdr);
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, signedXdr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-in failed");
      setAddress(data.address);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      if (!/cancel/i.test(msg)) setError(msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    await disconnectWallet();
    setAddress(null);
  }, []);

  return (
    <Ctx.Provider value={{ address, connect, disconnect, connecting, restoring, error }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
