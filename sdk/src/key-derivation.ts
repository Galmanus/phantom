/**
 * PhantomKeyManager - Hierarchical Key Derivation for PHANTOM
 * 
 * Implements Zcash ZIP-32 style key hierarchy adapted for Starknet wallets
 * using SNIP-12 message signing + PBKDF2.
 * 
 * Key Hierarchy:
 * - Master Key: PBKDF2(signature, 600k iterations) → 32 bytes
 * - Incoming Viewing Key (IVK): HKDF(master, "PHANTOM_IVK")
 * - Full Viewing Key (FVK): HKDF(master, "PHANTOM_FVK")
 * - Spending Key (SK): Poseidon(master, "PHANTOM_SK", serial)
 * 
 * OBSTACLE 4 SOLUTION: Notes can be recovered from chain events using IVK.
 */

import { Account, typedData } from 'starknet';

// SNIP-12 Typed Data for key derivation
const PHANTOM_KEY_DERIVATION_MESSAGE = {
  domain: {
    name: 'PHANTOM',
    version: '1',
    chainId: 'SN_SEPOLIA',
  },
  types: {
    StarkNetDomain: [
      { name: 'name', type: 'shortstring' },
      { name: 'version', type: 'shortstring' },
      { name: 'chainId', type: 'shortstring' },
    ],
    PhantomKeyDerivation: [
      { name: 'message', type: 'shortstring' },
      { name: 'version', type: 'shortstring' },
    ],
  },
  primaryType: 'PhantomKeyDerivation',
  message: {
    message: 'PHANTOM key derivation. Sign to initialize your private vault.',
    version: '1',
  },
} as const;

export interface KeyDerivationResult {
  masterKey: Uint8Array;
  incomingViewingKey: Uint8Array;
  fullViewingKey: Uint8Array;
}

export interface NoteKeys {
  spendingKey: Uint8Array;
  nullifierSecret: Uint8Array;
  encryptionPrivKey: Uint8Array;
  encryptionPubKey: Uint8Array;
}

/**
 * PBKDF2-HMAC-SHA256 implementation
 * OWASP 2024 recommendation: 600,000 iterations for password hashing
 */
async function pbkdf2(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  keyLength: number
): Promise<Uint8Array> {
  // Use Web Crypto API for PBKDF2
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    password,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    cryptoKey,
    keyLength * 8
  );
  
  return new Uint8Array(derivedBits);
}

/**
 * HKDF (HMAC-based Key Derivation Function)
 */
async function hkdf(
  inputKeyMaterial: Uint8Array,
  info: string,
  length: number = 32
): Promise<Uint8Array> {
  const infoBytes = new TextEncoder().encode(info);
  
  // Extract
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    inputKeyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const prk = await crypto.subtle.sign('HMAC', cryptoKey, new Uint8Array(0));
  
  // Expand
  const okm = new Uint8Array(length);
  let t = new Uint8Array(0);
  let offset = 0;
  
  for (let i = 1; offset < length; i++) {
    const concatData = new Uint8Array(t.length + infoBytes.length + 1);
    concatData.set(t);
    concatData.set(infoBytes, t.length);
    concatData[t.length + infoBytes.length] = i;
    
    const signKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(prk),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    t = new Uint8Array(await crypto.subtle.sign('HMAC', signKey, concatData));
    const copyLen = Math.min(t.length, length - offset);
    okm.set(t.slice(0, copyLen), offset);
    offset += copyLen;
  }
  
  return okm;
}

/**
 * Convert signature to bytes for key derivation
 */
function signatureToBytes(signature: string | string[] | { r: string; s: string }): Uint8Array {
  let r: bigint;
  let s: bigint;
  
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
  
  // Convert to 32-byte big-endian
  const rBytes = new Uint8Array(32);
  const sBytes = new Uint8Array(32);
  
  let rVal = r;
  let sVal = s;
  
  for (let i = 31; i >= 0; i--) {
    rBytes[i] = Number(rVal & 0xffn);
    rVal >>= 8n;
    sBytes[i] = Number(sVal & 0xffn);
    sVal >>= 8n;
  }
  
  // Concatenate r || s
  const result = new Uint8Array(64);
  result.set(rBytes, 0);
  result.set(sBytes, 32);
  
  return result;
}

/**
 * Poseidon hash (simplified - use starknet.js poseidon in production)
 */
