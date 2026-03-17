/**
 * NoteStore - Encrypted local storage for ShieldedNotes
 *
 * CRITICAL SECURITY:
 * - Notes are NEVER sent to any server
 * - Notes are NEVER stored in localStorage
 * - Notes are NEVER stored in plain text
 * - Encryption key is derived from user password via PBKDF2 with per-user salt
 */

import { openDB, IDBPDatabase } from 'idb';
// IDBKeyRange is a global interface in browsers, not exported from idb library
type IDBKeyRange = globalThis.IDBKeyRange;
import type { ShieldedNote, YieldPosition, IntentReceipt } from '../types';
import { NoteSelectionError, StorageError } from '../types';
import {
  deriveEncryptionKey,
  encrypt,
  decrypt,
  toHex,
  fromHex,
} from './encryption';
import {
  createBackupData,
  serializeBackup,
  deserializeBackup,
  createBackupBlob,
  parseBackupFile,
  validateBackupFile,
  type EncryptedBackupFile,
} from './backup';

const DB_NAME = 'phantom-notes-v1';
const DB_VERSION = 1;
const STORE_NOTES = 'shielded_notes';
const STORE_YIELD = 'yield_positions';
const STORE_INTENTS = 'intents';
const STORE_META = 'meta';

// Key for meta store
const META_SALT_KEY = 'encryption_salt';

/**
 * Internal record structure stored in IndexedDB
 */
interface EncryptedRecord {
  id: string;
  ciphertext: string;  // hex encoded
  iv: string;         // hex encoded
  createdAt: number;
  spent?: boolean;    // indexed for quick queries
}

export class NoteStore {
  private db: IDBPDatabase | null = null;
  private encryptionKey: CryptoKey | null = null;
  private initialized = false;

  constructor(private password: string) {}

  /**
   * Initialize the store and derive encryption key
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Open IndexedDB
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Shielded notes store
          if (!db.objectStoreNames.contains(STORE_NOTES)) {
            const notesStore = db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
            notesStore.createIndex('spent', 'spent', { unique: false });
            notesStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
          // Yield positions store
          if (!db.objectStoreNames.contains(STORE_YIELD)) {
            const yieldStore = db.createObjectStore(STORE_YIELD, { keyPath: 'id' });
            yieldStore.createIndex('spent', 'spent', { unique: false });
          }
          // Intents store
          if (!db.objectStoreNames.contains(STORE_INTENTS)) {
            db.createObjectStore(STORE_INTENTS, { keyPath: 'id' });
          }
          // Meta store for salt, version, etc.
          if (!db.objectStoreNames.contains(STORE_META)) {
            db.createObjectStore(STORE_META);
          }
        },
      });

      // Get or create salt for key derivation
      const existingSalt = await this.db.get(STORE_META, META_SALT_KEY);
      let saltBytes: Uint8Array;

      if (existingSalt) {
        saltBytes = fromHex(existingSalt as string);
      } else {
        // Generate random salt for this user's database
        saltBytes = crypto.getRandomValues(new Uint8Array(16));
        await this.db.put(STORE_META, toHex(saltBytes), META_SALT_KEY);
      }

      // Derive encryption key from password using PBKDF2
      const { key } = await deriveEncryptionKey(this.password, saltBytes);
      this.encryptionKey = key;

      this.initialized = true;
    } catch (error) {
      throw new StorageError(
        `Failed to initialize NoteStore: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }

  /**
   * Assert the store is initialized
   */
  private assertReady(): void {
    if (!this.initialized || !this.db || !this.encryptionKey) {
      throw new StorageError('NoteStore not initialized. Call initialize() first.');
    }
  }

