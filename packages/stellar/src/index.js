/**
 * Contract method identifiers on the bounty-escrow contract.
 * These mirror contracts/bounty-escrow/src/lib.rs.
 */
export const METHODS = Object.freeze({
  CREATE: "create_bounty",
  CLAIM: "claim_bounty",
  SUBMIT: "submit_bounty",
  APPROVE: "approve_bounty",
  RELEASE: "release_payment",
  CANCEL: "cancel_bounty",
  REFUND: "refund_bounty",
  GET: "get_bounty",
  NEXT_ID: "next_id",
  ADMIN: "admin",
  INITIALIZE: "initialize",
});

/**
 * On-chain status enum, matching the contract's Status.
 */
export const STATUS = Object.freeze([
  "Open",
  "Claimed",
  "Submitted",
  "Completed",
  "Cancelled",
  "Expired",
  "Disputed",
  "Refunded",
]);

/**
 * Verified asset registry. Deposits are only allowed for assets verified
 * by (code, issuer, network). XLM is native; USDC uses the canonical
 * issuer per network. (Per SPEC.md §17.)
 */
export const ASSETS = Object.freeze({
  testnet: {
    XLM: { code: "XLM", issuer: null, native: true },
    USDC: {
      code: "USDC",
      issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      native: false,
    },
  },
  public: {
    XLM: { code: "XLM", issuer: null, native: true },
    USDC: {
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      native: false,
    },
  },
});

/**
 * Deployed bounty-escrow contract ID on testnet.
 */
export const BOUNTY_ESCROW_CONTRACT_ID =
  "CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU";

/**
 * Testnet network passphrase.
 */
export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

/**
 * Public network passphrase.
 */
export const PUBLIC_PASSPHRASE = "Public Global Stellar Network ; September 2015";

/**
 * Testnet Soroban RPC endpoint URL.
 */
export const TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";

/**
 * Public Soroban RPC endpoint URL.
 */
export const PUBLIC_RPC_URL = "https://soroban-rpc.mainnet.stellar.org";

/**
 * Assert an asset is in the verified registry for the given network.
 * Throws before any deposit is assembled.
 * @param {"testnet"|"public"} network
 * @param {string} code
 * @param {string|null} [issuer]
 * @returns {{ code: string, issuer: string | null, native: boolean }}
 */
export function assertVerifiedAsset(network, code, issuer = null) {
  const table = ASSETS[network];
  if (!table) throw new Error(`Unknown network: ${network}`);
  const entry = table[code];
  if (!entry) throw new Error(`Unverified asset: ${code} on ${network}`);
  if (!entry.native && issuer && issuer !== entry.issuer) {
    throw new Error(`Asset ${code} issuer mismatch on ${network}`);
  }
  return entry;
}

/**
 * Dynamically load @stellar/stellar-sdk when present in the runtime.
 * @returns {Promise<any | null>}
 */
export async function loadStellarSdk() {
  try {
    return await import("@stellar/stellar-sdk");
  } catch {
    return null;
  }
}

/**
 * Convert input string or byte buffer to a 32-byte Uint8Array.
 * @param {string|Uint8Array|Buffer} input
 * @returns {Uint8Array}
 */
export function formatBytes32(input) {
  if (!input) {
    throw new Error("Hash cannot be empty; 32 bytes required");
  }
  if (typeof input === "string") {
    const clean = input.startsWith("0x") ? input.slice(2) : input;
    if (clean.length !== 64) {
      throw new Error(`Invalid hash length: expected 64 hex characters, got ${clean.length}`);
    }
    return new Uint8Array(Buffer.from(clean, "hex"));
  }
  if (input instanceof Uint8Array || Buffer.isBuffer(input)) {
    if (input.length !== 32) {
      throw new Error(`Invalid byte length: expected 32 bytes, got ${input.length}`);
    }
    return new Uint8Array(input);
  }
  throw new Error("Invalid hash input type: must be hex string or 32-byte Uint8Array");
}

