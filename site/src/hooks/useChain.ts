"use client";

import { useEffect, useState } from "react";

export interface ChainInfo {
  network: string;
  contractId: string;
  latestLedger: number;
  nextId: number | null;
}

/** Latest ledger + escrow counter, refreshed every 30s. null while unknown. */
export function useChain(): { chain: ChainInfo | null; offline: boolean } {
  const [chain, setChain] = useState<ChainInfo | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/chain")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          if (!alive) return;
          setChain(d);
          setOffline(false);
        })
        .catch(() => alive && setOffline(true));
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return { chain, offline };
}
