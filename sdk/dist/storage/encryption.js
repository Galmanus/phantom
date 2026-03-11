/**
 * Encryption utilities for PHANTOM SDK
 */
// PBKDF2 parameters
const PBKDF2_ITERATIONS = 600000;
/**
 * Derive AES-GCM encryption key from password
 */
export async function deriveEncryptionKey(password, salt) {
    const saltBytes = salt || crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { key, salt: saltBytes };
}
/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    return {
        ciphertext: new Uint8Array(ciphertext),
        iv,
    };
}
/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(ciphertext, iv, key) {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}
/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
}
/**
 * Generate a random field element (hex string)
 */
export function generateRandomFieldElement() {
    const bytes = generateRandomBytes(32);
    // Clear the top 3 bits to ensure it's within the Starknet prime field
    bytes[0] &= 0x07;
    const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return '0x' + hex.replace(/^0+/, '') || '0x0';
}
/**
 * Hash data using SHA-256
 */
export async function sha256(data) {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
}
/**
 * Convert Uint8Array to hex string
 */
export function toHex(bytes) {
    return '0x' + Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
    }
    return bytes;
}
//# sourceMappingURL=encryption.js.map