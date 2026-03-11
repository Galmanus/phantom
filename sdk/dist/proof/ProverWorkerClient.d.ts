/**
 * ProverWorkerClient - Communicates with WASM prover in Web Worker
 *
 * All proof generation runs off the main thread to avoid blocking the UI.
 */
export declare class ProverWorkerClient {
    private wasmPath;
    private worker;
    private initialized;
    private pendingRequests;
    constructor(wasmPath: string);
    /**
     * Initialize the worker and load WASM
     */
    initialize(): Promise<void>;
    /**
     * Handle response from worker
     */
    private handleResponse;
    /**
     * Generate a unique request ID
     */
    private generateRequestId;
    /**
     * Send request to worker
     */
    private sendRequest;
    /**
     * Generate shield proof
     */
    proveShield(params: {
        commitment: string;
        assetId: number;
        amount: string;
        nullifierSecret: string;
        salt: string;
    }): Promise<string>;
    /**
     * Generate unshield proof
     */
    proveUnshield(params: {
        nullifier: string;
        changeCommitment: string | null;
        merkleRoot: string;
        noteCommitment: string;
        noteAmount: string;
        noteAssetId: number;
        withdrawalAmount: string;
        nullifierSecret: string;
        serialNumber: string;
        merklePath: string[];
        changeAmount: string;
        newNullifierSecret: string;
        newSalt: string;
    }): Promise<string>;
    /**
     * Generate private swap proof
     */
    provePrivateSwap(params: {
        nullifierIn: string;
        commitmentOut: string;
        merkleRoot: string;
        inputAmount: string;
        outputAmount: string;
        outputAssetId: number;
        outputNullifierSecret: string;
        outputSalt: string;
        minRate: string;
        maxRate: string;
    }): Promise<string>;
    /**
     * Generate yield deposit proof
     */
    proveYieldDeposit(params: {
        depositCommitment: string;
        protocolId: number;
        nullifierIn: string;
        merkleRoot: string;
        depositAmount: string;
        yieldPositionSecret: string;
        depositTimestamp: number;
    }): Promise<string>;
    /**
     * Generate yield claim proof
     */
    proveYieldClaim(params: {
        positionNullifier: string;
        yieldCommitment: string;
        remainingCommitment: string;
        merkleRoot: string;
        claimableYield: string;
        remainingPrincipal: string;
        claimTimestamp: number;
    }): Promise<string>;
    /**
     * Generate compliance proof bundle
     */
    proveCompliance(params: {
        regulatorId: string;
        scope: number;
        kycMerkleRoot: string;
        kycCommitment: string;
        reportingThreshold: string;
        amountInRange: boolean;
        sanctionsMerkleRoot: string;
        recipientCleared: boolean;
    }): Promise<string>;
    /**
     * Generate intent proof
     */
    proveIntent(params: {
        assetIn: string;
        amountIn: string;
        assetOut: string;
        minAmountOut: string;
        nullifierSecret: string;
        deadline: number;
    }): Promise<string>;
    /**
     * Derive commitment (helper function)
     */
    deriveCommitment(params: {
        amount: string;
        assetId: number;
        nullifierSecret: string;
        salt: string;
    }): Promise<string>;
    /**
     * Derive nullifier (helper function)
     */
    deriveNullifier(params: {
        nullifierSecret: string;
        serialNumber: string;
    }): Promise<string>;
    /**
     * Terminate the worker
     */
    terminate(): void;
}
//# sourceMappingURL=ProverWorkerClient.d.ts.map