import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BountyEscrowClient,
  BOUNTY_ESCROW_CONTRACT_ID,
  TESTNET_PASSPHRASE,
  PUBLIC_PASSPHRASE,
  TESTNET_RPC_URL,
  PUBLIC_RPC_URL,
  METHODS,
  STATUS,
  ASSETS,
  assertVerifiedAsset,
  formatBytes32,
  parseBounty,
  ForgeWallet,
  loadStellarSdk,
} from "../src/index.js";

const TEST_CREATOR =
  "GBKYOHJTY5L6BS5I5765ET3TAUX6RIYVKXADIIPVTXOA4TDHKO5CFDHR";
const TEST_DEV =
  "GCKKFF5C4KEI3ICOSWE6O5QODNXEJKPJIXVNV7WH6G5R4JV7XSGRHELA";
const TEST_TOKEN =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const VALID_HASH_HEX =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function getFunctionName(invoke) {
  if (!invoke || !invoke.functionName) return "";
  const bytes = invoke.functionName.bytes ?? invoke.functionName;
  return Buffer.from(bytes).toString("utf8");
}

test("BountyEscrowClient initializes with default testnet configurations", () => {
  const client = new BountyEscrowClient();
  assert.equal(client.contractId, BOUNTY_ESCROW_CONTRACT_ID);
  assert.equal(client.network, "testnet");
  assert.equal(client.networkPassphrase, TESTNET_PASSPHRASE);
  assert.equal(client.rpcUrl, TESTNET_RPC_URL);
  assert.equal(client.wallet, null);
});

test("BountyEscrowClient accepts custom options overrides", () => {
  const customId = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM";
  const client = new BountyEscrowClient({
    contractId: customId,
    network: "public",
  });
  assert.equal(client.contractId, customId);
  assert.equal(client.network, "public");
  assert.equal(client.networkPassphrase, PUBLIC_PASSPHRASE);
  assert.equal(client.rpcUrl, PUBLIC_RPC_URL);
});

test("formatBytes32 validates 32-byte hashes", () => {
  const bytesFromHex = formatBytes32(VALID_HASH_HEX);
  assert.equal(bytesFromHex.length, 32);
  assert.equal(bytesFromHex[0], 0x01);
  assert.equal(bytesFromHex[31], 0xef);

  const bytesFromPrefixedHex = formatBytes32(`0x${VALID_HASH_HEX}`);
  assert.equal(bytesFromPrefixedHex.length, 32);
  assert.equal(bytesFromPrefixedHex[0], 0x01);

  const rawBytes = new Uint8Array(32);
  rawBytes[0] = 42;
  const fromRaw = formatBytes32(rawBytes);
  assert.equal(fromRaw.length, 32);
  assert.equal(fromRaw[0], 42);

  assert.throws(() => formatBytes32(""), /Hash cannot be empty/);
  assert.throws(() => formatBytes32("abc"), /Invalid hash length/);
  assert.throws(() => formatBytes32(new Uint8Array(16)), /Invalid byte length/);
  assert.throws(() => formatBytes32(123), /Invalid hash input type/);
});

test("parseBounty handles Map and plain Object responses", () => {
  const plainRaw = {
    id: 10n,
    creator: TEST_CREATOR,
    developer: TEST_DEV,
    token: TEST_TOKEN,
    amount: 500000000n,
    deadline: 123456,
    status: 1,
    metadata_hash: Buffer.from(VALID_HASH_HEX, "hex"),
    submission_hash: Buffer.from(VALID_HASH_HEX, "hex"),
  };

  const parsed = parseBounty(plainRaw);
  assert.equal(parsed.id, 10n);
  assert.equal(parsed.creator, TEST_CREATOR);
  assert.equal(parsed.developer, TEST_DEV);
  assert.equal(parsed.token, TEST_TOKEN);
  assert.equal(parsed.amount, 500000000n);
  assert.equal(parsed.deadline, 123456);
  assert.equal(parsed.status, "Claimed");
  assert.equal(parsed.statusCode, 1);
  assert.equal(parsed.metadataHash, VALID_HASH_HEX);
  assert.equal(parsed.submissionHash, VALID_HASH_HEX);

  const mapRaw = new Map();
  mapRaw.set("id", 1n);
  mapRaw.set("creator", TEST_CREATOR);
  mapRaw.set("developer", null);
  mapRaw.set("token", TEST_TOKEN);
  mapRaw.set("amount", 100n);
  mapRaw.set("deadline", 500);
  mapRaw.set("status", 0);
  mapRaw.set("metadata_hash", VALID_HASH_HEX);
  mapRaw.set("submission_hash", null);

  const parsedMap = parseBounty(mapRaw);
  assert.equal(parsedMap.id, 1n);
  assert.equal(parsedMap.developer, null);
  assert.equal(parsedMap.status, "Open");
  assert.equal(parsedMap.statusCode, 0);
  assert.equal(parsedMap.submissionHash, null);
});

