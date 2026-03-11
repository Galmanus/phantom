/**
 * AVNU Integration - Real DEX aggregation on Starknet
 * 
 * Uses AVNU's official API for price quotes and swap execution.
 * https://docs.avnu.fi/
 */

import { AVNU_API_URL } from '../constants';

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
  slippage?: number; // basis points (e.g., 50 = 0.5%)
}

/**
 * Fetch swap quote from AVNU API
 */
export async function fetchQuote(params: AVNUSwapParams): Promise<AVNUQuote> {
  const url = new URL(`${AVNU_API_URL}/swap/v2/quotes`);
  url.searchParams.set('sellTokenAddress', params.sellTokenAddress);
  url.searchParams.set('buyTokenAddress', params.buyTokenAddress);
  url.searchParams.set('sellAmount', params.sellAmount.toString());
  url.searchParams.set('takerAddress', params.takerAddress);
  
  if (params.slippage !== undefined) {
    url.searchParams.set('slippage', params.slippage.toString());
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AVNU quote failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  
  return {
    sellTokenAddress: data.sellTokenAddress,
    buyTokenAddress: data.buyTokenAddress,
    sellAmount: BigInt(data.sellAmount),
    buyAmount: BigInt(data.buyAmount),
    price: data.price,
    priceImpact: data.priceImpact,
    route: data.routes || [],
    gasFee: BigInt(data.gasFee || 0),
    avnuFee: BigInt(data.avnuFee || 0),
    expiry: data.expiry,
  };
}

/**
 * Build swap calldata for AVNU execution
 */
export function buildSwapCalldata(
  quote: AVNUQuote,
  takerAddress: string,
  minAmountOut: bigint,
): string[] {
  // In production: build actual calldata using AVNU SDK
  // This is a simplified version
  
  return [
    quote.sellTokenAddress,
    quote.buyTokenAddress,
    quote.sellAmount.toString(),
    minAmountOut.toString(),
    takerAddress,
  ];
}

/**
 * Get token price in USD
 */
export async function getTokenPriceUSD(tokenAddress: string): Promise<number> {
  const url = new URL(`${AVNU_API_URL}/swap/v2/tokens/${tokenAddress}`);
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch token price: ${response.status}`);
  }

  const data = await response.json();
  return data.currentPrice || 0;
}

/**
 * Get all supported tokens from AVNU
 */
export async function getSupportedTokens(): Promise<Array<{
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}>> {
  const url = `${AVNU_API_URL}/swap/v2/tokens`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tokens: ${response.status}`);
  }

  return response.json();
}