/**
 * Convert bytes or hex string to lowercase hex representation.
 * @param {string|Uint8Array|Buffer} val
 * @returns {string}
 */
function formatHex(val) {
  if (typeof val === "string") {
    return val.startsWith("0x") ? val.slice(2).toLowerCase() : val.toLowerCase();
  }
  return Buffer.from(val).toString("hex").toLowerCase();
}

/**
 * Parse raw contract bounty struct into a typed JS object.
 * @param {Object|Map} raw
 * @returns {Object|null}
 */
export function parseBounty(raw) {
  if (!raw) return null;
  const get = (key) => (raw instanceof Map ? raw.get(key) : raw[key]);
  const idRaw = get("id");
  const creatorRaw = get("creator");
  const devRaw = get("developer");
  const tokenRaw = get("token");
  const amountRaw = get("amount");
  const deadlineRaw = get("deadline");
  const statusRaw = get("status");
  const metaRaw = get("metadata_hash") ?? get("metadataHash");
  const subRaw = get("submission_hash") ?? get("submissionHash");

  const statusCode =
    typeof statusRaw === "number" || typeof statusRaw === "bigint"
      ? Number(statusRaw)
      : STATUS.indexOf(statusRaw);

  const statusName =
    statusCode >= 0 && statusCode < STATUS.length
      ? STATUS[statusCode]
      : String(statusRaw);

  return {
    id: idRaw !== undefined ? BigInt(idRaw) : 0n,
    creator: creatorRaw ? String(creatorRaw) : "",
    developer: devRaw ? String(devRaw) : null,
    token: tokenRaw ? String(tokenRaw) : "",
    amount: amountRaw !== undefined ? BigInt(amountRaw) : 0n,
    deadline: deadlineRaw !== undefined ? Number(deadlineRaw) : 0,
    status: statusName,
    statusCode,
    metadataHash: metaRaw ? formatHex(metaRaw) : null,
    submissionHash: subRaw ? formatHex(subRaw) : null,
  };
}

/**
 * Encode Javascript values to ScVal instances using the provided StellarSdk.
 * @param {any} sdk
 * @param {any} val
 * @param {string} [type]
 * @returns {any}
 */
function encodeScVal(sdk, val, type) {
  if (!sdk) {
    throw new Error("StellarSdk required for ScVal encoding");
  }
  if (val && typeof val === "object" && typeof val.switch === "function") {
    return val;
  }
  if (val && typeof val === "object" && val.type && val.type.startsWith("scv")) {
    return val;
  }
  switch (type) {
    case "address":
      return new sdk.Address(val.toString()).toScVal();
    case "u64":
      return sdk.nativeToScVal(BigInt(val), { type: "u64" });
    case "i128":
      return sdk.nativeToScVal(BigInt(val), { type: "i128" });
    case "u32":
      return sdk.nativeToScVal(Number(val), { type: "u32" });
    case "bytes32":
    case "bytes":
      return sdk.nativeToScVal(formatBytes32(val), { type: "bytes" });
    default:
      if (typeof val === "bigint") {
        return sdk.nativeToScVal(val, { type: "i128" });
      }
      return sdk.nativeToScVal(val);
  }
}

/**
 * Adapter around Stellar Wallets Kit.
 */
export class ForgeWallet {
  /**
   * @param {any} kit
   */
  constructor(kit) {
    if (!kit) throw new Error("ForgeWallet requires a Stellar Wallets Kit instance");
    this.kit = kit;
    this.address = null;
  }

  /**
   * Open the wallet selector and capture the public address.
   * @returns {Promise<string>}
   */
  async connect() {
    if (typeof this.kit.openModal === "function") {
      await this.kit.openModal({
        onWalletSelected: async (option) => {
          this.kit.setWallet(option.id);
          const { address } = await this.kit.getAddress();
          this.address = address;
        },
      });
    } else {
      const { address } = await this.kit.getAddress();
      this.address = address;
    }
    return this.address;
  }

