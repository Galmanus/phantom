/* tslint:disable */
/* eslint-disable */

export function derive_commitment_js(amount_hex: string, asset_id: number, nullifier_secret_hex: string, salt_hex: string): string;

export function derive_nullifier_js(nullifier_secret_hex: string, serial_number_hex: string): string;

export function poseidon_hash_3_js(a_hex: string, b_hex: string, c_hex: string): string;

export function poseidon_hash_js(left_hex: string, right_hex: string): string;

export function prove_shield(commitment_hex: string, asset_id: number, amount_hex: string, nullifier_secret_hex: string, salt_hex: string): string;

export function verify_shield(proof_hex: string, commitment_hex: string, asset_id: number): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly derive_commitment_js: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number, number];
    readonly derive_nullifier_js: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly poseidon_hash_3_js: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly poseidon_hash_js: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly prove_shield: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number, number];
    readonly verify_shield: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
