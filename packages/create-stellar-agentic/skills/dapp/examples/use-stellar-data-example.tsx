"use client";

import { useState, useEffect } from "react";
import { useWallet, useContract } from "@/providers/wallet-provider";
import * as StellarSdk from "@stellar/stellar-sdk";

const USDC_TESTNET = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export function BalanceViewer({ address }: { address: string }) {
  const { data } = useWallet();
  const [balances, setBalances] = useState<{ asset: string; balance: string }[]>([]);

  useEffect(() => {
    data.getBalances(address).then(setBalances);
  }, [address, data]);

  return (
    <ul>
      {balances.map((b) => (
        <li key={b.asset}>{b.asset}: {b.balance}</li>
      ))}
    </ul>
  );
}

export function ContractReader({ contractId }: { contractId: string }) {
  const { read, data } = useContract(contractId);
  const [name, setName] = useState<string>("...");

  useEffect(() => {
    read("name").then((res) => {
      if (res) setName(StellarSdk.scvalToString(res));
    });
  }, [contractId, read]);

  return <p>Contract name: {name}</p>;
}

export function EventList({ contractId }: { contractId: string }) {
  const { data } = useWallet();
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    data.getEvents(contractId).then(setEvents).catch((e) => setError(e.message));
  }, [contractId, data]);

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <ul className="space-y-1">
      {events.slice(0, 5).map((e, i) => (
        <li key={i} className="text-xs font-mono">
          {e.type} @ ledger {e.ledger}
        </li>
      ))}
    </ul>
  );
}

export function UsdcBalance({ address }: { address: string }) {
  const { data } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    data.getBalances(address).then((bals) => {
      const usdc = bals.find((b) => b.asset === "USDC");
      setBalance(usdc?.balance ?? "0");
    });
  }, [address, data]);

  return <span>{balance ? `${parseFloat(balance).toFixed(2)} USDC` : "No USDC"}</span>;
}

export function XlmBalanceBadge({ address }: { address: string }) {
  const { data } = useWallet();
  const [xlm, setXlm] = useState<string>("0");

  useEffect(() => {
    data.getBalances(address).then((bals) => {
      const native = bals.find((b) => b.asset === "XLM");
      if (native) setXlm(parseFloat(native.balance).toFixed(2));
    });
  }, [address, data]);

  return (
    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
      {xlm} XLM
    </span>
  );
}
