export type Network = "testnet" | "public";

export type Status =
  | "Open"
  | "Claimed"
  | "Submitted"
  | "Completed"
  | "Cancelled"
  | "Expired"
  | "Disputed"
  | "Refunded";

export interface VerifiedAsset {
  code: string;
  issuer: string | null;
  native: boolean;
}

export interface VerifiedAssetRegistry {
  testnet: Record<string, VerifiedAsset>;
  public: Record<string, VerifiedAsset>;
}

export interface Bounty {
  id: bigint;
  creator: string;
  developer: string | null;
  token: string;
  amount: bigint;
  deadline: number;
  status: Status | string;
  statusCode: number;
  metadataHash: string | null;
  submissionHash: string | null;
}

export interface BuiltTransaction {
  contractId: string;
  method: string;
  args: any[];
  scValArgs?: any[];
  operation?: any;
  transaction?: any;
  xdr: string | null;
  networkPassphrase: string;
  sourceAddress?: string;
  sequence?: string;
  fee?: string;
  timeout?: number;
}

export interface BuildTransactionOptions {
  method: string;
  args?: any[];
  argTypes?: string[];
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  networkPassphrase?: string;
}

export interface CreateBountyParams {
  creator: string;
  token: string;
  amount: number | string | bigint;
  deadline: number;
  metadataHash: string | Uint8Array;
  asset?: {
    code: string;
    issuer?: string | null;
    network?: Network;
  };
  assetCode?: string;
  assetIssuer?: string | null;
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface ClaimBountyParams {
  bountyId: number | string | bigint;
  developer: string;
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface SubmitBountyParams {
  bountyId: number | string | bigint;
  developer: string;
  submissionHash: string | Uint8Array;
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface ApproveBountyParams {
  bountyId: number | string | bigint;
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface ReleasePaymentParams {
  bountyId: number | string | bigint;
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface CancelBountyParams {
  bountyId: number | string | bigint;
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface RefundBountyParams {
  bountyId: number | string | bigint;
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface BountyEscrowClientOptions {
  contractId?: string;
  network?: Network;
  networkPassphrase?: string;
  rpcUrl?: string;
  wallet?: ForgeWallet | any;
  sdk?: any;
  rpc?: any;
}

export const METHODS: Readonly<{
  CREATE: "create_bounty";
  CLAIM: "claim_bounty";
  SUBMIT: "submit_bounty";
  APPROVE: "approve_bounty";
  RELEASE: "release_payment";
  CANCEL: "cancel_bounty";
  REFUND: "refund_bounty";
  GET: "get_bounty";
  NEXT_ID: "next_id";
  ADMIN: "admin";
  INITIALIZE: "initialize";
  UNCLAIM: "unclaim_bounty";
  DISPUTE: "dispute_bounty";
  EXTEND_DEADLINE: "extend_deadline";
  RESOLVE_DISPUTE: "resolve_dispute";
  PAUSE: "pause";
  UNPAUSE: "unpause";
  SET_TOKEN_ALLOWED: "set_token_allowed";
  SET_ADMIN: "set_admin";
  IS_PAUSED: "is_paused";
  IS_TOKEN_ALLOWED: "is_token_allowed";
}>;

export type ContractErrorName =
  | "NotInitialized" | "AlreadyInitialized" | "NotAdmin" | "NotCreator"
  | "NotDeveloper" | "NotFound" | "ZeroAmount" | "InvalidDeadline"
  | "BadStatus" | "AlreadyClaimed" | "NotClaimed" | "NotSubmitted"
  | "PastDeadline" | "BeforeDeadline" | "Underfunded" | "Internal"
  | "Paused" | "TokenNotAllowed" | "SelfClaim" | "NotParty" | "NotDisputed";

export const ERRORS: Readonly<Record<number, ContractErrorName>>;

export function decodeContractError(
  err: unknown
): { code: number; name: ContractErrorName | "Unknown" } | null;

interface TxOptions {
  sourceAddress?: string;
  sequence?: string | number | bigint;
  fee?: string | number;
  timeout?: number;
  sign?: boolean;
}

export interface UnclaimBountyParams extends TxOptions {
  bountyId: number | string | bigint;
  developer: string;
}

export interface DisputeBountyParams extends TxOptions {
  bountyId: number | string | bigint;
  /** Creator or claiming developer. */
  caller: string;
}

export interface ExtendDeadlineParams extends TxOptions {
  bountyId: number | string | bigint;
  newDeadline: number;
}

export interface ResolveDisputeParams extends TxOptions {
  bountyId: number | string | bigint;
  payDeveloper: boolean;
}

type Signed = BuiltTransaction & { signedXdr: string | null };

export const STATUS: readonly Status[];

export const ASSETS: Readonly<VerifiedAssetRegistry>;

export const BOUNTY_ESCROW_CONTRACT_ID: string;

export const TESTNET_PASSPHRASE: string;

export const PUBLIC_PASSPHRASE: string;

export const TESTNET_RPC_URL: string;

export const PUBLIC_RPC_URL: string;

export function assertVerifiedAsset(
  network: Network,
  code: string,
  issuer?: string | null
): VerifiedAsset;

export function loadStellarSdk(): Promise<any | null>;

export function formatBytes32(input: string | Uint8Array): Uint8Array;

export function parseBounty(raw: any): Bounty | null;

export class ForgeWallet {
  kit: any;
  address: string | null;
  constructor(kit: any);
  connect(): Promise<string>;
  disconnect(): void;
  signTransaction(xdr: string, networkPassphrase: string): Promise<string>;
}

export class BountyEscrowClient {
  network: Network;
  contractId: string;
  networkPassphrase: string;
  rpcUrl: string;
  wallet: ForgeWallet | any | null;
  sdk: any | null;
  rpc: any | null;

  constructor(options?: BountyEscrowClientOptions);

  getSdk(): Promise<any>;

  buildTransaction(options: BuildTransactionOptions): Promise<BuiltTransaction>;

  signTransaction(txOrXdr: string | any): Promise<string>;

  buildCreateBountyTx(params: CreateBountyParams): Promise<BuiltTransaction>;
  createBounty(
    params: CreateBountyParams
  ): Promise<BuiltTransaction & { signedXdr: string | null }>;

  buildClaimBountyTx(params: ClaimBountyParams): Promise<BuiltTransaction>;
  claimBounty(
    params: ClaimBountyParams
  ): Promise<BuiltTransaction & { signedXdr: string | null }>;

  buildSubmitBountyTx(params: SubmitBountyParams): Promise<BuiltTransaction>;
  submitBounty(
    params: SubmitBountyParams
  ): Promise<BuiltTransaction & { signedXdr: string | null }>;

  buildApproveBountyTx(params: ApproveBountyParams): Promise<BuiltTransaction>;
  approveBounty(
    params: ApproveBountyParams
  ): Promise<BuiltTransaction & { signedXdr: string | null }>;

  buildReleasePaymentTx(
    params: ReleasePaymentParams
  ): Promise<BuiltTransaction>;
  releasePayment(
    params: ReleasePaymentParams
  ): Promise<BuiltTransaction & { signedXdr: string | null }>;

  buildCancelBountyTx(params: CancelBountyParams): Promise<BuiltTransaction>;
  cancelBounty(
    params: CancelBountyParams
  ): Promise<BuiltTransaction & { signedXdr: string | null }>;

  buildRefundBountyTx(params: RefundBountyParams): Promise<BuiltTransaction>;
  refundBounty(
    params: RefundBountyParams
  ): Promise<BuiltTransaction & { signedXdr: string | null }>;

  maybeSign(built: BuiltTransaction, params?: { sign?: boolean }): Promise<Signed>;

  buildUnclaimBountyTx(params: UnclaimBountyParams): Promise<BuiltTransaction>;
  unclaimBounty(params: UnclaimBountyParams): Promise<Signed>;

  buildDisputeBountyTx(params: DisputeBountyParams): Promise<BuiltTransaction>;
  disputeBounty(params: DisputeBountyParams): Promise<Signed>;

  buildExtendDeadlineTx(params: ExtendDeadlineParams): Promise<BuiltTransaction>;
  extendDeadline(params: ExtendDeadlineParams): Promise<Signed>;

  buildResolveDisputeTx(params: ResolveDisputeParams): Promise<BuiltTransaction>;
  resolveDispute(params: ResolveDisputeParams): Promise<Signed>;

  isPaused(): Promise<boolean>;
  isTokenAllowed(token: string): Promise<boolean>;

  callReadView(
    method: string,
    args?: any[],
    argTypes?: string[]
  ): Promise<any>;

  getBounty(bountyId: number | string | bigint): Promise<Bounty | null>;

  nextId(): Promise<bigint>;

  admin(): Promise<string>;
}
