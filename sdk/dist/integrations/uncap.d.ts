/**
 * Uncap Integration - Yield protocol on Starknet
 *
 * Fetches real APY and position data from Uncap contracts.
 */
export declare class UncapIntegration {
    private provider;
    private contract;
    constructor(rpcUrl: string);
    /**
     * Get current APY
     */
    getCurrentAPY(): Promise<number>;
    /**
     * Get user position
     */
    getPosition(userAddress: string): Promise<{
        shares: bigint;
        value: bigint;
    }>;
}
//# sourceMappingURL=uncap.d.ts.map