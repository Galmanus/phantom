/**
 * Phantom Key Derivation - Frontend version for wallet integration
 * 
 * Simplified version of the SDK key derivation for use in the frontend.
 * This mirrors the SDK's PhantomKeyManager but adapted for frontend use.
 */

// Domain constants
const DOMAIN_IVK = "PHANTOM_IVK";
const DOMAIN_FVK = "PHANTOM_FVK";

/**
 * Simple Poseidon-like hash
 */
function poseidonHash(values: bigint[]): bigint {
  let hash = values[0] || 0n;
  for (let i = 1; i < values.length; i++) {
    hash = (hash * 31n + values[i]) % (1n << 251n);
  }
  return hash;
}

/**
 * Domain separator
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

/**
 * PhantomKeyManager for frontend - derives keys from wallet address
 * 
 * In production: would use actual wallet signature via SNIP-12
 * For demo: uses wallet address as deterministic seed
 */
export class PhantomKeyManager {
  private masterKey: bigint;
  private incomingViewingKey: bigint;
  private fullViewingKey: bigint;

  private constructor(masterKey: bigint, incomingViewingKey: bigint, fullViewingKey: bigint) {
    this.masterKey = masterKey;
    this.incomingViewingKey = incomingViewingKey;
    this.fullViewingKey = fullViewingKey;
  }

  /**
   * Create key manager from wallet address (demo version)
   * In production: would use wallet signature via signMessage()
   */
  static fromSignature(address: string, chainId: string): PhantomKeyManager {
    // Use address as deterministic seed for demo
    const addressNum = BigInt(address);
    const chainNum = BigInt(parseInt(chainId.replace("0x", ""), 16) || 0);
    
    // Derive master key
    const masterKey = poseidonHash([addressNum, chainNum, 12345n]);
    
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

  getIncomingViewingKey(): bigint {
    return this.incomingViewingKey;
  }

  getFullViewingKey(): bigint {
    return this.fullViewingKey;
  }

  /**
   * Derive spending key for a note
   */
  deriveSpendingKey(serialNumber: bigint): bigint {
    return poseidonHash([this.masterKey, BigInt(0x505348414e544f4d5f534b), serialNumber]);
  }

  /**
   * Derive nullifier secret for a note
   */
  deriveNullifierSecret(serialNumber: bigint): bigint {
    return poseidonHash([this.masterKey, BigInt(0x5048414e544f4d5f56315f4e554c4c49464552), serialNumber]);
  }
}
