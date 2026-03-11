/**
 * Encryption utilities for PHANTOM SDK
 */
/**
 * Derive AES-GCM encryption key from password
 */
export declare function deriveEncryptionKey(password: string, salt?: Uint8Array): Promise<{
    key: CryptoKey;
    salt: Uint8Array;
}>;
/**
 * Encrypt data using AES-GCM
 */
export declare function encrypt(data: string | Uint8Array, key: CryptoKey): Promise<{
    ciphertext: Uint8Array;
    iv: Uint8Array;
}>;
/**
 * Decrypt data using AES-GCM
 */
export declare function decrypt(ciphertext: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<string>;
/**
 * Generate cryptographically secure random bytes
 */
export declare function generateRandomBytes(length: number): Uint8Array;
/**
 * Generate a random field element (hex string)
 */
export declare function generateRandomFieldElement(): string;
/**
 * Hash data using SHA-256
 */
export declare function sha256(data: Uint8Array): Promise<Uint8Array>;
/**
 * Convert Uint8Array to hex string
 */
export declare function toHex(bytes: Uint8Array): string;
/**
 * Convert hex string to Uint8Array
 */
export declare function fromHex(hex: string): Uint8Array;
//# sourceMappingURL=encryption.d.ts.map