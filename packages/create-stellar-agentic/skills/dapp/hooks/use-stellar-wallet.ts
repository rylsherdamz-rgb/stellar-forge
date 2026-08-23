"use client";

import { useState, useCallback } from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";
import { useStellarData } from "./use-stellar-data";

const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});

export function useStellarWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const data = useStellarData();

  const connect = useCallback(async () => {
    await kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
        const { address: addr } = await kit.getAddress();
        setAddress(addr);
        const { network: net } = await kit.getNetwork();
        setNetwork(net);
      },
    });
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      const { signedTxXdr } = await kit.signTransaction(xdr);
      return signedTxXdr;
    },
    []
  );

  const getBalances = useCallback(async () => {
    if (!address) return [];
    return data.getBalances(address);
  }, [address, data]);

  return { address, network, connect, disconnect, sign, getBalances, data, kit };
}
