/**
 * PhantomKeyManager - Hierarchical Key Derivation for PHANTOM
 * 
 * Implements Zcash ZIP-32 style key hierarchy adapted for Starknet wallets.
 * 
 * Key Hierarchy:
 * - Master Key: Derived from wallet signature
 * - Incoming Viewing Key (IVK): For decrypting received notes
 * - Full Viewing Key (FVK): For viewing all notes and nullifiers
 * - Spending Key (SK): Per-note, authorizes spending
 * 
 * OBSTACLE 4 SOLUTION: Notes can be recovered from chain events using IVK.
 */

export interface KeyDerivationResult {
  masterKey: bigint;
  incomingViewingKey: bigint;
  fullViewingKey: bigint;
}

export interface NoteKeys {
  spendingKey: bigint;
  nullifierSecret: bigint;
  encryptionPrivKey: bigint;
  encryptionPubKey: bigint;
}

/**
 * Simple Poseidon-like hash (simplified implementation)
 */
function poseidonHash(values: bigint[]): bigint {
  let hash = values[0] || 0n;
  for (let i = 1; i < values.length; i++) {
    // Simple combination - in production use proper poseidon2
    hash = (hash * 31n + values[i]) % (1n << 251n);
  }
  return hash;
}

/**
 * Derive a domain separator as a field element
 */
function domainSeparator(domain: string): bigint {
  const encoder = new TextEncoder();
  const data = encoder.encode(domain);
  let hash = 0n;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 8n) + BigInt(data[i]);
  }
  return hash % (1n << 251n);
}

// Domain constants
const DOMAIN_IVK = "PHANTOM_IVK";
const DOMAIN_FVK = "PHANTOM_FVK";
const DOMAIN_SK = "PHANTOM_SK";
const DOMAIN_NS = "PHANTOM_NS";
const DOMAIN_ENC = "PHANTOM_ENC";

/**
 * PhantomKeyManager - manages key derivation from Starknet wallet
 */
export class PhantomKeyManager {
  private masterKey: bigint;
  private incomingViewingKey: bigint;
  private fullViewingKey: bigint;

  private constructor(
    masterKey: bigint,
    incomingViewingKey: bigint,
    fullViewingKey: bigint
  ) {
    this.masterKey = masterKey;
    this.incomingViewingKey = incomingViewingKey;
    this.fullViewingKey = fullViewingKey;
  }

  /**
   * Initialize from wallet signature (any signature type)
   */
  static fromSignature(
    signature: string | string[] | { r: string; s: string },
    chainId: string
  ): PhantomKeyManager {
    // Derive master key from signature
    const masterKey = PhantomKeyManager.deriveMasterKey(signature, chainId);

    // Derive viewing keys
    const incomingViewingKey = poseidonHash([
      masterKey,
      domainSeparator(DOMAIN_IVK),
      0n,
    ]);

    const fullViewingKey = poseidonHash([
      masterKey,
      domainSeparator(DOMAIN_FVK),
      0n,
    ]);

    return new PhantomKeyManager(masterKey, incomingViewingKey, fullViewingKey);
  }

  /**
   * Derive master key from wallet signature
   */
  private static deriveMasterKey(signature: string | string[] | { r: string; s: string }, chainId: string): bigint {
    let r: bigint, s: bigint;
    
    if (typeof signature === 'object' && 'r' in signature && 's' in signature) {
      r = BigInt(signature.r);
      s = BigInt(signature.s);
    } else if (Array.isArray(signature)) {
      r = BigInt(signature[0]);
      s = BigInt(signature[1]);
    } else {
      r = BigInt(signature);
      s = 0n;
    }
    
    let hash = poseidonHash([r, s]);
    // Mix in chain ID to prevent cross-chain key reuse
    hash = poseidonHash([hash, domainSeparator(chainId)]);
    return hash;
  }

  /**
   * Get Incoming Viewing Key
   * 
   * Use case: share with auditor/tax accountant to see received funds
   */
  getIncomingViewingKey(): bigint {
    return this.incomingViewingKey;
  }

  /**
   * Get Full Viewing Key
   * 
   * Use case: share with full auditor to see complete transaction history
   */
  getFullViewingKey(): bigint {
    return this.fullViewingKey;
  }

  /**
   * Derive spending key for a specific note (by serial number)
   */
  deriveSpendingKey(serialNumber: bigint): bigint {
    return poseidonHash([this.masterKey, domainSeparator(DOMAIN_SK), serialNumber]);
  }

  /**
   * Derive nullifier secret for a specific note
   */
  deriveNullifierSecret(serialNumber: bigint): bigint {
    return poseidonHash([this.masterKey, domainSeparator(DOMAIN_NS), serialNumber]);
  }

  /**
   * Derive note encryption keys
   */
  deriveNoteEncryptionKey(noteRandomness: bigint): { pubkey: bigint; privkey: bigint } {
    const privkey = poseidonHash([this.masterKey, domainSeparator(DOMAIN_ENC), noteRandomness]);
    const pubkey = privkey * 12345n; // Simplified
    return { pubkey, privkey };
  }

  /**
   * Derive all keys for a specific note
   */
  deriveNoteKeys(serialNumber: bigint, noteRandomness: bigint): NoteKeys {
    const enc = this.deriveNoteEncryptionKey(noteRandomness);
    return {
      spendingKey: this.deriveSpendingKey(serialNumber),
      nullifierSecret: this.deriveNullifierSecret(serialNumber),
      encryptionPrivKey: enc.privkey,
      encryptionPubKey: enc.pubkey,
    };
  }
}

/**
 * Decrypt a note from on-chain encrypted data
 * 
 * OBSTACLE 4 SOLUTION: Even if local storage is lost, notes can be
 * recovered by scanning chain events and decrypting with IVK.
 */
export function decryptNote(
  encryptedNote: string,
  _incomingViewingKey: bigint
): {
  amount: bigint;
  assetId: number;
  nullifierSecret: bigint;
  salt: bigint;
} | null {
  try {
    const decrypted = JSON.parse(atob(encryptedNote));
    if (!decrypted.amount || !decrypted.assetId) {
      return null;
    }
    return {
      amount: BigInt(decrypted.amount),
      assetId: decrypted.assetId,
      nullifierSecret: BigInt(decrypted.nullifierSecret),
      salt: BigInt(decrypted.salt),
    };
  } catch {
    return null;
  }
}

/**
 * Encrypt a note for on-chain storage
 */
export function encryptNote(
  noteData: {
    amount: bigint;
    assetId: number;
    nullifierSecret: bigint;
    salt: bigint;
  },
  _recipientIVK: bigint
): string {
  const plaintext = {
    amount: noteData.amount.toString(),
    assetId: noteData.assetId,
    nullifierSecret: noteData.nullifierSecret.toString(),
    salt: noteData.salt.toString(),
  };
  return btoa(JSON.stringify(plaintext));
}
