"use client";

import { useWallet, useContract } from "@/providers/wallet-provider";
import { ConnectButton } from "@/components/connect-button";
import { InvokeContract } from "@/components/invoke-contract";

export function DashboardPage() {
  const { address, data, getBalances } = useWallet();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Stellar Dashboard</h1>
        <ConnectButton />
      </div>

      {address && (
        <>
          <section className="border rounded p-4">
            <h2 className="font-semibold mb-2">Balances</h2>
            <button onClick={() => getBalances().then(console.log)} className="text-sm underline">
              Refresh
            </button>
          </section>

          <section className="border rounded p-4">
            <h2 className="font-semibold mb-2">Contract Interaction</h2>
            <InvokeContract contractId="CA3D...EXAMPLE" />
            <p className="text-xs text-gray-500 mt-1">
              Replace with real contract ID to test read/write
            </p>
          </section>
        </>
      )}
    </div>
  );
}
