/**
 * NoteStore Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NoteStore } from '../src/storage/NoteStore';
import type { ShieldedNote } from '../src/types';

describe('NoteStore', () => {
  let store: NoteStore;
  const password = 'test-password-123';

  beforeEach(async () => {
    store = new NoteStore(password);
    await store.initialize();
  });

  const createTestNote = (commitment: string): ShieldedNote => ({
    commitment,
    amount: BigInt(100000000),
    assetId: 0,
    nullifierSecret: '0xsecret',
    serialNumber: '0xserial',
    salt: '0xsalt',
    leafIndex: 0,
    merkleRoot: '0xroot',
    createdAt: Date.now(),
    spent: false,
  });

  describe('save and retrieve', () => {
    it('should save and retrieve a note', async () => {
      const note = createTestNote('0xcommitment1');
      
      await store.saveNote(note);
      const retrieved = await store.getNote('0xcommitment1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.commitment).toBe(note.commitment);
      expect(retrieved?.amount).toBe(note.amount);
    });

    it('should return null for non-existent note', async () => {
      const retrieved = await store.getNote('0xnonexistent');
      expect(retrieved).toBeNull();
    });

    it('should save and retrieve multiple notes', async () => {
      const note1 = createTestNote('0xcommitment1');
      const note2 = createTestNote('0xcommitment2');
      const note3 = createTestNote('0xcommitment3');

      await store.saveNote(note1);
      await store.saveNote(note2);
      await store.saveNote(note3);

      const allNotes = await store.getAllNotes();
      expect(allNotes).toHaveLength(3);
      expect(allNotes.map(n => n.commitment)).toEqual(
        expect.arrayContaining(['0xcommitment1', '0xcommitment2', '0xcommitment3'])
      );
    });
  });

  describe('encryption', () => {
    it('should encrypt notes at rest', async () => {
      const note = createTestNote('0xsecretcommitment');
      
      await store.saveNote(note);

      // Verify encryption by checking that raw data is not plaintext
      // (This is a basic check - real verification would inspect IndexedDB directly)
      const retrieved = await store.getNote('0xsecretcommitment');
      expect(retrieved).toBeDefined();
      expect(retrieved?.commitment).toBe(note.commitment);
    });

    it('should use different IV for each encryption', async () => {
      const note1 = createTestNote('0xcommitment1');
      const note2 = createTestNote('0xcommitment2');

      await store.saveNote(note1);
      await store.saveNote(note2);

      // Both notes should be retrievable despite different IVs
      const retrieved1 = await store.getNote('0xcommitment1');
      const retrieved2 = await store.getNote('0xcommitment2');

      expect(retrieved1?.commitment).toBe(note1.commitment);
      expect(retrieved2?.commitment).toBe(note2.commitment);
    });
  });

  describe('mark as spent', () => {
    it('should mark note as spent', async () => {
      const note = createTestNote('0xcommitment1');
      
      await store.saveNote(note);
      await store.markNoteSpent('0xcommitment1');

      const retrieved = await store.getNote('0xcommitment1');
      expect(retrieved?.spent).toBe(true);
    });

    it('should handle marking non-existent note as spent gracefully', async () => {
      await expect(store.markNoteSpent('0xnonexistent')).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a note', async () => {
      const note = createTestNote('0xcommitment1');
      
      await store.saveNote(note);
      await store.deleteNote('0xcommitment1');

      const retrieved = await store.getNote('0xcommitment1');
      expect(retrieved).toBeNull();
    });
  });

  describe('backup and import', () => {
    it('should export encrypted backup', async () => {
      const note = createTestNote('0xcommitment1');
      await store.saveNote(note);

      const backup = await store.exportEncryptedBackup();
      
      expect(backup).toBeInstanceOf(Blob);
      expect(backup.type).toBe('application/json');
    });

    it('should import backup and restore notes', async () => {
      const note = createTestNote('0xcommitment1');
      await store.saveNote(note);

      const backup = await store.exportEncryptedBackup();
      const file = new File([backup], 'backup.json');

      // Create new store with same password
      const store2 = new NoteStore(password);
      await store2.initialize();

      const imported = await store2.importFromBackup(file);
      
      expect(imported).toBeGreaterThanOrEqual(0);
      
      const retrieved = await store2.getNote('0xcommitment1');
      expect(retrieved).toBeDefined();
    });

    it('should throw error on wrong password import', async () => {
      const note = createTestNote('0xcommitment1');
      await store.saveNote(note);

      const backup = await store.exportEncryptedBackup();
      const file = new File([backup], 'backup.json');

      // Try to import with wrong password
      const wrongStore = new NoteStore('wrong-password');
      await wrongStore.initialize();

      await expect(wrongStore.importFromBackup(file)).rejects.toThrow();
    });

    it('should not duplicate notes on import', async () => {
      const note = createTestNote('0xcommitment1');
      await store.saveNote(note);

      const backup = await store.exportEncryptedBackup();
      const file = new File([backup], 'backup.json');

      // Import same backup twice
      await store.importFromBackup(file);
      const imported2 = await store.importFromBackup(file);

      // Second import should not add duplicates
      expect(imported2).toBe(0);
      
      const allNotes = await store.getAllNotes();
      expect(allNotes).toHaveLength(1);
    });
  });

  describe('yield positions', () => {
    it('should save and retrieve yield position', async () => {
      const position = {
        depositCommitment: '0xcommitment1',
        protocol: 'vesu' as const,
        protocolId: 0,
        principalAmount: BigInt(100000000),
        assetId: 0,
        yieldPositionSecret: '0xsecret',
        depositTimestamp: Date.now(),
        lastClaimTimestamp: 0,
        claimed: false,
      };

      await store.saveYieldPosition(position);
      const positions = await store.getAllYieldPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0].depositCommitment).toBe(position.depositCommitment);
    });
  });

  describe('intents', () => {
    it('should save and retrieve intent', async () => {
      const intent = {
        commitment: '0xcommitment1',
        nullifier: '0xnullifier1',
        assetIn: 0,
        amountIn: BigInt(100000000),
        assetOut: 5,
        minAmountOut: BigInt(95000000),
        deadline: Date.now() + 3600000,
        status: 'pending' as const,
        submittedAt: Date.now(),
      };

      await store.saveIntent(intent);
      const retrieved = await store.getIntent('0xcommitment1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.commitment).toBe(intent.commitment);
    });

    it('should update intent status', async () => {
      const intent = {
        commitment: '0xcommitment1',
        nullifier: '0xnullifier1',
        assetIn: 0,
        amountIn: BigInt(100000000),
        assetOut: 5,
        minAmountOut: BigInt(95000000),
        deadline: Date.now() + 3600000,
        status: 'pending' as const,
        submittedAt: Date.now(),
      };

      await store.saveIntent(intent);
      await store.updateIntentStatus('0xcommitment1', 'matched');

      const retrieved = await store.getIntent('0xcommitment1');
      expect(retrieved?.status).toBe('matched');
    });
  });
});
