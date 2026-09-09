import { test } from "node:test";
import assert from "node:assert/strict";
import {
  METHODS,
  STATUS,
  assertVerifiedAsset,
  ForgeWallet,
} from "../src/index.js";

test("contract method + status enums match the contract", () => {
  assert.equal(METHODS.CREATE, "create_bounty");
  assert.equal(METHODS.APPROVE, "approve_bounty");
  assert.equal(STATUS[0], "Open");
  assert.equal(STATUS[3], "Completed");
  assert.equal(STATUS.length, 8);
});

test("assertVerifiedAsset accepts native XLM and canonical USDC", () => {
  assert.equal(assertVerifiedAsset("testnet", "XLM").native, true);
  const usdc = assertVerifiedAsset("testnet", "USDC");
  assert.equal(usdc.code, "USDC");
  assert.ok(usdc.issuer);
});

test("assertVerifiedAsset rejects unknown assets and issuer mismatch", () => {
  assert.throws(() => assertVerifiedAsset("testnet", "SCAM"));
  assert.throws(() =>
    assertVerifiedAsset("testnet", "USDC", "GBADISSUERADDRESSTHATISWRONG"),
  );
  assert.throws(() => assertVerifiedAsset("nonexistent", "XLM"));
});

test("ForgeWallet requires a kit instance", () => {
  assert.throws(() => new ForgeWallet(null));
});

test("ForgeWallet.connect captures the address from the kit", async () => {
  const kit = {
    async getAddress() {
      return { address: "GTEST...ADDR" };
    },
  };
  const wallet = new ForgeWallet(kit);
  const addr = await wallet.connect();
  assert.equal(addr, "GTEST...ADDR");
  assert.equal(wallet.address, "GTEST...ADDR");
});

test("ForgeWallet.signTransaction fails when not connected", async () => {
  const kit = { async signTransaction() { return { signedTxXdr: "X" }; } };
  const wallet = new ForgeWallet(kit);
  await assert.rejects(() => wallet.signTransaction("xdr", "passphrase"));
});

test("ForgeWallet.signTransaction delegates to the wallet after connect", async () => {
  let received;
  const kit = {
    async getAddress() { return { address: "GABC" }; },
    async signTransaction(xdr, opts) {
      received = { xdr, opts };
      return { signedTxXdr: "SIGNED" };
    },
  };
  const wallet = new ForgeWallet(kit);
  await wallet.connect();
  const signed = await wallet.signTransaction("RAWXDR", "Test SDF Network ; September 2015");
  assert.equal(signed, "SIGNED");
  assert.equal(received.xdr, "RAWXDR");
  assert.equal(received.opts.address, "GABC");
});
