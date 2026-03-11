/**
 * Opus Integration - CDP protocol on Starknet
 *
 * Fetches real data from Opus contracts.
 */
export declare class OpusIntegration {
    private provider;
    private contract;
    constructor(rpcUrl: string);
    /**
     * Get current borrowing rate
     */
    getBorrowingRate(): Promise<number>;
    /**
     * Get user debt position
     */
    getDebt(userAddress: string): Promise<bigint>;
}
//# sourceMappingURL=opus.d.ts.map