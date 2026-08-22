"use client";

import { useState, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc, horizon, config } from "@/lib/stellar-config";

type Balance = { asset: string; balance: string };

export function useStellarData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBalances = useCallback(async (address: string): Promise<Balance[]> => {
    setLoading(true);
    setError(null);
    try {
      const account = await horizon.loadAccount(address);
      const balances: Balance[] = account.balances.map((b: any) => ({
        asset: b.asset_type === "native" ? "XLM" : b.asset_code || "native",
        balance: b.balance,
      }));
      return balances;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getContractData = useCallback(async (
    contractId: string,
    key: StellarSdk.xdr.ScVal
  ): Promise<StellarSdk.xdr.ScVal | null> => {
    setLoading(true);
    setError(null);
    try {
      const ledgerKey = StellarSdk.xdr.LedgerKey.contractData(
        new StellarSdk.xdr.LedgerKeyContractData({
          contract: StellarSdk.xdr.ScAddress.contract(
            StellarSdk.Contract.parse(contractId).address().toScAddress()
          ),
          key,
          durability: StellarSdk.xdr.ContractDataDurability.PERSISTENT(),
        })
      );
      const entry = await rpc.getLedgerEntries(ledgerKey);
      if (!entry.entries.length) return null;
      const data = entry.entries[0].val;
      if (data instanceof StellarSdk.xdr.ContractDataEntry) {
        return data.val();
      }
      return null;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const queryContract = useCallback(async (
    contractId: string,
    method: string,
    args: StellarSdk.xdr.ScVal[] = []
  ): Promise<StellarSdk.xdr.ScVal | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const contract = new StellarSdk.Contract(contractId);
      const tx = new StellarSdk.TransactionBuilder(
        { sequence: "1" } as any,
        { fee: "0", networkPassphrase: config.networkPassphrase }
      )
        .addOperation(contract.call(method, ...args))
        .setTimeout(180)
        .build();
      const simulation = await rpc.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        return simulation.result?.retval;
      }
      throw new Error("Simulation did not succeed");
    } catch (e: any) {
      setError(e.message);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEvents = useCallback(async (
    contractId: string,
    startLedger?: number
  ): Promise<StellarSdk.rpc.Api.EventResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      const events = await rpc.getEvents({
        startLedger,
        filters: [{ contractId, type: "contract" }],
        pagination: { limit: 10 },
      });
      return events.events;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransaction = useCallback(async (hash: string) => {
    setLoading(true);
    setError(null);
    try {
      let tx = await rpc.getTransaction(hash);
      while (tx.status === "NOT_FOUND") {
        await new Promise((r) => setTimeout(r, 1000));
        tx = await rpc.getTransaction(hash);
      }
      return tx;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getBalances,
    getContractData,
    queryContract,
    getEvents,
    getTransaction,
    loading,
    error,
  };
}
