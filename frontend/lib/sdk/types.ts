/**
 * PHANTOM SDK Types
 */

import { FieldElement } from './constants';

// Asset types supported by PHANTOM
export enum AssetId {
  WBTC = 0,
  TBTC = 1,
  LBTC = 2,
  SOLVBTC = 3,
  STRK = 4,
  USDC = 5,
}

export interface AssetInfo {
  id: AssetId;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
}

// Shielded note - represents a private position in the shield pool
export interface ShieldedNote {
  commitment: FieldElement;
  amount: bigint;
  assetId: AssetId;
  nullifierSecret: FieldElement;
  serialNumber: FieldElement;
  salt: FieldElement;
  leafIndex: number;
  merkleRoot: FieldElement;
  createdAt: number; // timestamp
  spent: boolean;
}

// Yield position
export interface YieldPosition {
  depositCommitment: FieldElement;
  protocol: 'vesu' | 'uncap' | 'opus';
  protocolId: number;
  principalAmount: bigint;
  assetId: AssetId;
  yieldPositionSecret: FieldElement;
  depositTimestamp: number;
  lastClaimTimestamp: number;
  claimed: boolean;
}

// Intent receipt for dark pool
export interface IntentReceipt {
  commitment: FieldElement;
  nullifier: FieldElement;
  assetIn: AssetId;
  amountIn: bigint;
  assetOut: AssetId;
  minAmountOut: bigint;
  deadline: number;
  status: 'pending' | 'matched' | 'settled' | 'expired' | 'cancelled';
  submittedAt: number;
  settledAt?: number;
}

// Compliance proof
export interface ComplianceProof {
  regulatorId: string;
  scope: 'amount_only' | 'kyc_status' | 'full_audit';
  kycProof: KYCProof;
  amountProof: AmountProof;
  sanctionsProof: SanctionsProof;
  proofBundle: string; // serialized proof bundle
  generatedAt: number;
}

export interface KYCProof {
  kycMerkleRoot: FieldElement;
  kycCommitment: FieldElement;
  verified: boolean;
}

export interface AmountProof {
  reportingThreshold: bigint;
  amountInRange: boolean;
  verified: boolean;
}

export interface SanctionsProof {
  sanctionsMerkleRoot: FieldElement;
  recipientCleared: boolean;
  verified: boolean;
}

export interface KYCProofData {
  kycTimestamp: number;
  kycIssuerId: string;
  merklePath: FieldElement[];
}

// Proof generation steps
export type ShieldStep = 
  | 'generating_randomness'
  | 'computing_commitment'
  | 'generating_proof'
  | 'submitting_transaction';

export type UnshieldStep =
  | 'fetching_merkle_data'
  | 'computing_nullifier'
  | 'generating_proof'
  | 'submitting_transaction';

export type SwapStep =
  | 'fetching_price_quote'
  | 'generating_proof'
  | 'executing_swap'
  | 'settling';

export type YieldStep =
  | 'fetching_apy'
  | 'generating_proof'
  | 'depositing'
  | 'claiming';

// SDK configuration
export interface PhantomSDKConfig {
  rpcUrl: string;
  account: any; // starknet.js Account
  storagePassword: string;
  chainId?: string;
}

// Event types
export interface ShieldEvent {
  type: 'Shielded';
  commitment: FieldElement;
  assetId: number;
  leafIndex: number;
  newMerkleRoot: FieldElement;
  txHash: string;
}

export interface UnshieldEvent {
  type: 'Unshielded';
  nullifier: FieldElement;
  changeCommitment: FieldElement | null;
  newMerkleRoot: FieldElement;
  txHash: string;
}

export interface PrivateSwapEvent {
  type: 'PrivateSwapSettled';
  nullifierIn: FieldElement;
  commitmentOut: FieldElement;
  txHash: string;
}

// Error types
export class PhantomError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PhantomError';
  }
}

export class ProofGenerationError extends PhantomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PROOF_GENERATION_FAILED', details);
    this.name = 'ProofGenerationError';
  }
}

export class TransactionError extends PhantomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TRANSACTION_FAILED', details);
    this.name = 'TransactionError';
  }
}

export class StorageError extends PhantomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}
