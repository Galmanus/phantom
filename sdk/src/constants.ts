/**
 * MIDAS Protocol Constants
 */

export type FieldElement = string;

// Contract addresses (should be set via environment variables)
export const MIDAS_POOL_ADDRESS = process.env.NEXT_PUBLIC_MIDAS_POOL_ADDRESS || '';
export const MIDAS_MERKLE_ADDRESS = process.env.NEXT_PUBLIC_MIDAS_MERKLE_ADDRESS || '';
export const COMPLIANCE_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS || '';
export const INTENT_MATCHER_ADDRESS = process.env.NEXT_PUBLIC_INTENT_MATCHER_ADDRESS || '';
export const YIELD_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_YIELD_ROUTER_ADDRESS || '';

// Backward compatibility - use same env vars for PhantomSDK
export const PHANTOM_POOL_ADDRESS = process.env.NEXT_PUBLIC_MIDAS_POOL_ADDRESS || '';
export const PHANTOM_MERKLE_ADDRESS = process.env.NEXT_PUBLIC_MIDAS_MERKLE_ADDRESS || '';

// API URLs
export const AVNU_API_URL = process.env.NEXT_PUBLIC_AVNU_API_URL || 'https://api.avnu.fi';
export const WASM_PATH = process.env.NEXT_PUBLIC_WASM_PATH || '/phantom_prover_bg.wasm';

// Token addresses on Starknet
export const TOKEN_ADDRESSES = {
  WBTC: process.env.NEXT_PUBLIC_TOKEN_WBTC || '',
  TBTC: process.env.NEXT_PUBLIC_TOKEN_TBTC || '',
  LBTC: process.env.NEXT_PUBLIC_TOKEN_LBTC || '',
  SolvBTC: process.env.NEXT_PUBLIC_TOKEN_SOLVBTC || '',
  STRK: process.env.NEXT_PUBLIC_TOKEN_STRK || '',
  USDC: process.env.NEXT_PUBLIC_TOKEN_USDC || '',
  strkBTC: process.env.NEXT_PUBLIC_TOKEN_STRKBTC || '',
};

// Supported assets
export const SUPPORTED_ASSETS = [
  { id: 0, symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, contractAddress: TOKEN_ADDRESSES.WBTC },
  { id: 1, symbol: 'tBTC', name: 'tBTC v2', decimals: 18, contractAddress: TOKEN_ADDRESSES.TBTC },
  { id: 2, symbol: 'LBTC', name: 'Liquid Bitcoin', decimals: 8, contractAddress: TOKEN_ADDRESSES.LBTC },
  { id: 3, symbol: 'SolvBTC', name: 'Solv Protocol BTC', decimals: 18, contractAddress: TOKEN_ADDRESSES.SolvBTC },
  { id: 4, symbol: 'STRK', name: 'Starknet Token', decimals: 18, contractAddress: TOKEN_ADDRESSES.STRK },
  { id: 5, symbol: 'USDC', name: 'USD Coin', decimals: 6, contractAddress: TOKEN_ADDRESSES.USDC },
  { id: 6, symbol: 'strkBTC', name: 'Starknet BTC', decimals: 18, contractAddress: TOKEN_ADDRESSES.strkBTC },
];

// Get asset by symbol
export function getAssetBySymbol(symbol: string) {
  return SUPPORTED_ASSETS.find(a => a.symbol === symbol);
}

// Get asset by ID
export function getAssetById(id: number) {
  return SUPPORTED_ASSETS.find(a => a.id === id);
}

// Parse amount string to bigint
export function parseAmount(amount: string, decimals: number): bigint {
  const [integer, fractional = ''] = amount.split('.');
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedFractional);
}

// Format bigint to amount string
export function formatAmount(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals, '0');
  const integer = str.slice(0, -decimals) || '0';
  const fractional = str.slice(-decimals).replace(/0+$/, '');
  return fractional ? `${integer}.${fractional}` : integer;
}
