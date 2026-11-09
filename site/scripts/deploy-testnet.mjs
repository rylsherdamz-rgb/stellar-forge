#!/usr/bin/env node
// Deploy bounty-escrow to Stellar testnet with the JS SDK (no stellar CLI needed).
//
//   cargo build --release --target wasm32v1-none --manifest-path contracts/Cargo.toml -p bounty-escrow
//   DEPLOYER_SECRET=S... node site/scripts/deploy-testnet.mjs
//
// Steps: upload WASM -> create contract -> initialize(admin) ->
// set_token_allowed(native XLM SAC). If DEPLOYER_SECRET is unset, a fresh
// key is generated, funded by Friendbot, and printed ONCE so you can keep it:
// it is the contract admin (pause, token allowlist, dispute resolution).
// Testnet only. Never use a mainnet key here.

import {
  Keypair, rpc, TransactionBuilder, Operation, Networks, BASE_FEE,
  Contract, Address, nativeToScVal, scValToNative, Asset, hash,
} from "@stellar/stellar-sdk";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RPC = process.env.RPC_URL || "https://soroban-testnet.stellar.org";
const PASSPHRASE = Networks.TESTNET;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const WASM = process.env.WASM || path.join(root, "contracts/target/wasm32v1-none/release/bounty_escrow.wasm");

const server = new rpc.Server(RPC);
const xlmSac = Asset.native().contractId(PASSPHRASE);

let admin;
if (process.env.DEPLOYER_SECRET) {
  admin = Keypair.fromSecret(process.env.DEPLOYER_SECRET);
} else {
  admin = Keypair.random();
  const r = await fetch(`https://friendbot.stellar.org/?addr=${admin.publicKey()}`);
  if (!r.ok) throw new Error(`friendbot failed: ${r.status}`);
  console.log(`generated admin ${admin.publicKey()}`);
  console.log(`ADMIN SECRET (save this; it is not stored anywhere): ${admin.secret()}`);
}

async function send(op, label) {
  const account = await server.getAccount(admin.publicKey());
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(op).setTimeout(120).build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(admin);
  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new Error(`${label}: rejected ${JSON.stringify(sent.errorResult)}`);
  let got = await server.getTransaction(sent.hash);
  for (let i = 0; got.status === "NOT_FOUND" && i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") throw new Error(`${label}: ${got.status}`);
  console.log(`${label.padEnd(18)} ${sent.hash}`);
  return { hash: sent.hash, value: got.returnValue ? scValToNative(got.returnValue) : undefined };
}

const wasm = await readFile(WASM);
const wasmHash = Buffer.from(hash(wasm));
console.log(`wasm ${wasm.length} bytes, sha256 ${wasmHash.toString("hex")}`);

const upload = await send(Operation.uploadContractWasm({ wasm }), "upload wasm");
const create = await send(
  Operation.createCustomContract({ address: new Address(admin.publicKey()), wasmHash, salt: randomBytes(32) }),
  "create contract",
);
// The create op returns the new contract's address (decoded to "C...").
const id = String(create.value);
if (!/^C[A-Z2-7]{55}$/.test(id)) throw new Error(`unexpected contract id: ${id}`);
const c = new Contract(id);
const init = await send(c.call("initialize", new Address(admin.publicKey()).toScVal()), "initialize");
const allow = await send(
  c.call("set_token_allowed", new Address(xlmSac).toScVal(), nativeToScVal(true)),
  "allow native XLM",
);

console.log(JSON.stringify({
  name: "bounty-escrow",
  version: "0.2.0",
  contract_id: id,
  wasm_hash: wasmHash.toString("hex"),
  wasm_size_bytes: wasm.length,
  admin: admin.publicKey(),
  allowed_tokens: [xlmSac],
  txs: { upload: upload.hash, create: create.hash, initialize: init.hash, allow_xlm: allow.hash },
  deployed_at: new Date().toISOString(),
}, null, 2));
