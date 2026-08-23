"use client";

import { useState } from "react";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";

export function SendPayment() {
  const { address, sign, getBalances } = useStellarWallet();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSend() {
    if (!address || !destination || !amount) return;
    setStatus("Sending...");
    try {
      const tx = await fetch("/api/send-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: address, destination, amount }),
      });
      const data = await tx.json();
      setStatus(`Sent! Hash: ${data.hash}`);
      getBalances().then((bals) => {
        const xlm = bals.find((b) => b.asset === "XLM");
        if (xlm) setStatus((s) => `${s} — Balance: ${parseFloat(xlm.balance).toFixed(2)} XLM`);
      });
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  }

  return (
    <div className="p-4 border rounded space-y-2">
      <input
        className="border px-2 py-1 w-full"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination address"
      />
      <input
        className="border px-2 py-1 w-full"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (XLM)"
      />
      <button
        onClick={handleSend}
        disabled={!address || !destination || !amount}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        Send Payment
      </button>
      {status && <p className="text-xs text-gray-600">{status}</p>}
    </div>
  );
}