test("assertVerifiedAsset enforced before deposit assembly", async () => {
  const client = new BountyEscrowClient();

  await assert.rejects(
    () =>
      client.buildCreateBountyTx({
        creator: TEST_CREATOR,
        token: TEST_TOKEN,
        amount: 1000n,
        deadline: 999999,
        metadataHash: VALID_HASH_HEX,
        assetCode: "SCAM",
      }),
    /Unverified asset: SCAM on testnet/
  );

  await assert.rejects(
    () =>
      client.buildCreateBountyTx({
        creator: TEST_CREATOR,
        token: TEST_TOKEN,
        amount: 1000n,
        deadline: 999999,
        metadataHash: VALID_HASH_HEX,
        asset: {
          code: "USDC",
          issuer: "GBADISSUER000000000000000000000000000000000000000000000000",
        },
      }),
    /Asset USDC issuer mismatch on testnet/
  );

  await assert.rejects(
    () =>
      client.buildCreateBountyTx({
        creator: TEST_CREATOR,
        token: "CUNKNOWN_CONTRACT",
        amount: 1000n,
        deadline: 999999,
        metadataHash: VALID_HASH_HEX,
      }),
    /Deposit asset must be verified before assembling transaction/
  );

  await assert.rejects(
    () =>
      client.buildCreateBountyTx({
        creator: TEST_CREATOR,
        token: TEST_TOKEN,
        amount: 0n,
        deadline: 999999,
        metadataHash: VALID_HASH_HEX,
        assetCode: "XLM",
      }),
    /Bounty amount must be greater than zero/
  );
});

test("buildCreateBountyTx assembles valid create_bounty transaction", async () => {
  const client = new BountyEscrowClient();
  const sdk = await loadStellarSdk();

  const built = await client.buildCreateBountyTx({
    creator: TEST_CREATOR,
    token: TEST_TOKEN,
    amount: 10000000n,
    deadline: 888888,
    metadataHash: VALID_HASH_HEX,
    asset: {
      code: "USDC",
      issuer: ASSETS.testnet.USDC.issuer,
    },
    sequence: "5",
  });

  assert.equal(built.method, METHODS.CREATE);
  assert.equal(built.contractId, BOUNTY_ESCROW_CONTRACT_ID);
  assert.equal(built.args[0], TEST_CREATOR);
  assert.equal(built.args[1], TEST_TOKEN);
  assert.equal(built.args[2], 10000000n);
  assert.equal(built.args[3], 888888);
  assert.equal(Buffer.from(built.args[4]).toString("hex"), VALID_HASH_HEX);

  if (sdk && built.xdr) {
    const tx = sdk.TransactionBuilder.fromXDR(built.xdr, TESTNET_PASSPHRASE);
    assert.equal(tx.operations.length, 1);
    const op = tx.operations[0];
    assert.equal(op.type, "invokeHostFunction");
    const invoke = op.func.invokeContract;
    assert.equal(getFunctionName(invoke), "create_bounty");
    assert.equal(invoke.args.length, 5);
    assert.equal(sdk.scValToNative(invoke.args[0]), TEST_CREATOR);
    assert.equal(sdk.scValToNative(invoke.args[1]), TEST_TOKEN);
    assert.equal(sdk.scValToNative(invoke.args[2]), 10000000n);
    assert.equal(sdk.scValToNative(invoke.args[3]), 888888);
    assert.equal(
      Buffer.from(sdk.scValToNative(invoke.args[4])).toString("hex"),
      VALID_HASH_HEX
    );
  }
});

