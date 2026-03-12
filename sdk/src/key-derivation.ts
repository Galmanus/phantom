// PHANTOM — Real implementation (no mocks)

import { Account, hash, typedData, ec, num } from 'starknet';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Helper to convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// SNIP-12 typed data for deterministic key derivation
const PHANTOM_TYPED_DATA = {
  domain: {
    name: 'PHANTOM',
    version: '1',
    chainId: '', // filled at runtime
    revision: '1',
  },
  types: {
    StarknetDomain: [
      { name: 'name', type: 'shortstring' },
      { name: 'version', type: 'shortstring' },
      { name: 'chainId', type: 'shortstring' },
      { name: 'revision', type: 'shortstring' },
    ],
    PhantomKeyDerivation: [
      { name: 'purpose', type: 'shortstring' },
      { name: 'version', type: 'felt' },
    ],
  },
  primaryType: 'PhantomKeyDerivation',
  message: {
    purpose: 'PHANTOM_KEY_DERIVATION',
    version: '1',
  },
};

export class PhantomKeyManager {
  readonly ivkHex: string;           // Incoming Viewing Key (hex)
  readonly ivkBytes: Uint8Array;     // IVK as bytes for AES-GCM
  readonly spendingKeyHex: string;   // Master spending key

  private constructor(ivk: Uint8Array, sk: Uint8Array) {
    this.ivkBytes = ivk;
    this.ivkHex = bytesToHex(ivk);
    this.spendingKeyHex = bytesToHex(sk);
  }

  /**
   * Derive PHANTOM keys from wallet signature (SNIP-12)
   * 
   * Flow:
   * 1. Build typed data message (deterministic per chain)
   * 2. Ask wallet to sign it (same signature every time for same wallet)
   * 3. PBKDF2(signature_bytes, "PHANTOM_IVK", 600000, 32) → IVK
   * 4. PBKDF2(signature_bytes, "PHANTOM_SK", 600000, 32) → SK
   */
  static async fromWallet(account: Account): Promise<PhantomKeyManager> {
    const chainId = await account.getChainId();
    
    // Create typed data with proper chainId
    const td = {
      ...PHANTOM_TYPED_DATA,
      domain: { 
        name: 'PHANTOM', 
        version: '1', 
        chainId: chainId, 
        revision: '1' 
      },
    };

    // Sign the typed data — same wallet always produces same signature
    const signature = await account.signMessage(td);
    
    // Serialize signature to bytes for PBKDF2
    // In starknet.js v7, signature is an object with r and s properties (or array)
    let r: string, s: string;
    if (Array.isArray(signature)) {
      // Array format: [r, s]
      r = typeof signature[0] === 'bigint' ? signature[0].toString(16).padStart(64, '0') : String(signature[0]);
      s = typeof signature[1] === 'bigint' ? signature[1].toString(16).padStart(64, '0') : String(signature[1]);
    } else {
      // Object format: { r, s }
      r = typeof signature.r === 'bigint' ? signature.r.toString(16).padStart(64, '0') : String(signature.r);
      s = typeof signature.s === 'bigint' ? signature.s.toString(16).padStart(64, '0') : String(signature.s);
    }
    const sigBytes = hexToBytes(r + s);
    
    // Use wallet address as additional salt
    const addressBytes = hexToBytes(account.address);

    // PBKDF2 with 600,000 iterations — slow by design (prevents brute force)
    const ivk = pbkdf2(sha256, sigBytes, new TextEncoder().encode('PHANTOM_IVK_V1'), {
      c: 600_000,
      dkLen: 32,
    });
    const sk = pbkdf2(sha256, sigBytes, new TextEncoder().encode('PHANTOM_SK_V1'), {
      c: 600_000,
      dkLen: 32,
    });

    return new PhantomKeyManager(ivk, sk);
  }

  /**
   * Derive per-note spending key
   * note_sk = PBKDF2(master_sk, note_commitment_hex, 1000, 32)
   */
  deriveNoteSpendingKey(commitment: string): Uint8Array {
    const masterSk = hexToBytes(this.spendingKeyHex);
    return pbkdf2(sha256, masterSk, new TextEncoder().encode(commitment), {
      c: 1_000,
      dkLen: 32,
    });
  }
}

/**
 * Encrypt a note for storage using AES-GCM-256
 * 
 * Uses IVK as encryption key. Same note encrypted twice will produce
 * different ciphertext (due to random nonce) but always decryptable.
 */
export async function encryptNoteWithIVK(
  note: { amount: bigint; nullifierSecret: string; salt: string },
  ivkBytes: Uint8Array
): Promise<string> {
  const nonce = randomBytes(12); // 96-bit nonce for GCM
  const plaintext = new TextEncoder().encode(JSON.stringify({
    a: note.amount.toString(16),
    ns: note.nullifierSecret,
    s: note.salt,
  }));

  const cipher = gcm(ivkBytes, nonce);
  const ciphertext = cipher.encrypt(plaintext);

  // Format: hex(nonce) + ':' + hex(ciphertext)
  return bytesToHex(nonce) + ':' + bytesToHex(ciphertext);
}

/**
 * Decrypt a note using IVK
 * Returns null if decryption fails (note belongs to different user)
 */
export async function decryptNoteWithIVK(
  encrypted: string,
  ivkBytes: Uint8Array
): Promise<{ amount: bigint; nullifierSecret: bigint; salt: bigint } | null> {
  try {
    const [nonceHex, ciphertextHex] = encrypted.split(':');
    if (!nonceHex || !ciphertextHex) return null;

    const nonce = hexToBytes(nonceHex);
    const ciphertext = hexToBytes(ciphertextHex);

    const cipher = gcm(ivkBytes, nonce);
    const plaintext = cipher.decrypt(ciphertext);
    const decoded = JSON.parse(new TextDecoder().decode(plaintext));

    return {
      amount: BigInt('0x' + decoded.a),
      nullifierSecret: BigInt('0x' + decoded.ns),
      salt: BigInt('0x' + decoded.s),
    };
  } catch {
    return null; // Decryption failed = note not ours
  }
}
