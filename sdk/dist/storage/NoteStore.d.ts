/**
 * NoteStore - Encrypted local storage for ShieldedNotes
 *
 * CRITICAL SECURITY:
 * - Notes are NEVER sent to any server
 * - Notes are NEVER stored in localStorage
 * - Notes are NEVER stored in plain text
 * - Encryption key is derived from user password via PBKDF2
 */
import type { ShieldedNote, YieldPosition, IntentReceipt } from './types';
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
     * Mark a note as spent
     */
    markNoteSpent(commitment: string): Promise<void>;
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
}
//# sourceMappingURL=NoteStore.d.ts.map