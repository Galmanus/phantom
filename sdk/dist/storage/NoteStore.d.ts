/**
 * NoteStore - Encrypted local storage for ShieldedNotes
 *
 * CRITICAL SECURITY:
 * - Notes are NEVER sent to any server
 * - Notes are NEVER stored in localStorage
 * - Notes are NEVER stored in plain text
 * - Encryption key is derived from user password via PBKDF2
 */
import type { ShieldedNote, YieldPosition, IntentReceipt } from '../types';
export declare class NoteStore {
    private password;
    private db;
    private encryptionKey;
    private passwordVerified;
    constructor(password: string);
    /**
     * Initialize the store and derive encryption key
     */
    initialize(): Promise<void>;
    /**
     * Derive AES-GCM key from password using PBKDF2
     */
    private deriveKey;
    /**
     * Encrypt data using AES-GCM
     */
    private encrypt;
    /**
     * Decrypt data using AES-GCM
     */
    private decrypt;
    /**
     * Save a shielded note
     */
    saveNote(note: ShieldedNote): Promise<void>;
    /**
     * Get a shielded note by commitment
     */
    getNote(commitment: string): Promise<ShieldedNote | null>;
    /**
     * Get all shielded notes
     */
    getAllNotes(): Promise<ShieldedNote[]>;
    /**
     * Delete a note
     */
    deleteNote(commitment: string): Promise<void>;
    /**
     * Save a yield position
     */
    saveYieldPosition(position: YieldPosition): Promise<void>;
    /**
     * Get all yield positions
     */
    getAllYieldPositions(): Promise<YieldPosition[]>;
    /**
     * Save an intent receipt
     */
    saveIntent(intent: IntentReceipt): Promise<void>;
    /**
     * Update intent status
     */
    updateIntentStatus(commitment: string, status: IntentReceipt['status']): Promise<void>;
    /**
     * Get an intent receipt
     */
    getIntent(commitment: string): Promise<IntentReceipt | null>;
    /**
     * Export encrypted backup of all notes
     */
    exportEncryptedBackup(): Promise<Blob>;
    /**
     * Import notes from encrypted backup
     */
    importFromBackup(file: File): Promise<number>;
    /**
     * Utility: ArrayBuffer to Base64
     */
    private arrayBufferToBase64;
    /**
     * Utility: Base64 to ArrayBuffer
     */
    private base64ToArrayBuffer;
    /**
     * Get notes by status
     *
     * OBSTACLE 1: Used by SDK to select only confirmed notes for new proofs,
     * preventing concurrent spending of the same UTXO.
     */
    getNotesByStatus(assetId: number, status: 'pending' | 'confirmed' | 'spent' | 'failed'): Promise<ShieldedNote[]>;
    /**
     * Count notes by status
     */
    countByStatus(assetId: number, status: string): Promise<number>;
    /**
     * Select notes for a new proof - ONLY returns confirmed notes
     *
     * OBSTACLE 1 CORE SOLUTION:
     * This method applies an automatic offset to skip pending notes,
     * preventing the same UTXO from being selected in concurrent proofs.
     *
     * This is the exact mechanism described in Aztec's forum post:
     * "offset-based note selection" to solve UTXO concurrency.
     */
    selectNotesForProof(assetId: number, amount: bigint, strategy?: 'oldest_first' | 'smallest_first'): Promise<ShieldedNote[]>;
    /**
     * Mark notes with a specific status
     */
    markNotesStatus(commitments: string[], status: 'pending' | 'confirmed' | 'spent' | 'failed'): Promise<void>;
    /**
     * Update note status
     */
    updateNoteStatus(commitment: string, status: 'pending' | 'confirmed' | 'spent' | 'failed'): Promise<void>;
    /**
     * Update leaf index
     */
    updateLeafIndex(commitment: string, leafIndex: number): Promise<void>;
    /**
     * Restore notes to confirmed status after failed transaction
     *
     * OBSTACLE 1: If a transaction reverts, we restore the notes
     * so they can be used in future transactions.
     */
    restoreNotesAfterFailure(commitments: string[]): Promise<void>;
    /**
     * Confirm note after seeing it in a block
     *
     * Called when a Shield event is detected on-chain
     */
    confirmNote(commitment: string, leafIndex: number): Promise<void>;
    /**
     * Mark note as spent
     */
    markNoteSpent(commitment: string): Promise<void>;
    /**
     * Standard coin selection (greedy algorithm)
     *
     * Minimizes the number of notes used to cover the target amount.
     */
    private coinSelect;
}
//# sourceMappingURL=NoteStore.d.ts.map