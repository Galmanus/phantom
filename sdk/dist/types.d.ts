/**
 * PHANTOM SDK Types
 */
import { FieldElement } from './constants';
export declare enum AssetId {
    WBTC = 0,
    TBTC = 1,
    LBTC = 2,
    SOLVBTC = 3,
    STRK = 4,
    USDC = 5
}
export interface AssetInfo {
    id: AssetId;
    name: string;
    symbol: string;
    decimals: number;
    contractAddress: string;
}
export interface ShieldedNote {
    commitment: FieldElement;
    amount: bigint;
    assetId: AssetId;
    nullifierSecret: FieldElement;
    serialNumber: FieldElement;
    salt: FieldElement;
    leafIndex: number;
    merkleRoot: FieldElement;
    createdAt: number;
    spent: boolean;
}
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
export interface ComplianceProof {
    regulatorId: string;
    scope: 'amount_only' | 'kyc_status' | 'full_audit';
    kycProof: KYCProof;
    amountProof: AmountProof;
    sanctionsProof: SanctionsProof;
    proofBundle: string;
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
export type ShieldStep = 'generating_randomness' | 'computing_commitment' | 'generating_proof' | 'submitting_transaction';
export type UnshieldStep = 'fetching_merkle_data' | 'computing_nullifier' | 'generating_proof' | 'submitting_transaction';
export type SwapStep = 'fetching_price_quote' | 'generating_proof' | 'executing_swap' | 'settling';
export type YieldStep = 'fetching_apy' | 'generating_proof' | 'depositing' | 'claiming';
export interface PhantomSDKConfig {
    rpcUrl: string;
    account: any;
    storagePassword: string;
    chainId?: string;
}
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
export declare class PhantomError extends Error {
    code: string;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
}
export declare class ProofGenerationError extends PhantomError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class TransactionError extends PhantomError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class StorageError extends PhantomError {
    constructor(message: string, details?: Record<string, unknown>);
}
//# sourceMappingURL=types.d.ts.map