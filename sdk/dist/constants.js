/**
 * PHANTOM SDK Constants
 */
// Contract addresses (to be filled after deployment)
export const PHANTOM_POOL_ADDRESS = process.env.NEXT_PUBLIC_PHANTOM_POOL_ADDRESS || '';
export const PHANTOM_MERKLE_ADDRESS = process.env.NEXT_PUBLIC_PHANTOM_MERKLE_ADDRESS || '';
export const PHANTOM_VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS || '';
export const COMPLIANCE_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS || '';
export const INTENT_MATCHER_ADDRESS = process.env.NEXT_PUBLIC_INTENT_MATCHER_ADDRESS || '';
// Token addresses on Starknet Sepolia
export const TOKEN_ADDRESSES = {
    WBTC: process.env.NEXT_PUBLIC_WBTC_ADDRESS || '',
    TBTC: process.env.NEXT_PUBLIC_TBTC_ADDRESS || '',
    LBTC: process.env.NEXT_PUBLIC_LBTC_ADDRESS || '',
    SOLVBTC: process.env.NEXT_PUBLIC_SOLVBTC_ADDRESS || '',
    STRK: process.env.NEXT_PUBLIC_STRK_ADDRESS || '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
};
// Supported assets configuration
export const SUPPORTED_ASSETS = {
    WBTC: {
        id: 0,
        name: 'Wrapped Bitcoin',
        symbol: 'wBTC',
        decimals: 8,
        contractAddress: TOKEN_ADDRESSES.WBTC,
    },
    TBTC: {
        id: 1,
        name: 'tBTC',
        symbol: 'tBTC',
        decimals: 18,
        contractAddress: TOKEN_ADDRESSES.TBTC,
    },
    LBTC: {
        id: 2,
        name: 'Liquid Bitcoin',
        symbol: 'LBTC',
        decimals: 8,
        contractAddress: TOKEN_ADDRESSES.LBTC,
    },
    SOLVBTC: {
        id: 3,
        name: 'Solv Bitcoin',
        symbol: 'SolvBTC',
        decimals: 18,
        contractAddress: TOKEN_ADDRESSES.SOLVBTC,
    },
    STRK: {
        id: 4,
        name: 'Starknet Token',
        symbol: 'STRK',
        decimals: 18,
        contractAddress: TOKEN_ADDRESSES.STRK,
    },
    USDC: {
        id: 5,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        contractAddress: TOKEN_ADDRESSES.USDC,
    },
};
// Protocol IDs for yield
export const PROTOCOL_IDS = {
    VESU: 0,
    UNCAP: 1,
    OPUS: 2,
};
// Integration endpoints
export const AVNU_API_URL = process.env.NEXT_PUBLIC_AVNU_API_URL || 'https://starknet.api.avnu.fi';
export const VESU_SINGLETON_ADDRESS = process.env.NEXT_PUBLIC_VESU_SINGLETON_ADDRESS || '';
export const UNCAP_ADDRESS = process.env.NEXT_PUBLIC_UNCAP_ADDRESS || '';
export const OPUS_ADDRESS = process.env.NEXT_PUBLIC_OPUS_ADDRESS || '';
// RPC configuration
export const STARKNET_RPC_URL = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || '';
export const STARKNET_CHAIN_ID = process.env.NEXT_PUBLIC_STARKNET_CHAIN_ID || 'SN_SEPOLIA';
// Nullifier domain separator: "PHANTOM_V1_NULLIFIER" as felt252
export const NULLIFIER_DOMAIN = '0x5048414e544f4d5f56315f4e554c4c4946494552';
// Tree configuration
export const TREE_HEIGHT = 20;
export const MAX_LEAVES = 1 << TREE_HEIGHT; // 2^20 = 1,048,576
// WASM configuration
export const WASM_PATH = process.env.NEXT_PUBLIC_WASM_PATH || '/phantom_prover_bg.wasm';
// Helper functions
export function getAssetById(id) {
    return Object.values(SUPPORTED_ASSETS).find(asset => asset.id === id);
}
export function getAssetBySymbol(symbol) {
    return SUPPORTED_ASSETS[symbol.toUpperCase()];
}
export function formatAmount(amount, decimals) {
    const divisor = 10n ** BigInt(decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    return `${whole}.${fraction.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
}
export function parseAmount(amount, decimals) {
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction);
}
//# sourceMappingURL=constants.js.map