test("buildClaimBountyTx assembles valid claim_bounty transaction", async () => {
  const client = new BountyEscrowClient();
  const sdk = await loadStellarSdk();

  const built = await client.buildClaimBountyTx({
    bountyId: 42n,
    developer: TEST_DEV,
    sourceAddress: TEST_DEV,
    sequence: "1",
  });

  assert.equal(built.method, METHODS.CLAIM);
  assert.equal(built.args[0], 42n);
  assert.equal(built.args[1], TEST_DEV);

  if (sdk && built.xdr) {
    const tx = sdk.TransactionBuilder.fromXDR(built.xdr, TESTNET_PASSPHRASE);
    const op = tx.operations[0];
    const invoke = op.func.invokeContract;
    assert.equal(getFunctionName(invoke), "claim_bounty");
    assert.equal(invoke.args.length, 2);
    assert.equal(sdk.scValToNative(invoke.args[0]), 42n);
    assert.equal(sdk.scValToNative(invoke.args[1]), TEST_DEV);
  }
});

test("buildSubmitBountyTx assembles valid submit_bounty transaction", async () => {
  const client = new BountyEscrowClient();
  const sdk = await loadStellarSdk();

  const built = await client.buildSubmitBountyTx({
    bountyId: 7n,
    developer: TEST_DEV,
    submissionHash: VALID_HASH_HEX,
    sourceAddress: TEST_DEV,
    sequence: "2",
  });

  assert.equal(built.method, METHODS.SUBMIT);
  assert.equal(built.args[0], 7n);
  assert.equal(built.args[1], TEST_DEV);
  assert.equal(Buffer.from(built.args[2]).toString("hex"), VALID_HASH_HEX);

  if (sdk && built.xdr) {
    const tx = sdk.TransactionBuilder.fromXDR(built.xdr, TESTNET_PASSPHRASE);
    const op = tx.operations[0];
    const invoke = op.func.invokeContract;
    assert.equal(getFunctionName(invoke), "submit_bounty");
    assert.equal(invoke.args.length, 3);
    assert.equal(sdk.scValToNative(invoke.args[0]), 7n);
    assert.equal(sdk.scValToNative(invoke.args[1]), TEST_DEV);
    assert.equal(
      Buffer.from(sdk.scValToNative(invoke.args[2])).toString("hex"),
      VALID_HASH_HEX
    );
  }
});

test("buildApproveBountyTx assembles valid approve_bounty transaction", async () => {
  const client = new BountyEscrowClient();
  const sdk = await loadStellarSdk();

  const built = await client.buildApproveBountyTx({
    bountyId: 99n,
    sourceAddress: TEST_CREATOR,
    sequence: "3",
  });

  assert.equal(built.method, METHODS.APPROVE);
  assert.equal(built.args[0], 99n);

  if (sdk && built.xdr) {
    const tx = sdk.TransactionBuilder.fromXDR(built.xdr, TESTNET_PASSPHRASE);
    const op = tx.operations[0];
    const invoke = op.func.invokeContract;
    assert.equal(getFunctionName(invoke), "approve_bounty");
    assert.equal(invoke.args.length, 1);
    assert.equal(sdk.scValToNative(invoke.args[0]), 99n);
  }
});

test("buildReleasePaymentTx assembles valid release_payment transaction", async () => {
  const client = new BountyEscrowClient();
  const sdk = await loadStellarSdk();

  const built = await client.buildReleasePaymentTx({
    bountyId: 101n,
    sourceAddress: TEST_CREATOR,
    sequence: "4",
  });

  assert.equal(built.method, METHODS.RELEASE);
  assert.equal(built.args[0], 101n);

  if (sdk && built.xdr) {
    const tx = sdk.TransactionBuilder.fromXDR(built.xdr, TESTNET_PASSPHRASE);
    const op = tx.operations[0];
    const invoke = op.func.invokeContract;
    assert.equal(getFunctionName(invoke), "release_payment");
    assert.equal(invoke.args.length, 1);
    assert.equal(sdk.scValToNative(invoke.args[0]), 101n);
  }
});

