// Wallet sign-in (SEP-10 style, stateless).
//
// 1. Server issues a challenge transaction: source = the user's address,
//    sequence 0, one manageData op carrying an HMAC-bound expiry, 5 min bounds.
// 2. The wallet signs it with signTransaction (supported by every wallet in
//    Stellar Wallets Kit). It is NEVER submitted to the network: sequence 0
//    makes it invalid on-chain, so signing it cannot move funds.
// 3. Server checks the HMAC, time bounds and the ed25519 signature against the
//    address, then sets an httpOnly session cookie.
//
// No secret key material is ever handled. SESSION_SECRET only signs cookies.

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import {
  Account,
  Keypair,
  Operation,
  StrKey,
  TransactionBuilder,
  FeeBumpTransaction,
} from "@stellar/stellar-sdk";
import { CONFIG } from "./config";

export const SESSION_COOKIE = "sf_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const CHALLENGE_TTL_SECONDS = 300;
const DATA_NAME = "stellar-forge auth";

let devSecret: string | null = null;
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (>= 32 chars) must be set in production");
  }
  // Dev only: per-process secret, so sessions reset on restart.
  devSecret ??= randomBytes(32).toString("hex");
  return devSecret;
}

function mac(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

const now = () => Math.floor(Date.now() / 1000);

/** Build an unsigned challenge transaction for `address`. */
export function createChallenge(address: string): string {
  if (!StrKey.isValidEd25519PublicKey(address)) throw new Error("Invalid Stellar address");
  const exp = now() + CHALLENGE_TTL_SECONDS;
  // value = "<exp>.<mac>"  (10 + 1 + 43 = 54 bytes, under the 64-byte limit)
  const value = `${exp}.${mac(`challenge|${address}|${exp}|${CONFIG.networkPassphrase}`)}`;
  const tx = new TransactionBuilder(new Account(address, "-1"), {
    fee: "100",
    networkPassphrase: CONFIG.networkPassphrase,
    timebounds: { minTime: now() - 5, maxTime: exp },
  })
    .addOperation(Operation.manageData({ name: DATA_NAME, value }))
    .build();
  return tx.toXDR();
}

/** Verify a signed challenge. Returns the authenticated address. */
export function verifyChallenge(signedXdr: string, address: string): string {
  if (!StrKey.isValidEd25519PublicKey(address)) throw new Error("Invalid Stellar address");
  const tx = TransactionBuilder.fromXDR(signedXdr, CONFIG.networkPassphrase);
  if (tx instanceof FeeBumpTransaction) throw new Error("Invalid challenge");
  if (tx.source !== address || tx.sequence !== "0") throw new Error("Invalid challenge");
  if (tx.operations.length !== 1) throw new Error("Invalid challenge");
  const op = tx.operations[0];
  if (op.type !== "manageData" || op.name !== DATA_NAME || !op.value) {
    throw new Error("Invalid challenge");
  }
  const [expStr, tag] = op.value.toString().split(".");
  const exp = Number(expStr);
  if (!exp || !tag || exp < now()) throw new Error("Challenge expired");
  if (!safeEqual(tag, mac(`challenge|${address}|${exp}|${CONFIG.networkPassphrase}`))) {
    throw new Error("Challenge was not issued by this server");
  }
  const maxTime = Number(tx.timeBounds?.maxTime ?? 0);
  if (!maxTime || maxTime < now()) throw new Error("Challenge expired");

  const kp = Keypair.fromPublicKey(address);
  const hash = tx.hash();
  const signed = tx.signatures.some(
    (s) => s.hint().equals(kp.signatureHint()) && kp.verify(hash, s.signature()),
  );
  if (!signed) throw new Error("Challenge is not signed by this address");
  return address;
}

/** Cookie value: base64url(JSON{a,exp}).mac */
export function issueSession(address: string): string {
  const payload = Buffer.from(
    JSON.stringify({ a: address, exp: now() + SESSION_TTL_SECONDS }),
  ).toString("base64url");
  return `${payload}.${mac(`session|${payload}`)}`;
}

export function readSession(cookie: string | undefined | null): string | null {
  if (!cookie) return null;
  const [payload, tag] = cookie.split(".");
  if (!payload || !tag) return null;
  try {
    if (!safeEqual(tag, mac(`session|${payload}`))) return null;
    const { a, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof a !== "string" || typeof exp !== "number" || exp < now()) return null;
    return StrKey.isValidEd25519PublicKey(a) ? a : null;
  } catch {
    return null;
  }
}

/** Address of the signed-in wallet for an API request, or null. */
export function sessionAddress(req: Request): string | null {
  const header = req.headers.get("cookie") || "";
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return readSession(match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null);
}
