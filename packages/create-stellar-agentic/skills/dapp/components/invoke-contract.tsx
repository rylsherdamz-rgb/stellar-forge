"use client";

import { useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useContract } from "@/hooks/use-contract";
import { useStellarWallet } from "@/hooks/use-stellar-wallet";

type Props = { contractId: string };

export function InvokeContract({ contractId }: Props) {
  const { address, sign } = useStellarWallet();
  const contract = useContract(contractId);
  const [method, setMethod] = useState("hello");
  const [result, setResult] = useState<string | null>(null);

  async function handleRead() {
    const res = await contract.read(method);
    if (res) setResult(StellarSdk.scvalToString(res));
  }

  async function handleWrite() {
    if (!address) return;
    const res = await contract.write(address, method, [], sign);
    setResult(`Tx: ${res.hash}`);
  }

  return (
    <div className="p-4 border rounded space-y-2">
      <input
        className="border px-2 py-1 w-full font-mono text-sm"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        placeholder="method name"
      />
      <div className="flex gap-2">
        <button onClick={handleRead} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
          Read
        </button>
        <button
          onClick={handleWrite}
          disabled={!address}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Write
        </button>
      </div>
      {result && (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{result}</pre>
      )}
      {contract.data.error && (
        <p className="text-red-500 text-xs">{contract.data.error}</p>
      )}
    </div>
  );
}
