"use client";

import { useStellarWallet } from "@/hooks/use-stellar-wallet";
import { useState, useEffect } from "react";

export function ConnectButton() {
  const { address, connect, disconnect, getBalances } = useStellarWallet();
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      getBalances().then((bals) => {
        const xlm = bals.find((b) => b.asset === "XLM");
        if (xlm) setXlmBalance(parseFloat(xlm.balance).toFixed(2));
      });
    } else {
      setXlmBalance(null);
    }
  }, [address, getBalances]);

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">
          {address.slice(0, 4)}...{address.slice(-4)}
        </span>
        {xlmBalance && (
          <span className="text-xs text-gray-500">{xlmBalance} XLM</span>
        )}
        <button
          onClick={disconnect}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Connect Wallet
    </button>
  );
}
