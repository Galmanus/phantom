// types/index.ts - Shared type definitions for PHANTOM frontend

/**
 * Shielded Note - represents a note in the shield pool
 */
export interface ShieldedNote {
  commitment: string;
  amount: bigint;
  assetId: number;
  nullifierSecret: string;
  serialNumber: string;
  salt: string;
  leafIndex: number;
  merkleRoot: string;
  createdAt: number;
  spent: boolean;
}

/**
 * Yield Position - represents a shielded yield position
 */
export interface YieldPosition {
  commitment: string;
  amount: bigint;
  assetId: number;
  protocolId: number; // 0 = Vesu, 1 = Uncap, 2 = Opus
  positionId: string;
  claimedAmount: bigint;
  createdAt: number;
  spent: boolean;
}

/**
 * Intent Receipt - represents a submitted intent
 */
export interface IntentReceipt {
  commitment: string;
  intentId: string;
  expiry: number;
  createdAt: number;
}

/**
 * Compliance Proof - represents a generated compliance proof
 */
export interface ComplianceProof {
  proof: string;
  regulatorId: string;
  scope: 'amount_only' | 'kyc_status' | 'full_audit';
  generatedAt: number;
  expiresAt: number;
}

/**
 * Shield progress step types
 */
export type ShieldStep = 
  | 'generating_randomness'
  | 'computing_commitment'
  | 'generating_proof'
  | 'submitting_transaction';

/**
 * Unshield progress step types  
 */
export type UnshieldStep =
  | 'fetching_merkle_proof'
  | 'computing_nullifier'
  | 'generating_proof'
  | 'submitting_transaction';

/**
 * Swap progress step types
 */
export type SwapStep =
  | 'fetching_quote'
  | 'building_intent'
  | 'generating_proof'
  | 'submitting_intent'
  | 'matching'
  | 'settling';

/**
 * Yield progress step types
 */
export type YieldStep =
  | 'verifying_protocol'
  | 'generating_deposit_proof'
  | 'submitting_deposit'
  | 'claiming_yield'
  | 'generating_claim_proof';

/**
 * KYC Proof Data - for compliance proofs
 */
export interface KYCProofData {
  address: string;
  timestamp: number;
  issuerId: string;
  merkleProof: string[];
}

/**
 * Asset information
 */
export interface AssetInfo {
  id: number;
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  logoUrl?: string;
}
