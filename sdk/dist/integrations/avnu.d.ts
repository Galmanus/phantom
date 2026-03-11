/**
 * AVNU Integration - Real DEX aggregation on Starknet
 *
 * Uses AVNU's official API for price quotes and swap execution.
 * https://docs.avnu.fi/
 */
export interface AVNUQuote {
    sellTokenAddress: string;
    buyTokenAddress: string;
    sellAmount: bigint;
    buyAmount: bigint;
    price: number;
    priceImpact: number;
    route: AVNURoute[];
    gasFee: bigint;
    avnuFee: bigint;
    expiry: number;
}
export interface AVNURoute {
    name: string;
    percent: number;
    sellTokenAddress: string;
    buyTokenAddress: string;
    intermediateTokenAddresses: string[];
}
export interface AVNUSwapParams {
    sellTokenAddress: string;
    buyTokenAddress: string;
    sellAmount: bigint;
    takerAddress: string;
    slippage?: number;
}
/**
 * Fetch swap quote from AVNU API
 */
export declare function fetchQuote(params: AVNUSwapParams): Promise<AVNUQuote>;
/**
 * Build swap calldata for AVNU execution
 */
export declare function buildSwapCalldata(quote: AVNUQuote, takerAddress: string, minAmountOut: bigint): string[];
/**
 * Get token price in USD
 */
export declare function getTokenPriceUSD(tokenAddress: string): Promise<number>;
/**
 * Get all supported tokens from AVNU
 */
export declare function getSupportedTokens(): Promise<Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}>>;
//# sourceMappingURL=avnu.d.ts.map