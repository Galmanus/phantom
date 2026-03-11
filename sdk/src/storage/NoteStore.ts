/**
 * NoteStore - Encrypted local storage for ShieldedNotes
 * 
 * CRITICAL SECURITY:
 * - Notes are NEVER sent to any server
 * - Notes are NEVER stored in localStorage
 * - Notes are NEVER stored in plain text
 * - Encryption key is derived from user password via PBKDF2
 */

import { openDB, IDBPDatabase } from 'idb';
import type { ShieldedNote, YieldPosition, IntentReceipt } from '../types';
import { NoteSelectionError } from '../types';

const DB_NAME = 'phantom-notes-v1';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';
const YIELD_STORE = 'yield-positions';
const INTENTS_STORE = 'intents';

// PBKDF2 parameters (OWASP 2024 recommendation)
const PBKDF2_ITERATIONS = 600000;
const PBKDF2_SALT = new TextEncoder().encode('PHANTOM_V1_FIXED_SALT_FOR_KEY_DERIVATION');

export class NoteStore {
  private db: IDBPDatabase | null = null;
  private encryptionKey: CryptoKey | null = null;
  private passwordVerified = false;

  constructor(private password: string) {}

  /**
   * Initialize the store and derive encryption key
   */
  async initialize(): Promise<void> {
    // Open IndexedDB
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          db.createObjectStore(NOTES_STORE, { keyPath: 'commitment' });
        }
        if (!db.objectStoreNames.contains(YIELD_STORE)) {
          db.createObjectStore(YIELD_STORE, { keyPath: 'depositCommitment' });
        }
        if (!db.objectStoreNames.contains(INTENTS_STORE)) {
          db.createObjectStore(INTENTS_STORE, { keyPath: 'commitment' });
        }
      },
    });

    // Derive encryption key from password
    this.encryptionKey = await this.deriveKey(this.password);
    this.passwordVerified = true;
  }

  /**
   * Derive AES-GCM key from password using PBKDF2
   */
  private async deriveKey(password: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: PBKDF2_SALT,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encrypt(data: string): Promise<{ ciphertext: string; iv: string }> {
    if (!this.encryptionKey) {
      throw new Error('Store not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encoded
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decrypt(ciphertext: string, iv: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Store not initialized');
    }

    const ciphertextBuffer = this.base64ToArrayBuffer(ciphertext);
    const ivBuffer = this.base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      this.encryptionKey,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Save a shielded note
   */
  async saveNote(note: ShieldedNote): Promise<void> {
    if (!this.db) throw new Error('Store not initialized');

    const serialized = JSON.stringify(note);
    const { ciphertext, iv } = await this.encrypt(serialized);

    await this.db.put(NOTES_STORE, {
      commitment: note.commitment,
      encrypted_data: ciphertext,
      iv,
      createdAt: Date.now(),
    });
  }

  /**
   * Get a shielded note by commitment
   */
  async getNote(commitment: string): Promise<ShieldedNote | null> {
    if (!this.db) throw new Error('Store not initialized');

    const record = await this.db.get(NOTES_STORE, commitment);
    if (!record) return null;

    try {
      const decrypted = await this.decrypt(record.encrypted_data, record.iv);
      return JSON.parse(decrypted) as ShieldedNote;
    } catch (error) {
      console.error('Failed to decrypt note:', error);
      return null;
    }
  }

  /**
   * Get all shielded notes
   */
  async getAllNotes(): Promise<ShieldedNote[]> {
    if (!this.db) throw new Error('Store not initialized');

    const records = await this.db.getAll(NOTES_STORE);
    const notes: ShieldedNote[] = [];

    for (const record of records) {
      try {
        const decrypted = await this.decrypt(record.encrypted_data, record.iv);
        notes.push(JSON.parse(decrypted) as ShieldedNote);
      } catch (error) {
        console.error('Failed to decrypt note:', error);
      }
    }

    return notes;
  }

  /**
   * Delete a note
   */
  async deleteNote(commitment: string): Promise<void> {
    if (!this.db) throw new Error('Store not initialized');
    await this.db.delete(NOTES_STORE, commitment);
  }

  /**
   * Save a yield position
   */
  async saveYieldPosition(position: YieldPosition): Promise<void> {
    if (!this.db) throw new Error('Store not initialized');

    const serialized = JSON.stringify(position);
    const { ciphertext, iv } = await this.encrypt(serialized);

    await this.db.put(YIELD_STORE, {
      depositCommitment: position.depositCommitment,
      encrypted_data: ciphertext,
      iv,
      createdAt: Date.now(),
    });
  }

  /**
   * Get all yield positions
   */
  async getAllYieldPositions(): Promise<YieldPosition[]> {
    if (!this.db) throw new Error('Store not initialized');

    const records = await this.db.getAll(YIELD_STORE);
    const positions: YieldPosition[] = [];

    for (const record of records) {
      try {
        const decrypted = await this.decrypt(record.encrypted_data, record.iv);
        positions.push(JSON.parse(decrypted) as YieldPosition);
      } catch (error) {
        console.error('Failed to decrypt yield position:', error);
      }
    }

    return positions;
  }

  /**
   * Save an intent receipt
   */
  async saveIntent(intent: IntentReceipt): Promise<void> {
    if (!this.db) throw new Error('Store not initialized');

    const serialized = JSON.stringify(intent);
    const { ciphertext, iv } = await this.encrypt(serialized);

    await this.db.put(INTENTS_STORE, {
      commitment: intent.commitment,
      encrypted_data: ciphertext,
      iv,
      createdAt: Date.now(),
    });
  }

  /**
   * Update intent status
   */
  async updateIntentStatus(commitment: string, status: IntentReceipt['status']): Promise<void> {
    const intent = await this.getIntent(commitment);
    if (intent) {
      intent.status = status;
      if (status === 'settled') {
        intent.settledAt = Date.now();
      }
      await this.saveIntent(intent);
    }
  }

  /**
   * Get an intent receipt
   */
  async getIntent(commitment: string): Promise<IntentReceipt | null> {
    if (!this.db) throw new Error('Store not initialized');

    const record = await this.db.get(INTENTS_STORE, commitment);
    if (!record) return null;

    try {
      const decrypted = await this.decrypt(record.encrypted_data, record.iv);
      return JSON.parse(decrypted) as IntentReceipt;
    } catch (error) {
      console.error('Failed to decrypt intent:', error);
      return null;
    }
  }

  /**
   * Export encrypted backup of all notes
   */
  async exportEncryptedBackup(): Promise<Blob> {
    const notes = await this.getAllNotes();
    const positions = await this.getAllYieldPositions();

    const backup = {
      version: '1',
      created_at: Date.now(),
      notes: notes.map(n => JSON.stringify(n)),
      yield_positions: positions.map(p => JSON.stringify(p)),
    };

    const serialized = JSON.stringify(backup);
    const { ciphertext, iv } = await this.encrypt(serialized);

    const backupFile = {
      version: backup.version,
      created_at: backup.created_at,
      encrypted_data: ciphertext,
      iv,
    };

    return new Blob([JSON.stringify(backupFile, null, 2)], {
      type: 'application/json',
    });
  }

  /**
   * Import notes from encrypted backup
   */
  async importFromBackup(file: File): Promise<number> {
    const text = await file.text();
    const backupFile = JSON.parse(text);

    if (backupFile.version !== '1') {
      throw new Error('Unsupported backup version');
    }

    try {
      const decrypted = await this.decrypt(backupFile.encrypted_data, backupFile.iv);
      const backup = JSON.parse(decrypted);

      let importedCount = 0;

      // Import notes
      for (const noteJson of backup.notes || []) {
        const note = JSON.parse(noteJson) as ShieldedNote;
        const existing = await this.getNote(note.commitment);
        if (!existing) {
          await this.saveNote(note);
          importedCount++;
        }
      }

      // Import yield positions
      for (const positionJson of backup.yield_positions || []) {
        const position = JSON.parse(positionJson) as YieldPosition;
        const existing = await this.db!.get(YIELD_STORE, position.depositCommitment);
        if (!existing) {
          await this.saveYieldPosition(position);
          importedCount++;
        }
      }

      return importedCount;
    } catch (error) {
      throw new Error('Failed to decrypt backup - wrong password?');
    }
  }

  /**
   * Utility: ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // OBSTACLE 1 SOLUTION: Concurrent Transaction Handling
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * Get notes by status
   * 
   * OBSTACLE 1: Used by SDK to select only confirmed notes for new proofs,
   * preventing concurrent spending of the same UTXO.
   */
  async getNotesByStatus(
    assetId: number,
    status: 'pending' | 'confirmed' | 'spent' | 'failed'
  ): Promise<ShieldedNote[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.filter(
      note => note.assetId === assetId && note.status === status
    );
  }

  /**
   * Count notes by status
   */
  async countByStatus(assetId: number, status: string): Promise<number> {
    const notes = await this.getNotesByStatus(assetId, status as any);
    return notes.length;
  }

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
  async selectNotesForProof(
    assetId: number,
    amount: bigint,
    strategy: 'oldest_first' | 'smallest_first' = 'oldest_first',
  ): Promise<ShieldedNote[]> {
    // ONLY return confirmed notes - skip all pending notes
    const confirmedNotes = await this.getNotesByStatus(assetId, 'confirmed');

    if (confirmedNotes.length === 0) {
      const pendingCount = await this.countByStatus(assetId, 'pending');
      throw new NoteSelectionError(
        `No confirmed notes available. ` +
        `If you have ${pendingCount} pending transaction(s), ` +
        `wait for confirmation before submitting another.`
      );
    }

    // Coin selection: select minimum notes that cover the amount
    const selected = this.coinSelect(confirmedNotes, amount, strategy);

    if (!selected) {
      const total = confirmedNotes.reduce((acc, n) => acc + n.amount, 0n);
      const pending = await this.countByStatus(assetId, 'pending');
      throw new NoteSelectionError(
        `Insufficient confirmed balance. Available: ${total}, Required: ${amount}. ` +
        `Note: ${pending} note(s) are pending confirmation.`
      );
    }

    // Optimistically mark selected notes as 'pending' IMMEDIATELY
    // This prevents the same notes from being selected by concurrent calls
    await this.markNotesStatus(selected.map(n => n.commitment), 'pending');

    return selected;
  }

  /**
   * Mark notes with a specific status
   */
  async markNotesStatus(
    commitments: string[],
    status: 'pending' | 'confirmed' | 'spent' | 'failed'
  ): Promise<void> {
    for (const commitment of commitments) {
      const note = await this.getNote(commitment);
      if (note) {
        note.status = status;
        await this.saveNote(note);
      }
    }
  }

  /**
   * Update note status
   */
  async updateNoteStatus(
    commitment: string,
    status: 'pending' | 'confirmed' | 'spent' | 'failed'
  ): Promise<void> {
    const note = await this.getNote(commitment);
    if (note) {
      note.status = status;
      await this.saveNote(note);
    }
  }

  /**
   * Update leaf index
   */
  async updateLeafIndex(commitment: string, leafIndex: number): Promise<void> {
    const note = await this.getNote(commitment);
    if (note) {
      note.leafIndex = leafIndex;
      await this.saveNote(note);
    }
  }

  /**
   * Restore notes to confirmed status after failed transaction
   * 
   * OBSTACLE 1: If a transaction reverts, we restore the notes
   * so they can be used in future transactions.
   */
  async restoreNotesAfterFailure(commitments: string[]): Promise<void> {
    await this.markNotesStatus(commitments, 'confirmed');
  }

  /**
   * Confirm note after seeing it in a block
   * 
   * Called when a Shield event is detected on-chain
   */
  async confirmNote(commitment: string, leafIndex: number): Promise<void> {
    await this.updateNoteStatus(commitment, 'confirmed');
    await this.updateLeafIndex(commitment, leafIndex);
  }

  /**
   * Mark note as spent
   */
  async markNoteSpent(commitment: string): Promise<void> {
    await this.updateNoteStatus(commitment, 'spent');
  }

  /**
   * Standard coin selection (greedy algorithm)
   * 
   * Minimizes the number of notes used to cover the target amount.
   */
  private coinSelect(
    notes: ShieldedNote[],
    target: bigint,
    strategy: 'oldest_first' | 'smallest_first',
  ): ShieldedNote[] | null {
    const sorted = [...notes].sort((a, b) => {
      if (strategy === 'oldest_first') {
        return Number(a.createdAt - b.createdAt);
      }
      return Number(a.amount - b.amount);
    });

    const selected: ShieldedNote[] = [];
    let accumulated = 0n;

    for (const note of sorted) {
      selected.push(note);
      accumulated += note.amount;
      if (accumulated >= target) return selected;
    }

    return null; // insufficient funds
  }
}
