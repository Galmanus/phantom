/**
 * Vesu Integration - Real lending protocol on Starknet
 *
 * Fetches real APY and position data from Vesu contracts.
 * https://vesu.xyz/
 */
export declare class VesuIntegration {
    private provider;
    private singleton;
    constructor(rpcUrl: string);
    /**
     * Get current APY for an asset
     */
    getCurrentAPY(assetAddress: string): Promise<number>;
    /**
     * Get position value for a user
     */
    getPositionValue(params: {
        poolId: string;
        collateralAsset: string;
        debtAsset: string;
        userAddress: string;
    }): Promise<{
        collateral: bigint;
        debt: bigint;
        healthFactor: number;
    }>;
    /**
     * Get total value locked in Vesu
     */
    getTVL(): Promise<bigint>;
    /**
     * Get all supported assets in Vesu
     */
    getSupportedAssets(): Promise<string[]>;
}
//# sourceMappingURL=vesu.d.ts.map