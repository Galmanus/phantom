/**
 * ChainScanner - Recover notes from on-chain events
 * 
 * OBSTACLE 4 SOLUTION:
 * If a user loses their local storage (IndexedDB), they can recover all their
 * notes by scanning the blockchain events and decrypting with their IVK.
 * 
 * This is the same approach Zcash uses - the chain is the backup.
 */

import { RpcProvider } from 'starknet';
import { PHANTOM_POOL_ADDRESS } from './constants';
import { ShieldedNote, AssetId } from './types';
import { decryptNoteWithIVK, PhantomKeyManager } from './key-derivation';

export interface ChainScannerConfig {
  rpcUrl: string;
  poolAddress?: string;
  startBlock?: bigint;
  batchSize?: number;
}

export interface ShieldEventData {
  commitment: string;
  assetId: number;
  leafIndex: number;
  newMerkleRoot: string;
  encryptedNote: string;
  blockNumber: bigint;
  blockHash: string;
  transactionHash: string;
}

export interface UnshieldEventData {
  nullifier: string;
  changeCommitment: string | null;
  newMerkleRoot: string;
  blockNumber: bigint;
  blockHash: string;
  transactionHash: string;
}

export interface ScanResult {
  notes: ShieldedNote[];
  lastScannedBlock: bigint;
  totalEvents: number;
  errors: string[];
}

/**
 * ChainScanner - scans on-chain events to recover shielded notes
 * 
 * Usage:
 * 1. User loses device/clears storage
 * 2. User reconnects wallet
 * 3. SDK derives same IVK from wallet key
 * 4. ChainScanner scans all Shield events
 * 5. Decrypts notes using IVK
 * 6. User's balance is restored
 */
export class ChainScanner {
  private provider: RpcProvider;
  private poolAddress: string;
  private startBlock: bigint;
  private batchSize: number;

  constructor(config: ChainScannerConfig) {
    this.provider = new RpcProvider({ nodeUrl: config.rpcUrl });
    this.poolAddress = config.poolAddress || PHANTOM_POOL_ADDRESS;
    this.startBlock = config.startBlock || 0n;
    this.batchSize = config.batchSize || 1000;
  }

  /**
   * Scan all Shield events from chain and try to decrypt with IVK
   * 
   * This is the main entry point for note recovery.
   */
  async recoverNotes(
    keyManager: PhantomKeyManager,
    fromBlock?: bigint,
    toBlock?: bigint,
    onProgress?: (current: number, total: number, block: bigint) => void
  ): Promise<ShieldedNote[]> {
    const ivk = keyManager.ivkBytes;

    // Get current block range if not specified
    if (!toBlock) {
      const block = await this.provider.getBlock('latest');
      toBlock = BigInt(block.block_number);
    }

    const start = fromBlock || this.startBlock;
    const totalBlocks = Number(toBlock - start);
    
    // Query Shield events in batches
    const shieldEvents: ShieldEventData[] = [];
    const errors: string[] = [];
    
    let currentBlock = start;
    let batchNum = 0;
    
    while (currentBlock < toBlock) {
      const batchEnd = currentBlock + BigInt(this.batchSize);
      const batchTo = batchEnd > toBlock ? toBlock : batchEnd;
      
      try {
        const events = await this.queryShieldEvents(currentBlock, batchTo - 1n);
        shieldEvents.push(...events);
      } catch (error) {
        errors.push(`Block ${currentBlock}-${batchTo}: ${error}`);
      }
      
      currentBlock = batchTo;
      batchNum++;
      
      onProgress?.(batchNum, Math.ceil(totalBlocks / this.batchSize), currentBlock);
    }
    
    // Query Unshield events to know which notes were spent
    const unshieldEvents = await this.queryUnshieldEvents(start, toBlock);
    const spentNullifiers = new Set(unshieldEvents.map(e => e.nullifier.toLowerCase()));

    const notes: ShieldedNote[] = [];

    for (const event of shieldEvents) {
      try {
        // Decrypt the note using IVK
        const noteData = await decryptNoteWithIVK(event.encryptedNote, ivk);

        if (noteData) {
          // Serial number is derived from commitment - compute it
          const serialNumber = this.deriveSerialNumber(
            event.commitment,
            noteData.nullifierSecret
          );
          
          // Compute nullifier to check if spent
          const nullifier = this.computeNullifier(
            noteData.nullifierSecret,
            serialNumber
          );
          
          const isSpent = spentNullifiers.has(nullifier.toLowerCase());

          notes.push({
            commitment: event.commitment,
            amount: noteData.amount,
            assetId: event.assetId as AssetId,
            nullifierSecret: noteData.nullifierSecret.toString(16),
            serialNumber: serialNumber.toString(16),
            salt: noteData.salt.toString(16),
            leafIndex: event.leafIndex,
            merkleRoot: event.newMerkleRoot,
            createdAt: Number(event.blockNumber) * 15000, // Approximate timestamp (15s block)
            spent: isSpent,
            status: isSpent ? 'spent' : 'confirmed',
          });
        }
      } catch (error) {
        // Note might not belong to this user (wrong IVK)
        // This is expected - we just skip it
        console.debug(`Failed to decrypt note ${event.commitment}: ${error}`);
      }
    }

    return notes;
  }