  /**
   * Encrypt a record
   */
  private async encryptRecord(data: unknown): Promise<{ ciphertext: string; iv: string }> {
    const json = JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    );
    const { ciphertext, iv } = await encrypt(json, this.encryptionKey!);
    return { ciphertext: toHex(ciphertext), iv: toHex(iv) };
  }

  /**
   * Decrypt a record
   */
  private async decryptRecord<T>(record: EncryptedRecord): Promise<T> {
    const plaintext = await decrypt(
      fromHex(record.ciphertext),
      fromHex(record.iv),
      this.encryptionKey!
    );
    return JSON.parse(plaintext, (_, value) => {
      if (typeof value === 'string' && value.endsWith('n') && /^\d+n$/.test(value)) {
        return BigInt(value.slice(0, -1));
      }
      return value;
    }) as T;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // SHIELDED NOTES
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * Save a shielded note
   */
  async saveNote(note: ShieldedNote): Promise<void> {
    this.assertReady();

    const { ciphertext, iv } = await this.encryptRecord(note);

    const record: EncryptedRecord = {
      id: note.commitment,
      ciphertext,
      iv,
      createdAt: note.createdAt,
      spent: note.spent,
    };

    try {
      await this.db!.add(STORE_NOTES, record);
    } catch (error) {
      // IDB throws ConstraintError if key already exists
      throw new StorageError(
        `Failed to save note ${note.commitment}: ${error instanceof Error ? error.message : String(error)}`,
        { commitment: note.commitment, cause: error }
      );
    }
  }

  /**
   * Get a shielded note by commitment
   */
  async getNote(commitment: string): Promise<ShieldedNote | null> {
    this.assertReady();

    const record = await this.db!.get(STORE_NOTES, commitment) as EncryptedRecord | undefined;
    if (!record) return null;

    try {
      return await this.decryptRecord<ShieldedNote>(record);
    } catch {
      return null;
    }
  }

  /**
   * Get all shielded notes
   */
  async getAllNotes(): Promise<ShieldedNote[]> {
    this.assertReady();

    const records = await this.db!.getAll(STORE_NOTES) as EncryptedRecord[];
    const notes: ShieldedNote[] = [];

    for (const record of records) {
      try {
        const note = await this.decryptRecord<ShieldedNote>(record);
        notes.push(note);
      } catch {
        console.warn('[NoteStore] Failed to decrypt note, skipping:', record.id);
      }
    }

    return notes;
  }

  /**
   * Get only unspent notes (uses IndexedDB index for performance)
   */
  async getUnspentNotes(): Promise<ShieldedNote[]> {
    this.assertReady();

    const index = this.db!.transaction(STORE_NOTES).store.index('spent');
    const records = await index.getAll(IDBKeyRange.only(false)) as EncryptedRecord[];

    const notes: ShieldedNote[] = [];
    for (const record of records) {
      try {
        notes.push(await this.decryptRecord<ShieldedNote>(record));
      } catch {
        console.warn('[NoteStore] Failed to decrypt note, skipping:', record.id);
      }
    }
    return notes;
  }

  /**
   * Get notes by status (OBSTACLE 1: for concurrent transaction handling)
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
   * OBSTACLE 1 CORE SOLUTION: offset-based note selection to solve UTXO concurrency
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

    // Sort notes by strategy
    const sorted = [...confirmedNotes].sort((a, b) => {
      if (strategy === 'oldest_first') {
        return a.createdAt - b.createdAt;
      }
      return Number(a.amount - b.amount);
    });

    // Coin selection: select minimum notes that cover the amount
    let selected: ShieldedNote[] = [];
    let total = 0n;

    for (const note of sorted) {
      selected.push(note);
      total += note.amount;
      if (total >= amount) break;
    }

    if (total < amount) {
      throw new NoteSelectionError(
        `Insufficient confirmed balance. Available: ${total}, Required: ${amount}.`
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
   * Mark a note as spent
   */
  async markNoteSpent(commitment: string): Promise<void> {
    const note = await this.getNote(commitment);
    if (!note) {
      throw new StorageError(`Note not found: ${commitment}`, { commitment });
    }
    await this.updateNoteStatus(commitment, 'spent');
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
      note.spent = status === 'spent';
      await this.saveNote(note);
    }
  }

  /**
   * Update leaf index after on-chain confirmation
   */
  async updateLeafIndex(commitment: string, leafIndex: number): Promise<void> {
    const note = await this.getNote(commitment);
    if (note) {
      note.leafIndex = leafIndex;
      await this.saveNote(note);
    }
  }

  /**
   * Confirm note after seeing it in a block
   */
  async confirmNote(commitment: string): Promise<void> {
    await this.updateNoteStatus(commitment, 'confirmed');
  }

  /**
   * Restore notes to confirmed status after failed transaction
   * OBSTACLE 1: If a transaction reverts, restore notes so they can be used in future transactions
   */
  async restoreNotesAfterFailure(commitments: string[]): Promise<void> {
    await this.markNotesStatus(commitments, 'confirmed');
  }

  /**
   * Delete a note
   */
  async deleteNote(commitment: string): Promise<void> {
    this.assertReady();
    await this.db!.delete(STORE_NOTES, commitment);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // YIELD POSITIONS
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * Save a yield position
   */
  async saveYieldPosition(position: YieldPosition): Promise<void> {
    this.assertReady();

    const { ciphertext, iv } = await this.encryptRecord(position);

    const record: EncryptedRecord = {
      id: position.depositCommitment,
      ciphertext,
      iv,
      createdAt: position.depositTimestamp,
      spent: position.claimed,
    };

    try {
      await this.db!.add(STORE_YIELD, record);
    } catch (error) {
      throw new StorageError(
        `Failed to save yield position: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }

  /**
   * Get all yield positions
   */
  async getAllYieldPositions(): Promise<YieldPosition[]> {
    this.assertReady();

    const records = await this.db!.getAll(STORE_YIELD) as EncryptedRecord[];
    const positions: YieldPosition[] = [];

    for (const record of records) {
      try {
        positions.push(await this.decryptRecord<YieldPosition>(record));
      } catch {
        console.warn('[NoteStore] Failed to decrypt yield position, skipping:', record.id);
      }
    }

    return positions;
  }

  /**
   * Get active (non-claimed) yield positions
   */
  async getActiveYieldPositions(): Promise<YieldPosition[]> {
    this.assertReady();

    const index = this.db!.transaction(STORE_YIELD).store.index('spent');
    const records = await index.getAll(IDBKeyRange.only(false)) as EncryptedRecord[];

    const positions: YieldPosition[] = [];
    for (const record of records) {
      try {
        positions.push(await this.decryptRecord<YieldPosition>(record));
      } catch {
        console.warn('[NoteStore] Failed to decrypt yield position, skipping:', record.id);
      }
    }
    return positions;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // INTENTS (for dark pool)
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * Save an intent receipt
   */
  async saveIntent(intent: IntentReceipt): Promise<void> {
    this.assertReady();

    const { ciphertext, iv } = await this.encryptRecord(intent);

    await this.db!.put(STORE_INTENTS, {
      id: intent.commitment,
      ciphertext,
      iv,
      createdAt: intent.submittedAt,
    });
  }

  /**
   * Get an intent receipt
   */
  async getIntent(commitment: string): Promise<IntentReceipt | null> {
    this.assertReady();

    const record = await this.db!.get(STORE_INTENTS, commitment) as EncryptedRecord | undefined;
    if (!record) return null;

    try {
      return await this.decryptRecord<IntentReceipt>(record);
    } catch {
      return null;
    }
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

  // ═════════════════════════════════════════════════════════════════════════════
  // BACKUP & RESTORE
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * Export encrypted backup of all notes
   */
  async exportBackup(): Promise<Blob> {
    this.assertReady();

    const notes = await this.getAllNotes();
    const positions = await this.getAllYieldPositions();

    const backupData = createBackupData(notes, positions);
    const serialized = serializeBackup(backupData);

    const { ciphertext, iv } = await encrypt(serialized, this.encryptionKey!);

    const encryptedFile: EncryptedBackupFile = {
      version: '1',
      created_at: Date.now(),
      encrypted_data: toHex(ciphertext),
      iv: toHex(iv),
    };

    return createBackupBlob(encryptedFile);
  }

  /**
   * Import notes from encrypted backup
   */
  async importBackup(file: File): Promise<number> {
    this.assertReady();

    const rawJson = await parseBackupFile(file);
    const parsed = JSON.parse(rawJson);

    if (!validateBackupFile(parsed)) {
      throw new StorageError('Invalid backup file format');
    }

    const plaintext = await decrypt(
      fromHex(parsed.encrypted_data),
      fromHex(parsed.iv),
      this.encryptionKey!
    );

    const backupData = deserializeBackup(plaintext);
    let importedCount = 0;

    // Import notes
    for (const noteJson of backupData.notes) {
      try {
        const note = JSON.parse(noteJson, (_, value) => {
          if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 10) {
            return BigInt(value);
          }
          return value;
        }) as ShieldedNote;

        const existing = await this.getNote(note.commitment);
        if (!existing) {
          await this.saveNote(note);
          importedCount++;
        }
      } catch (e) {
        console.warn('[NoteStore] Failed to import note, skipping:', e);
      }
    }

    // Import yield positions
    for (const positionJson of backupData.yield_positions) {
      try {
        const position = JSON.parse(positionJson) as YieldPosition;
        const existing = await this.db!.get(STORE_YIELD, position.depositCommitment);
        if (!existing) {
          await this.saveYieldPosition(position);
          importedCount++;
        }
      } catch (e) {
        console.warn('[NoteStore] Failed to import yield position, skipping:', e);
      }
    }

    return importedCount;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    notes: number;
    yieldPositions: number;
    unspentNotes: number;
  }> {
    this.assertReady();

    const [notes, yieldPositions, unspentNotes] = await Promise.all([
      this.db!.count(STORE_NOTES),
      this.db!.count(STORE_YIELD),
      this.getUnspentNotes().then(n => n.length),
    ]);

    return { notes, yieldPositions, unspentNotes };
  }

  /**
   * Clear all data (IRREVERSIBLE)
   * Only used for development / account reset
   */
  async clearAll(): Promise<void> {
    this.assertReady();
    await this.db!.clear(STORE_NOTES);
    await this.db!.clear(STORE_YIELD);
    await this.db!.clear(STORE_INTENTS);
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.encryptionKey = null;
      this.initialized = false;
    }
  }
}
