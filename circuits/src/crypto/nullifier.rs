//! Nullifier derivation for PHANTOM
//! 
//! Nullifiers prevent double-spending by uniquely identifying
//! when a note is spent, without revealing which note.

use super::poseidon::{FieldElement, poseidon_hash_3};

/// Domain separator for nullifier derivation
/// ASCII encoding of "PHANTOM_V1_NULLIFIER" as felt252
pub const NULLIFIER_DOMAIN: FieldElement = FieldElement([
    0x5048414e544f4d5f, // "PHANTOM_"
    0x56315f4e554c4c49, // "V1_NULLI"
    0x4649455200000000, // "FIER\0\0\0\0"
    0x0000000000000000, // padding
]);

/// Derive nullifier from nullifier secret and serial number
/// 
/// nullifier = Poseidon(nullifier_secret, DOMAIN_SEP, serial_number)
/// 
/// This ensures:
/// - Each note has a unique nullifier (via serial_number)
/// - Nullifier cannot be linked to the note without the secret
/// - Same nullifier secret + serial number always produces same nullifier
pub fn derive_nullifier(
    nullifier_secret: &FieldElement,
    serial_number: &FieldElement,
) -> FieldElement {
    poseidon_hash_3(
        nullifier_secret,
        &NULLIFIER_DOMAIN,
        serial_number,
    )
}

/// Derive a unique serial number for a note
/// 
/// Uses Poseidon(nullifier_secret, random_salt) to create
/// a unique identifier that cannot be linked to the note
pub fn derive_serial_number(
    nullifier_secret: &FieldElement,
    salt: &FieldElement,
) -> FieldElement {
    super::poseidon::poseidon_hash(nullifier_secret, salt)
}

/// Verify that a nullifier was correctly derived
/// 
/// Returns true if the nullifier matches the expected derivation
pub fn verify_nullifier_derivation(
    nullifier: &FieldElement,
    nullifier_secret: &FieldElement,
    serial_number: &FieldElement,
) -> bool {
    let expected = derive_nullifier(nullifier_secret, serial_number);
    nullifier.0 == expected.0
}

/// Generate a random nullifier secret
/// 
/// In production, this should use a cryptographically secure RNG
#[cfg(feature = "std")]
pub fn generate_nullifier_secret() -> FieldElement {
    use rand::RngCore;
    
    let mut rng = rand::thread_rng();
    let mut bytes = [0u8; 32];
    rng.fill_bytes(&mut bytes);
    
    // Convert to field element (simplified - should reduce mod prime)
    let mut limbs = [0u64; 4];
    for (i, chunk) in bytes.chunks(8).enumerate() {
        limbs[i] = u64::from_le_bytes(chunk.try_into().unwrap());
    }
    
    FieldElement(limbs)
}

/// Generate a random salt
#[cfg(feature = "std")]
pub fn generate_salt() -> FieldElement {
    generate_nullifier_secret()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_nullifier_derivation() {
        let secret = FieldElement::from_u64(12345);
        let serial = FieldElement::from_u64(67890);
        
        let nullifier = derive_nullifier(&secret, &serial);
        assert_ne!(nullifier, FieldElement::ZERO);
        assert_ne!(nullifier, secret);
        assert_ne!(nullifier, serial);
    }
    
    #[test]
    fn test_nullifier_deterministic() {
        let secret = FieldElement::from_u64(12345);
        let serial = FieldElement::from_u64(67890);
        
        let nullifier1 = derive_nullifier(&secret, &serial);
        let nullifier2 = derive_nullifier(&secret, &serial);
        
        assert_eq!(nullifier1, nullifier2);
    }
    
    #[test]
    fn test_nullifier_different_inputs() {
        let secret = FieldElement::from_u64(12345);
        let serial1 = FieldElement::from_u64(67890);
        let serial2 = FieldElement::from_u64(11111);
        
        let nullifier1 = derive_nullifier(&secret, &serial1);
        let nullifier2 = derive_nullifier(&secret, &serial2);
        
        assert_ne!(nullifier1, nullifier2);
    }
    
    #[test]
    fn test_nullifier_verification() {
        let secret = FieldElement::from_u64(12345);
        let serial = FieldElement::from_u64(67890);
        let nullifier = derive_nullifier(&secret, &serial);
        
        assert!(verify_nullifier_derivation(&nullifier, &secret, &serial));
        
        let wrong_secret = FieldElement::from_u64(99999);
        assert!(!verify_nullifier_derivation(&nullifier, &wrong_secret, &serial));
    }
    
    #[test]
    fn test_serial_number_derivation() {
        let secret = FieldElement::from_u64(12345);
        let salt = FieldElement::from_u64(67890);
        
        let serial = derive_serial_number(&secret, &salt);
        assert_ne!(serial, FieldElement::ZERO);
        assert_ne!(serial, secret);
        assert_ne!(serial, salt);
    }
}