  /**
   * Query Shield events from the pool contract
   * 
   * Uses Starknet getEvents API to fetch Shield events
   */
  private async queryShieldEvents(
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<ShieldEventData[]> {
    // In production, use the actual event query
    // Starknet RPC v0.7.0+ supports getEvents
    
    try {
      const result = await this.provider.getEvents({
        from_block: { block_number: Number(fromBlock) },
        to_block: { block_number: Number(toBlock) },
        address: this.poolAddress,
        keys: [['0x536869656c646564']], // "Shielded" event key
        chunk_size: 1000,
      });

      return result.events.map((event: any) => this.parseShieldEvent(event));
    } catch (error) {
      // If event query fails (e.g., older network), return empty
      console.warn('Failed to query shield events:', error);
      return [];
    }
  }

  /**
   * Parse a Shield event from raw event data
   */
  private parseShieldEvent(event: any): ShieldEventData {
    // Events are decoded from data
    // ShieldEvent: commitment, asset_id, leaf_index, new_merkle_root, encrypted_note
    
    const data = event.data || [];
    
    return {
      commitment: data[0] || '0x0',
      assetId: parseInt(data[1] || '0'),
      leafIndex: parseInt(data[2] || '0'),
      newMerkleRoot: data[3] || '0x0',
      encryptedNote: data[4] || '', // ByteArray as string
      blockNumber: BigInt(event.block_number || 0),
      blockHash: event.block_hash || '0x0',
      transactionHash: event.transaction_hash || '0x0',
    };
  }

  /**
   * Query Unshield events from the pool contract
   */
  private async queryUnshieldEvents(
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<UnshieldEventData[]> {
    try {
      const result = await this.provider.getEvents({
        from_block: { block_number: Number(fromBlock) },
        to_block: { block_number: Number(toBlock) },
        address: this.poolAddress,
        keys: [['0x556e736869656c646564']], // "Unshielded" event key
        chunk_size: 1000,
      });

      return result.events.map((event: any) => this.parseUnshieldEvent(event));
    } catch (error) {
      console.warn('Failed to query unshield events:', error);
      return [];
    }
  }

  /**
   * Parse an Unshield event from raw event data
   */
  private parseUnshieldEvent(event: any): UnshieldEventData {
    const data = event.data || [];
    
    return {
      nullifier: data[0] || '0x0',
      changeCommitment: data[1] !== '0x0' ? data[1] : null,
      newMerkleRoot: data[2] || '0x0',
      blockNumber: BigInt(event.block_number || 0),
      blockHash: event.block_hash || '0x0',
      transactionHash: event.transaction_hash || '0x0',
    };
  }

  /**
   * Compute nullifier from secret and serial
   * 
   * nullifier = Poseidon(nullifier_secret, serial_number)
   * Using domain separator "PHANTOM_V1_NULLIFIER"
   */
  computeNullifier(nullifierSecret: bigint, serialNumber: bigint): string {
    const domain = 0x5048414e544f4d5f56315f4e554c4c49464552n; // "PHANTOM_V1_NULLIFIER"
    
    // Simplified Poseidon-like hash
    // In production use starknet.js poseidon2
    let hash = nullifierSecret;
    hash = (hash * 31n + domain) % (1n << 251n);
    hash = (hash * 31n + serialNumber) % (1n << 251n);
    
    return '0x' + hash.toString(16).padStart(64, '0');
  }

  /**
   * Derive serial number from commitment and nullifier secret
   * 
   * serial = Poseidon(commitment, nullifier_secret)
   */
  deriveSerialNumber(commitment: string, nullifierSecret: bigint): bigint {
    const commitBig = BigInt(commitment);
    
    // Simplified derivation
    // In production use proper Poseidon2
    let hash = commitBig;
    hash = (hash * 31n + nullifierSecret) % (1n << 251n);
    
    return hash;
  }

  /**
   * Get the block number for a specific date
   * 
   * Estimates block number based on average block time (15s)
   */
  async getBlockForDate(date: Date): Promise<bigint> {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffBlocks = diffMs / 15000; // 15 second average block time
    
    const currentBlock = await this.getLatestBlock();
    const estimatedBlock = currentBlock - BigInt(Math.floor(diffBlocks));
    
    return estimatedBlock > 0n ? estimatedBlock : 0n;
  }

  /**
   * Get the latest block number
   */
  async getLatestBlock(): Promise<bigint> {
    const block = await this.provider.getBlock('latest');
    return BigInt(block.block_number);
  }

  /**
   * Check if a commitment exists in the current tree
   */
  async isCommitmentInTree(commitment: string): Promise<boolean> {
    // In production: query contract to check if commitment exists
    // For now, we can only check if the commitment was ever in a valid root
    return false;
  }

  /**
   * Get the current Merkle root from the pool
   */
  async getCurrentRoot(): Promise<string> {
    // This would need the contract call in production
    return '0x0';
  }

  /**
   * Check if a root is valid (was a valid Merkle root recently)
   */
  async isRootValid(root: string): Promise<boolean> {
    // In production: call contract.is_valid_historical_root(root)
    return false;
  }

  /**
   * Scan and merge recovered notes with local storage
   * 
   * This combines chain-scanned notes with existing local notes
   */
  async scanAndMerge(
    keyManager: PhantomKeyManager,
    existingNotes: ShieldedNote[],
    onProgress?: (current: number, total: number, block: bigint) => void
  ): Promise<{
    merged: ShieldedNote[];
    newNotes: ShieldedNote[];
    spentNotes: string[];
  }> {
    // Get block to scan from (use oldest existing note or start block)
    let fromBlock = this.startBlock;
    
    if (existingNotes.length > 0) {
      // Start from the oldest note's creation block
      const oldestBlock = Math.min(...existingNotes.map(n => n.createdAt / 15000));
      fromBlock = BigInt(Math.floor(oldestBlock / 15000));
    }

    const toBlock = await this.getLatestBlock();
    
    // Scan chain
    const chainNotes = await this.recoverNotes(keyManager, fromBlock, toBlock, onProgress);
    
    // Create map of existing commitments
    const existingMap = new Map(existingNotes.map(n => [n.commitment.toLowerCase(), n]));
    
    const merged: ShieldedNote[] = [];
    const newNotes: ShieldedNote[] = [];
    const spentNotes: string[] = [];
    
    // Merge chain notes with existing
    for (const chainNote of chainNotes) {
      const key = chainNote.commitment.toLowerCase();
      const existing = existingMap.get(key);
      
      if (existing) {
        // Update existing note with latest status
        merged.push({
          ...existing,
          spent: chainNote.spent,
          status: chainNote.spent ? 'spent' : existing.status,
        });
        
        if (chainNote.spent && !existing.spent) {
          spentNotes.push(key);
        }
      } else {
        // New note from chain
        newNotes.push(chainNote);
        merged.push(chainNote);
      }
    }
    
    // Add existing notes that weren't found on chain (might be unshielded)
    for (const existing of existingNotes) {
      if (!chainNotes.find(n => n.commitment.toLowerCase() === existing.commitment.toLowerCase())) {
        merged.push(existing);
      }
    }

    return { merged, newNotes, spentNotes };
  }
}

/**
 * Create a ChainScanner with default configuration
 */
export function createChainScanner(rpcUrl: string): ChainScanner {
  return new ChainScanner({ rpcUrl });
}

/**
 * Estimate scanning time based on block range
 */
export function estimateScanTime(fromBlock: bigint, toBlock: bigint): {
  blocks: bigint;
  seconds: number;
  formatted: string;
} {
  const blocks = toBlock - fromBlock;
  const seconds = Number(blocks) * 15; // 15s average block time
  
  if (seconds < 60) {
    return { blocks, seconds, formatted: `${seconds}s` };
  } else if (seconds < 3600) {
    return { blocks, seconds, formatted: `${Math.floor(seconds / 60)}m` };
  } else {
    return { blocks, seconds, formatted: `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m` };
  }
}
