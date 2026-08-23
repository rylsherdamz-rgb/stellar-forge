"use client";

import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc, config } from "@/lib/stellar-config";
import { useStellarData } from "./use-stellar-data";

export function useContract(contractId: string) {
  const data = useStellarData();
  const contract = new StellarSdk.Contract(contractId);

  async function read(method: string, ...args: StellarSdk.xdr.ScVal[]) {
    return data.queryContract(contractId, method, args);
  }

  async function write(
    sourceAddress: string,
    method: string,
    args: StellarSdk.xdr.ScVal[],
    signFn: (xdr: string) => Promise<string>
  ) {
    const account = await rpc.getAccount(sourceAddress);
    let tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(180)
      .build();

    const simulation = await rpc.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${simulation.error}`);
    }

    tx = StellarSdk.rpc.assembleTransaction(tx, simulation).build();
    const signedXdr = await signFn(tx.toXDR());
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      config.networkPassphrase
    ) as StellarSdk.Transaction;

    const response = await rpc.sendTransaction(signedTx);
    if (response.status === "ERROR") {
      throw new Error(`Tx failed: ${response.errorResult}`);
    }

    const getResponse = await data.getTransaction(response.hash);
    if (!getResponse || getResponse.status !== "SUCCESS") {
      throw new Error(`Tx not confirmed: ${response.hash}`);
    }

    return { hash: response.hash, result: getResponse.returnValue };
  }

  return { read, write, contract, data };
}
