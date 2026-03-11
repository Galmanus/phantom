/**
 * PhantomSDK - Main SDK class for PHANTOM protocol
 */
import type { PhantomSDKConfig, ShieldedNote, YieldPosition, IntentReceipt, ComplianceProof, ShieldStep, UnshieldStep, SwapStep, YieldStep, KYCProofData } from './types';
export declare class PhantomSDK {
    private provider;
    private account;
    private pool;
    private complianceOracle;
    private intentMatcher;
    private noteStore;
    private prover;
    constructor(config: PhantomSDKConfig);
    /**
     * Initialize the SDK (connect to worker, load notes)
     */
    initialize(): Promise<void>;
    /**
     * Clean up resources
     */
    destroy(): void;
    /**
     * Deposit assets into the shield pool
     */
    shield(params: {
        asset: string;
        amount: bigint;
        onProgress?: (step: ShieldStep, message: string) => void;
    }): Promise<ShieldedNote>;
    /**
     * Withdraw assets from the shield pool
     */
    unshield(params: {
        note: ShieldedNote;
        recipient: string;
        amount: bigint;
        onProgress?: (step: UnshieldStep, message: string) => void;
    }): Promise<string>;
    /**
     * Execute a private swap
     */
    privateSwap(params: {
        noteIn: ShieldedNote;
        assetOut: string;
        minAmountOut: bigint;
        slippageTolerance: number;
        onProgress?: (step: SwapStep, message: string) => void;
    }): Promise<ShieldedNote>;
    /**
     * Deposit to shielded yield protocol
     */
    depositShieldedYield(params: {
        note: ShieldedNote;
        protocol: 'vesu' | 'uncap' | 'opus';
        onProgress?: (step: YieldStep, message: string) => void;
    }): Promise<YieldPosition>;
    /**
     * Generate compliance proof for regulator
     */
    generateComplianceProof(params: {
        note: ShieldedNote;
        regulatorId: string;
        scope: 'amount_only' | 'kyc_status' | 'full_audit';
        kycProofData: KYCProofData;
    }): Promise<ComplianceProof>;
    /**
     * Submit intent to dark pool
     */
    submitIntent(params: {
        noteIn: ShieldedNote;
        assetOut: string;
        minAmountOut: bigint;
        deadline: number;
    }): Promise<IntentReceipt>;
    /**
     * Fetch AVNU quote
     */
    private fetchAVNUQuote;
    /**
     * Fetch APY from yield protocol
     */
    private fetchProtocolAPY;
    /**
     * Convert hex proof to calldata array
     */
    private hexToCalldata;
    /**
     * Get all shielded notes
     */
    getAllNotes(): Promise<ShieldedNote[]>;
    /**
     * Get all yield positions
     */
    getAllYieldPositions(): Promise<YieldPosition[]>;
    /**
     * Export backup
     */
    exportBackup(): Promise<Blob>;
    /**
     * Import backup
     */
    importBackup(file: File): Promise<number>;
}
//# sourceMappingURL=PhantomSDK.d.ts.map