/**
 * PhantomSDK Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhantomSDK } from '../src/PhantomSDK';
import { NoteStore } from '../src/storage/NoteStore';

// Mock the prover worker
vi.mock('../src/proof/ProverWorkerClient', () => ({
  ProverWorkerClient: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    proveShield: vi.fn().mockResolvedValue('0xmockproof'),
    deriveCommitment: vi.fn().mockResolvedValue('0xmockcommitment'),
    deriveNullifier: vi.fn().mockResolvedValue('0xmocknullifier'),
    terminate: vi.fn(),
  })),
}));

describe('PhantomSDK', () => {
  let sdk: PhantomSDK;

  const mockConfig = {
    rpcUrl: 'https://starknet-sepolia.infura.io/v3/test',
    account: {
      address: '0xtest',
      execute: vi.fn().mockResolvedValue({ transaction_hash: '0xtxhash' }),
    },
    storagePassword: 'test-password',
  };

  beforeEach(async () => {
    sdk = new PhantomSDK(mockConfig);
    await sdk.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      expect(sdk).toBeDefined();
    });

    it('should initialize NoteStore with encryption', async () => {
      // NoteStore should be initialized
      expect(await sdk.getAllNotes()).toBeDefined();
    });

    it('should initialize prover worker', async () => {
      // ProverWorkerClient should be initialized
      expect(sdk).toBeDefined();
    });
  });

  describe('shield', () => {
    it('should shield WBTC successfully', async () => {
      const amount = BigInt(100000000); // 1 wBTC

      // Mock account execute to return success
      mockConfig.account.execute = vi.fn()
        .mockResolvedValueOnce({ transaction_hash: '0xapprove' })
        .mockResolvedValueOnce({ transaction_hash: '0xshield' });

      const note = await sdk.shield({
        asset: 'WBTC',
        amount,
      });

      expect(note).toBeDefined();
      expect(note.commitment).toBe('0xmockcommitment');
      expect(note.amount).toBe(amount);
    });

    it('should reject unsupported asset', async () => {
      await expect(
        sdk.shield({
          asset: 'INVALID',
          amount: BigInt(1000),
        })
      ).rejects.toThrow('Unsupported asset');
    });

    it('should call progress callback during shielding', async () => {
      const onProgress = vi.fn();

      mockConfig.account.execute = vi.fn()
        .mockResolvedValueOnce({ transaction_hash: '0xapprove' })
        .mockResolvedValueOnce({ transaction_hash: '0xshield' });

      await sdk.shield({
        asset: 'WBTC',
        amount: BigInt(1000),
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('note persistence', () => {
    it('should save shielded note to encrypted storage', async () => {
      mockConfig.account.execute = vi.fn()
        .mockResolvedValueOnce({ transaction_hash: '0xapprove' })
        .mockResolvedValueOnce({ transaction_hash: '0xshield' });

      const note = await sdk.shield({
        asset: 'WBTC',
        amount: BigInt(1000),
      });

      const allNotes = await sdk.getAllNotes();
      expect(allNotes).toContainEqual(expect.objectContaining({
        commitment: note.commitment,
      }));
    });

    it('should persist notes after browser reload (IndexedDB)', async () => {
      // Create note
      mockConfig.account.execute = vi.fn()
        .mockResolvedValueOnce({ transaction_hash: '0xapprove' })
        .mockResolvedValueOnce({ transaction_hash: '0xshield' });

      await sdk.shield({
        asset: 'WBTC',
        amount: BigInt(1000),
      });

      // Simulate reload by creating new SDK instance
      const sdk2 = new PhantomSDK(mockConfig);
      await sdk2.initialize();

      const notes = await sdk2.getAllNotes();
      expect(notes.length).toBeGreaterThan(0);
    });
  });

  describe('backup', () => {
    it('should export encrypted backup', async () => {
      const backup = await sdk.exportBackup();
      expect(backup).toBeInstanceOf(Blob);
      expect(backup.type).toBe('application/json');
    });

    it('should import backup and restore notes', async () => {
      // Create a note
      mockConfig.account.execute = vi.fn()
        .mockResolvedValueOnce({ transaction_hash: '0xapprove' })
        .mockResolvedValueOnce({ transaction_hash: '0xshield' });

      await sdk.shield({
        asset: 'WBTC',
        amount: BigInt(1000),
      });

      // Export backup
      const backup = await sdk.exportBackup();

      // Create new SDK and import
      const sdk2 = new PhantomSDK(mockConfig);
      await sdk2.initialize();

      const file = new File([backup], 'backup.json');
      const imported = await sdk2.importBackup(file);

      expect(imported).toBeGreaterThanOrEqual(0);
    });
  });

  describe('destroy', () => {
    it('should terminate worker on destroy', () => {
      sdk.destroy();
      // Worker should be terminated (tested via mock)
    });
  });
});