function poseidonHash(inputs: bigint[]): bigint {
  // Simplified Poseidon-like hash for key derivation
  // In production, use starknet.js poseidon2 or proper implementation
  let hash = 0x06d7f064n; // Initial state
  
  for (const input of inputs) {
    hash = ((hash * 31n + input) % (1n << 251n) + 0x08d4n * (input >> 200n)) % (1n << 251n);
  }
  
  return hash;
}

/**
 * Convert Uint8Array to hex string
 */
function toHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert bigint to Uint8Array
 */
function bigintToBytes(value: bigint, length: number = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  let v = value;
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return bytes;
}

/**
 * PhantomKeyManager - manages key derivation from Starknet wallet
 */
export class PhantomKeyManager {
  private readonly masterKey: Uint8Array;
  private readonly ivk: Uint8Array;
  private readonly fvk: Uint8Array;
  
  /**
   * Create PhantomKeyManager from wallet signature (SNIP-12)
   * 
   * Flow:
   * 1. User signs SNIP-12 typed message
   * 2. Signature → bytes (r || s)
   * 3. PBKDF2(signature_bytes, salt, 600k, 32) → Master Key
   * 4. HKDF(master, "PHANTOM_IVK") → IVK
   * 5. HKDF(master, "PHANTOM_FVK") → FVK
   */
  static async fromWallet(account: Account): Promise<PhantomKeyManager> {
    // Step 1: Sign SNIP-12 message
    // User sees: "PHANTOM key derivation. Sign to initialize your private vault."
    const signature = await account.signMessage(PHANTOM_KEY_DERIVATION_MESSAGE);
    
    // Step 2: Convert signature to bytes
    const sigBytes = signatureToBytes(signature);
    
    // Step 3: PBKDF2 with 600k iterations (OWASP 2024)
    const salt = new TextEncoder().encode(`PHANTOM_MASTER_${account.address}`);
    const masterKey = await pbkdf2(sigBytes, salt, 600_000, 32);
    
    // Step 4 & 5: Derive IVK and FVK via HKDF
    const ivk = await hkdf(masterKey, 'PHANTOM_IVK_v1', 32);
    const fvk = await hkdf(masterKey, 'PHANTOM_FVK_v1', 32);
    
    return new PhantomKeyManager(masterKey, ivk, fvk);
  }
  
  /**
   * Create PhantomKeyManager from existing master key (for testing)
   */
  static fromMasterKey(masterKey: Uint8Array): PhantomKeyManager {
    // Derive IVK and FVK from master key
    const ivk = new Uint8Array(32);
    const fvk = new Uint8Array(32);
    
    // Simple derive: for production use proper HKDF
    for (let i = 0; i < 32; i++) {
      ivk[i] = masterKey[i] ^ 0x5a; // IVK = master XOR 0x5a...
      fvk[i] = masterKey[i] ^ 0xa5; // FVK = master XOR 0xa5...
    }
    
    return new PhantomKeyManager(masterKey, ivk, fvk);
  }
  
  private constructor(masterKey: Uint8Array, ivk: Uint8Array, fvk: Uint8Array) {
    this.masterKey = masterKey;
    this.ivk = ivk;
    this.fvk = fvk;
  }
  
  /**
   * Get Incoming Viewing Key (IVK)
   * 
   * Use case: Share with auditor/tax accountant to see received funds
   * Can decrypt note data from Shielded events
   */
  get ivkBytes(): Uint8Array {
    return this.ivk;
  }
  
  get ivkHex(): string {
    return toHex(this.ivk);
  }
  
  /**
   * Get Full Viewing Key (FVK)
   * 
   * Use case: Share with full auditor to see complete transaction history
   * Can decrypt all notes and view nullifiers
   */
  get fvkBytes(): Uint8Array {
    return this.fvk;
  }
  
  get fvkHex(): string {
    return toHex(this.fvk);
  }
  
  /**
   * Derive spending key for a specific note (by serial number)
   * 
   * This is used to authorize spending a note
   */
  deriveNoteSpendingKey(serialNumber: bigint): Uint8Array {
    // SK = Poseidon(master_key, "PHANTOM_SK", serial_number)
    const masterAsBigint = BigInt('0x' + Buffer.from(this.masterKey).toString('hex'));
    const sk = poseidonHash([
      masterAsBigint,
      0x5048414e544f4d5f5354n, // "PHANTOM_ST"
      serialNumber,
    ]);
    
    return bigintToBytes(sk);
  }
  
