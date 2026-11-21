import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { createChallenge, verifyChallenge, issueSession, readSession } from "../src/lib/session";
import { CONFIG } from "../src/lib/config";

const sign = (xdr: string, kp: Keypair) => {
  const tx = TransactionBuilder.fromXDR(xdr, CONFIG.networkPassphrase);
  tx.sign(kp);
  return tx.toXDR();
};

test("valid signed challenge authenticates the address", () => {
  const kp = Keypair.random();
  const signed = sign(createChallenge(kp.publicKey()), kp);
  assert.equal(verifyChallenge(signed, kp.publicKey()), kp.publicKey());
});

test("challenge signed by a different key is rejected", () => {
  const owner = Keypair.random();
  const attacker = Keypair.random();
  const signed = sign(createChallenge(owner.publicKey()), attacker);
  assert.throws(() => verifyChallenge(signed, owner.publicKey()), /not signed/);
});

test("challenge issued for another address is rejected", () => {
  const a = Keypair.random();
  const b = Keypair.random();
  const signed = sign(createChallenge(a.publicKey()), b);
  assert.throws(() => verifyChallenge(signed, b.publicKey()), /Invalid challenge/);
});

test("challenge has sequence 0 so it can never be submitted on-chain", () => {
  const kp = Keypair.random();
  const tx = TransactionBuilder.fromXDR(createChallenge(kp.publicKey()), CONFIG.networkPassphrase);
  assert.ok("sequence" in tx);
  assert.equal(tx.sequence, "0");
});

test("session cookie round-trips and rejects tampering", () => {
  const kp = Keypair.random();
  const cookie = issueSession(kp.publicKey());
  assert.equal(readSession(cookie), kp.publicKey());
  const [payload, tag] = cookie.split(".");
  const forged = Buffer.from(JSON.stringify({ a: Keypair.random().publicKey(), exp: 9e9 })).toString("base64url");
  assert.equal(readSession(`${forged}.${tag}`), null);
  assert.equal(readSession(`${payload}.x${tag.slice(1)}`), null);
  assert.equal(readSession(undefined), null);
});
