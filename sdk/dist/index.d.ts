/**
 * PHANTOM SDK - Public API
 *
 * Zero-knowledge private execution layer for BTCFi on Starknet
 */
export { PhantomSDK } from './PhantomSDK';
export { NoteStore } from './storage/NoteStore';
export { ProverWorkerClient } from './proof/ProverWorkerClient';
export { PhantomKeyManager } from './key-derivation';
export { encryptNote, decryptNote, encryptNoteWithIVK, decryptNoteWithIVK } from './key-derivation';
export * from './types';
export * from './constants';
export * from './storage/encryption';
export * from './storage/backup';
export * from './proof/ProofTypes';
export * from './key-derivation';
export { PhantomPoolABI } from './contracts/PhantomPoolABI';
export { ComplianceOracleABI } from './contracts/PhantomPoolABI';
export { IntentMatcherABI } from './contracts/PhantomPoolABI';
//# sourceMappingURL=index.d.ts.map