test("buildCancelBountyTx assembles valid cancel_bounty transaction", async () => {
  const client = new BountyEscrowClient();
  const sdk = await loadStellarSdk();

  const built = await client.buildCancelBountyTx({
    bountyId: 55n,
    sourceAddress: TEST_CREATOR,
    sequence: "5",
  });

  assert.equal(built.method, METHODS.CANCEL);
  assert.equal(built.args[0], 55n);

  if (sdk && built.xdr) {
    const tx = sdk.TransactionBuilder.fromXDR(built.xdr, TESTNET_PASSPHRASE);
    const op = tx.operations[0];
    const invoke = op.func.invokeContract;
    assert.equal(getFunctionName(invoke), "cancel_bounty");
    assert.equal(invoke.args.length, 1);
    assert.equal(sdk.scValToNative(invoke.args[0]), 55n);
  }
});

test("buildRefundBountyTx assembles valid refund_bounty transaction", async () => {
  const client = new BountyEscrowClient();
  const sdk = await loadStellarSdk();

  const built = await client.buildRefundBountyTx({
    bountyId: 88n,
    sourceAddress: TEST_CREATOR,
    sequence: "6",
  });

  assert.equal(built.method, METHODS.REFUND);
  assert.equal(built.args[0], 88n);

  if (sdk && built.xdr) {
    const tx = sdk.TransactionBuilder.fromXDR(built.xdr, TESTNET_PASSPHRASE);
    const op = tx.operations[0];
    const invoke = op.func.invokeContract;
    assert.equal(getFunctionName(invoke), "refund_bounty");
    assert.equal(invoke.args.length, 1);
    assert.equal(sdk.scValToNative(invoke.args[0]), 88n);
  }
});

test("client-side signing delegates to ForgeWallet", async () => {
  let signCallCount = 0;
  const mockKit = {
    async getAddress() {
      return { address: TEST_CREATOR };
    },
    async signTransaction(xdr, opts) {
      signCallCount += 1;
      assert.equal(opts.address, TEST_CREATOR);
      assert.equal(opts.networkPassphrase, TESTNET_PASSPHRASE);
      return { signedTxXdr: `SIGNED_${xdr.slice(0, 10)}` };
    },
  };

  const wallet = new ForgeWallet(mockKit);
  await wallet.connect();

  const client = new BountyEscrowClient({ wallet });

  const built = await client.buildCancelBountyTx({
    bountyId: 1n,
    sourceAddress: TEST_CREATOR,
    sequence: "1",
  });

  const txToSign = built.xdr ? built : "SAMPLE_XDR_PAYLOAD";
  const signed = await client.signTransaction(txToSign);
  assert.equal(signed.startsWith("SIGNED_"), true);
  assert.equal(signCallCount, 1);

  const result = await client.claimBounty({
    bountyId: 2n,
    developer: TEST_DEV,
    sourceAddress: TEST_DEV,
    sequence: "2",
  });
  if (result.signedXdr) {
    assert.equal(result.signedXdr.startsWith("SIGNED_"), true);
    assert.equal(signCallCount, 2);
  }

  const clientWithoutWallet = new BountyEscrowClient();
  await assert.rejects(
    () => clientWithoutWallet.signTransaction("SAMPLE_XDR"),
    /Wallet not connected to BountyEscrowClient/
  );
});

test("read views query RPC simulation and decode responses", async () => {
  const simulatedResponses = {
    get_bounty: {
      id: 5n,
      creator: TEST_CREATOR,
      developer: TEST_DEV,
      token: TEST_TOKEN,
      amount: 1000000n,
      deadline: 777777,
      status: 3,
      metadata_hash: VALID_HASH_HEX,
      submission_hash: VALID_HASH_HEX,
    },
    next_id: 6n,
    admin: TEST_CREATOR,
  };

  const mockRpc = {
    async simulate(contractId, method, args) {
      assert.equal(contractId, BOUNTY_ESCROW_CONTRACT_ID);
      return simulatedResponses[method];
    },
  };

  const client = new BountyEscrowClient({ rpc: mockRpc });

  const bounty = await client.getBounty(5n);
  assert.equal(bounty.id, 5n);
  assert.equal(bounty.creator, TEST_CREATOR);
  assert.equal(bounty.developer, TEST_DEV);
  assert.equal(bounty.status, "Completed");
  assert.equal(bounty.statusCode, 3);
  assert.equal(bounty.metadataHash, VALID_HASH_HEX);

  const next = await client.nextId();
  assert.equal(next, 6n);

  const admin = await client.admin();
  assert.equal(admin, TEST_CREATOR);
});
