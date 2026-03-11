/**
 * PHANTOM SDK Constants
 */
import type { AssetInfo } from './types';
export type FieldElement = string;
export declare const PHANTOM_POOL_ADDRESS: string;
export declare const PHANTOM_MERKLE_ADDRESS: string;
export declare const PHANTOM_VERIFIER_ADDRESS: string;
export declare const COMPLIANCE_ORACLE_ADDRESS: string;
export declare const INTENT_MATCHER_ADDRESS: string;
export declare const TOKEN_ADDRESSES: Record<string, string>;
export declare const SUPPORTED_ASSETS: Record<string, AssetInfo>;
export declare const PROTOCOL_IDS: {
    readonly VESU: 0;
    readonly UNCAP: 1;
    readonly OPUS: 2;
};
export declare const AVNU_API_URL: string;
export declare const VESU_SINGLETON_ADDRESS: string;
export declare const UNCAP_ADDRESS: string;
export declare const OPUS_ADDRESS: string;
export declare const STARKNET_RPC_URL: string;
export declare const STARKNET_CHAIN_ID: string;
export declare const NULLIFIER_DOMAIN = "0x5048414e544f4d5f56315f4e554c4c4946494552";
export declare const TREE_HEIGHT = 20;
export declare const MAX_LEAVES: number;
export declare const WASM_PATH: string;
export declare function getAssetById(id: number): AssetInfo | undefined;
export declare function getAssetBySymbol(symbol: string): AssetInfo | undefined;
export declare function formatAmount(amount: bigint, decimals: number): string;
export declare function parseAmount(amount: string, decimals: number): bigint;
//# sourceMappingURL=constants.d.ts.map