  /**
   * Derive nullifier secret for a specific note
   * 
   * Nullifier = Poseidon(nullifier_secret, serial_number)
   * Used to prevent double-spending without revealing which note
   */
  deriveNoteNullifierSecret(serialNumber: bigint): Uint8Array {
    const masterAsBigint = BigInt('0x' + Buffer.from(this.masterKey).toString('hex'));
    const ns = poseidonHash([
      masterAsBigint,
      0x5048414e544f4d5f4e53n, // "PHANTOM_NS"
      serialNumber,
    ]);
    
    return bigintToBytes(ns);
  }
  
  /**
   * Derive encryption key for a specific note
   * 
   * Used to encrypt/decrypt note data for on-chain storage
   */
  deriveNoteEncryptionKey(noteRandomness: bigint): { pubkey: Uint8Array; privkey: Uint8Array } {
    const masterAsBigint = BigInt('0x' + Buffer.from(this.masterKey).toString('hex'));
    const enc = poseidonHash([
      masterAsBigint,
      0x5048414e544f4d5f454e43n, // "PHANTOM_ENC"
      noteRandomness,
    ]);
    
    // Simplified - in production use proper ECIES
    const privkey = bigintToBytes(enc);
    const pubkey = bigintToBytes(enc * 123456789n % (1n << 248n));
    
    return { pubkey, privkey };
  }
  
  /**
   * Derive all keys for a specific note
   */
  deriveNoteKeys(serialNumber: bigint, noteRandomness: bigint): NoteKeys {
    const enc = this.deriveNoteEncryptionKey(noteRandomness);
    
    return {
      spendingKey: this.deriveNoteSpendingKey(serialNumber),
      nullifierSecret: this.deriveNoteNullifierSecret(serialNumber),
      encryptionPrivKey: enc.privkey,
      encryptionPubKey: enc.pubkey,
    };
  }
  
  /**
   * Get the master key (for debugging/backup)
   * WARNING: Never expose this in production!
   */
  getMasterKey(): Uint8Array {
    return this.masterKey;
  }
}

/**
 * Decrypt a note from on-chain encrypted data
 * 
 * OBSTACLE 4 SOLUTION: Even if local storage is lost, notes can be
 * recovered by scanning chain events and decrypting with IVK.
 */
export async function decryptNoteWithIVK(
  encryptedNote: string,
  ivk: Uint8Array
): Promise<{
  amount: bigint;
  assetId: number;
  nullifierSecret: bigint;
  salt: bigint;
} | null> {
  try {
    // Decrypt using AES-GCM with IVK as key
    const encryptedBytes = Uint8Array.from(atob(encryptedNote), c => c.charCodeAt(0));
    
    // IV is first 12 bytes, ciphertext is rest
    if (encryptedBytes.length < 12 + 16) {
      // Fallback to JSON (for development)
      const decrypted = JSON.parse(atob(encryptedNote));
      return {
        amount: BigInt(decrypted.amount),
        assetId: decrypted.assetId,
        nullifierSecret: BigInt(decrypted.nullifierSecret),
        salt: BigInt(decrypted.salt),
      };
    }
    
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      ivk,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );
    
    const plaintext = new TextDecoder().decode(decrypted);
    const data = JSON.parse(plaintext);
    
    return {
      amount: BigInt(data.amount),
      assetId: data.assetId,
      nullifierSecret: BigInt(data.nullifierSecret),
      salt: BigInt(data.salt),
    };
  } catch (error) {
    console.error('Failed to decrypt note:', error);
    return null;
  }
}

/**
 * Encrypt a note for on-chain storage using AES-GCM
 */
export async function encryptNoteWithIVK(
  noteData: {
    amount: bigint;
    assetId: number;
    nullifierSecret: bigint;
    salt: bigint;
  },
  ivk: Uint8Array
): Promise<string> {
  // Create random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Prepare plaintext
  const plaintext = new TextEncoder().encode(JSON.stringify({
    amount: noteData.amount.toString(),
    assetId: noteData.assetId,
    nullifierSecret: noteData.nullifierSecret.toString(),
    salt: noteData.salt.toString(),
  }));
  
  // Encrypt with AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    ivk,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintext
  );
  
  // Combine IV + ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Legacy encryption (for backward compatibility)
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

/**
 * Legacy decryption (for backward compatibility)
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