  /**
   * Disconnect the wallet session.
   * @returns {any}
   */
  disconnect() {
    this.address = null;
    if (typeof this.kit.disconnect === "function") return this.kit.disconnect();
  }

  /**
   * Sign a base64 transaction XDR with the connected wallet.
   * @param {string} xdr
   * @param {string} networkPassphrase
   * @returns {Promise<string>}
   */
  async signTransaction(xdr, networkPassphrase) {
    if (!this.address) throw new Error("Wallet not connected");
    const res = await this.kit.signTransaction(xdr, {
      address: this.address,
      networkPassphrase,
    });
    return res.signedTxXdr ?? res;
  }
}

/**
 * Client for the deployed Soroban bounty-escrow contract.
 */
export class BountyEscrowClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.contractId]
   * @param {"testnet"|"public"} [options.network]
   * @param {string} [options.networkPassphrase]
   * @param {string} [options.rpcUrl]
   * @param {ForgeWallet | any} [options.wallet]
   * @param {any} [options.sdk]
   * @param {any} [options.rpc]
   */
  constructor(options = {}) {
    this.network = options.network ?? "testnet";
    this.contractId = options.contractId ?? BOUNTY_ESCROW_CONTRACT_ID;
    this.networkPassphrase =
      options.networkPassphrase ??
      (this.network === "public" ? PUBLIC_PASSPHRASE : TESTNET_PASSPHRASE);
    this.rpcUrl =
      options.rpcUrl ??
      (this.network === "public" ? PUBLIC_RPC_URL : TESTNET_RPC_URL);
    this.wallet = options.wallet ?? null;
    this.sdk = options.sdk ?? null;
    this.rpc = options.rpc ?? null;
  }

  /**
   * Resolve Stellar SDK instance.
   * @returns {Promise<any>}
   */
  async getSdk() {
    if (!this.sdk) {
      this.sdk = await loadStellarSdk();
    }
    return this.sdk;
  }

  /**
   * Assemble transaction for contract invocation.
   * @param {Object} options
   * @param {string} options.method
   * @param {Array<any>} options.args
   * @param {Array<string>} [options.argTypes]
   * @param {string} [options.sourceAddress]
   * @param {string|number|bigint} [options.sequence]
   * @param {string|number} [options.fee]
   * @param {number} [options.timeout]
   * @param {string} [options.networkPassphrase]
   * @returns {Promise<Object>}
   */
  async buildTransaction(options) {
    const method = options.method;
    const args = options.args ?? [];
    const argTypes = options.argTypes ?? [];
    const sourceAddress = options.sourceAddress ?? this.wallet?.address ?? null;
    const sequence = (options.sequence ?? "0").toString();
    const fee = (options.fee ?? "100").toString();
    const timeout = options.timeout ?? 180;
    const networkPassphrase =
      options.networkPassphrase ?? this.networkPassphrase;

    const sdk = await this.getSdk();
    if (sdk) {
      const scValArgs = args.map((arg, idx) => {
        const type = argTypes[idx];
        return encodeScVal(sdk, arg, type);
      });
      const contract = new sdk.Contract(this.contractId);
      const operation = contract.call(method, ...scValArgs);

      let transaction = null;
      let xdr = null;
      if (sourceAddress) {
        const account = new sdk.Account(sourceAddress, sequence);
        transaction = new sdk.TransactionBuilder(account, {
          fee,
          networkPassphrase,
        })
          .addOperation(operation)
          .setTimeout(timeout)
          .build();
        xdr = transaction.toXDR();
      }

      return {
        contractId: this.contractId,
        method,
        args,
        scValArgs,
        operation,
        transaction,
        xdr,
        networkPassphrase,
      };
    }

    return {
      contractId: this.contractId,
      method,
      args,
      sourceAddress,
      sequence,
      fee,
      timeout,
      networkPassphrase,
      xdr: null,
    };
  }

  /**
   * Sign transaction XDR using the connected wallet.
   * @param {string|Object} txOrXdr
   * @returns {Promise<string>}
   */
  async signTransaction(txOrXdr) {
    if (!this.wallet) {
      throw new Error("Wallet not connected to BountyEscrowClient");
    }
    const xdr =
      typeof txOrXdr === "string" ? txOrXdr : txOrXdr?.toXDR?.() ?? txOrXdr?.xdr;
    if (!xdr) {
      throw new Error("Invalid transaction or XDR provided for signing");
    }
    return await this.wallet.signTransaction(xdr, this.networkPassphrase);
  }

  /**
   * Assemble transaction for create_bounty.
   * Verifies the asset before deposit assembly.
   * @param {Object} params
   * @param {string} params.creator
   * @param {string} params.token
   * @param {number|string|bigint} params.amount
   * @param {number} params.deadline
   * @param {string|Uint8Array} params.metadataHash
   * @param {Object} [params.asset]
   * @param {string} [params.asset.code]
   * @param {string|null} [params.asset.issuer]
   * @param {"testnet"|"public"} [params.asset.network]
   * @param {string} [params.assetCode]
   * @param {string|null} [params.assetIssuer]
   * @param {string} [params.sourceAddress]
   * @param {string|number} [params.fee]
   * @param {number} [params.timeout]
   * @param {string|number|bigint} [params.sequence]
   * @returns {Promise<Object>}
   */
  async buildCreateBountyTx(params) {
    if (params.asset) {
      assertVerifiedAsset(
        params.asset.network ?? this.network,
        params.asset.code,
        params.asset.issuer ?? null
      );
    } else if (params.assetCode) {
      assertVerifiedAsset(
        this.network,
        params.assetCode,
        params.assetIssuer ?? null
      );
    } else if (ASSETS[this.network]?.[params.token]) {
      assertVerifiedAsset(this.network, params.token, null);
    } else {
      throw new Error(
        "Deposit asset must be verified before assembling transaction. Provide params.asset or params.assetCode."
      );
    }

    if (BigInt(params.amount) <= 0n) {
      throw new Error("Bounty amount must be greater than zero");
    }

    const metadataBytes = formatBytes32(params.metadataHash);
    return await this.buildTransaction({
      method: METHODS.CREATE,
      args: [
        params.creator,
        params.token,
        BigInt(params.amount),
        Number(params.deadline),
        metadataBytes,
      ],
      argTypes: ["address", "address", "i128", "u32", "bytes32"],
      sourceAddress: params.sourceAddress ?? params.creator,
      sequence: params.sequence,
      fee: params.fee,
      timeout: params.timeout,
    });
  }

  /**
   * Build and optionally sign create_bounty transaction.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async createBounty(params) {
    const built = await this.buildCreateBountyTx(params);
    let signedXdr = null;
    if (
      params.sign !== false &&
      (params.sign || this.wallet) &&
      (built.xdr || built.transaction)
    ) {
      signedXdr = await this.signTransaction(built);
    }
    return { ...built, signedXdr };
  }

  /**
   * Assemble transaction for claim_bounty.
   * @param {Object} params
   * @param {number|string|bigint} params.bountyId
   * @param {string} params.developer
   * @param {string} [params.sourceAddress]
   * @param {string|number} [params.fee]
   * @param {number} [params.timeout]
   * @param {string|number|bigint} [params.sequence]
   * @returns {Promise<Object>}
   */
  async buildClaimBountyTx(params) {
    return await this.buildTransaction({
      method: METHODS.CLAIM,
      args: [BigInt(params.bountyId), params.developer],
      argTypes: ["u64", "address"],
      sourceAddress: params.sourceAddress ?? params.developer,
      sequence: params.sequence,
      fee: params.fee,
      timeout: params.timeout,
    });
  }

  /**
   * Build and optionally sign claim_bounty transaction.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async claimBounty(params) {
    const built = await this.buildClaimBountyTx(params);
    let signedXdr = null;
    if (
      params.sign !== false &&
      (params.sign || this.wallet) &&
      (built.xdr || built.transaction)
    ) {
      signedXdr = await this.signTransaction(built);
    }
    return { ...built, signedXdr };
  }

  /**
   * Assemble transaction for submit_bounty.
   * @param {Object} params
   * @param {number|string|bigint} params.bountyId
   * @param {string} params.developer
   * @param {string|Uint8Array} params.submissionHash
   * @param {string} [params.sourceAddress]
   * @param {string|number} [params.fee]
   * @param {number} [params.timeout]
   * @param {string|number|bigint} [params.sequence]
   * @returns {Promise<Object>}
   */
  async buildSubmitBountyTx(params) {
    const submissionBytes = formatBytes32(params.submissionHash);
    return await this.buildTransaction({
      method: METHODS.SUBMIT,
      args: [BigInt(params.bountyId), params.developer, submissionBytes],
      argTypes: ["u64", "address", "bytes32"],
      sourceAddress: params.sourceAddress ?? params.developer,
      sequence: params.sequence,
      fee: params.fee,
      timeout: params.timeout,
    });
  }

  /**
   * Build and optionally sign submit_bounty transaction.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async submitBounty(params) {
    const built = await this.buildSubmitBountyTx(params);
    let signedXdr = null;
    if (
      params.sign !== false &&
      (params.sign || this.wallet) &&
      (built.xdr || built.transaction)
    ) {
      signedXdr = await this.signTransaction(built);
    }
    return { ...built, signedXdr };
  }

  /**
   * Assemble transaction for approve_bounty.
   * @param {Object} params
   * @param {number|string|bigint} params.bountyId
   * @param {string} [params.sourceAddress]
   * @param {string|number} [params.fee]
   * @param {number} [params.timeout]
   * @param {string|number|bigint} [params.sequence]
   * @returns {Promise<Object>}
   */
  async buildApproveBountyTx(params) {
    return await this.buildTransaction({
      method: METHODS.APPROVE,
      args: [BigInt(params.bountyId)],
      argTypes: ["u64"],
      sourceAddress: params.sourceAddress,
      sequence: params.sequence,
      fee: params.fee,
      timeout: params.timeout,
    });
  }

  /**
   * Build and optionally sign approve_bounty transaction.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async approveBounty(params) {
    const built = await this.buildApproveBountyTx(params);
    let signedXdr = null;
    if (
      params.sign !== false &&
      (params.sign || this.wallet) &&
      (built.xdr || built.transaction)
    ) {
      signedXdr = await this.signTransaction(built);
    }
    return { ...built, signedXdr };
  }

  /**
   * Assemble transaction for release_payment.
   * @param {Object} params
   * @param {number|string|bigint} params.bountyId
   * @param {string} [params.sourceAddress]
   * @param {string|number} [params.fee]
   * @param {number} [params.timeout]
   * @param {string|number|bigint} [params.sequence]
   * @returns {Promise<Object>}
   */
  async buildReleasePaymentTx(params) {
    return await this.buildTransaction({
      method: METHODS.RELEASE,
      args: [BigInt(params.bountyId)],
      argTypes: ["u64"],
      sourceAddress: params.sourceAddress,
      sequence: params.sequence,
      fee: params.fee,
      timeout: params.timeout,
    });
  }

  /**
   * Build and optionally sign release_payment transaction.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async releasePayment(params) {
    const built = await this.buildReleasePaymentTx(params);
    let signedXdr = null;
    if (
      params.sign !== false &&
      (params.sign || this.wallet) &&
      (built.xdr || built.transaction)
    ) {
      signedXdr = await this.signTransaction(built);
    }
    return { ...built, signedXdr };
  }

  /**
   * Assemble transaction for cancel_bounty.
   * @param {Object} params
   * @param {number|string|bigint} params.bountyId
   * @param {string} [params.sourceAddress]
   * @param {string|number} [params.fee]
   * @param {number} [params.timeout]
   * @param {string|number|bigint} [params.sequence]
   * @returns {Promise<Object>}
   */
  async buildCancelBountyTx(params) {
    return await this.buildTransaction({
      method: METHODS.CANCEL,
      args: [BigInt(params.bountyId)],
      argTypes: ["u64"],
      sourceAddress: params.sourceAddress,
      sequence: params.sequence,
      fee: params.fee,
      timeout: params.timeout,
    });
  }

  /**
   * Build and optionally sign cancel_bounty transaction.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async cancelBounty(params) {
    const built = await this.buildCancelBountyTx(params);
    let signedXdr = null;
    if (
      params.sign !== false &&
      (params.sign || this.wallet) &&
      (built.xdr || built.transaction)
    ) {
      signedXdr = await this.signTransaction(built);
    }
    return { ...built, signedXdr };
  }

  /**
   * Assemble transaction for refund_bounty.
   * @param {Object} params
   * @param {number|string|bigint} params.bountyId
   * @param {string} [params.sourceAddress]
   * @param {string|number} [params.fee]
   * @param {number} [params.timeout]
   * @param {string|number|bigint} [params.sequence]
   * @returns {Promise<Object>}
   */
  async buildRefundBountyTx(params) {
    return await this.buildTransaction({
      method: METHODS.REFUND,
      args: [BigInt(params.bountyId)],
      argTypes: ["u64"],
      sourceAddress: params.sourceAddress,
      sequence: params.sequence,
      fee: params.fee,
      timeout: params.timeout,
    });
  }

  /**
   * Build and optionally sign refund_bounty transaction.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async refundBounty(params) {
    const built = await this.buildRefundBountyTx(params);
    let signedXdr = null;
    if (
      params.sign !== false &&
      (params.sign || this.wallet) &&
      (built.xdr || built.transaction)
    ) {
      signedXdr = await this.signTransaction(built);
    }
    return { ...built, signedXdr };
  }

  /**
   * Execute read view query against RPC or simulation.
   * @param {string} method
   * @param {Array<any>} args
   * @param {Array<string>} [argTypes]
   * @returns {Promise<any>}
   */
  async callReadView(method, args = [], argTypes = []) {
    if (this.rpc && typeof this.rpc.simulate === "function") {
      return await this.rpc.simulate(this.contractId, method, args);
    }
    const sdk = await this.getSdk();
    if (sdk && (this.rpc || this.rpcUrl)) {
      const rpcServer =
        this.rpc instanceof sdk.rpc.Server
          ? this.rpc
          : new sdk.rpc.Server(this.rpcUrl);
      const scValArgs = args.map((arg, idx) =>
        encodeScVal(sdk, arg, argTypes[idx])
      );
      const contract = new sdk.Contract(this.contractId);
      const dummyAccount = new sdk.Account(
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        "0"
      );
      const tx = new sdk.TransactionBuilder(dummyAccount, {
        fee: "100",
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(method, ...scValArgs))
        .setTimeout(180)
        .build();

      const sim = await rpcServer.simulateTransaction(tx);
      if (sdk.rpc.Api.isSimulationSuccess(sim)) {
        return sdk.scValToNative(sim.result.retval);
      }
      throw new Error(`Simulation failed: ${sim.error ?? "unknown error"}`);
    }
    throw new Error("RPC client or connection required to execute read views");
  }

  /**
   * Read on-chain bounty details by ID.
   * @param {number|string|bigint} bountyId
   * @returns {Promise<Object|null>}
   */
  async getBounty(bountyId) {
    const raw = await this.callReadView(
      METHODS.GET,
      [BigInt(bountyId)],
      ["u64"]
    );
    return parseBounty(raw);
  }

  /**
   * Read next bounty ID counter.
   * @returns {Promise<bigint>}
   */
  async nextId() {
    const res = await this.callReadView(METHODS.NEXT_ID, [], []);
    return typeof res === "bigint" ? res : BigInt(res);
  }

  /**
   * Read contract admin address.
   * @returns {Promise<string>}
   */
  async admin() {
    const res = await this.callReadView(METHODS.ADMIN, [], []);
    return String(res);
  }
}
