//! Jurisdiction Sub-Proof — Sanctions non-membership via Poseidon + Merkle
//!
//! Proves that a user's jurisdiction is NOT in a sanctions Merkle tree.
//! The jurisdiction ISO code is hashed with Poseidon, then checked for
//! non-membership against the sanctions tree root.

use crate::crypto::poseidon::{self, FieldElement};
use crate::crypto::merkle::{self, MerkleProof, MerkleTree};

/// Domain separator for jurisdiction hashing
const JURISDICTION_DOMAIN: u64 = 0x4E454F4E5F4A5552; // "NEON_JUR" in ASCII

/// Hash a jurisdiction ISO 3166-1 alpha-3 code into a field element
///
/// jurisdiction_hash = Poseidon(domain, code_as_field)
///
/// The ISO code (e.g. "USA", "BRA", "IRN") is packed into a u64 and then
/// domain-separated to prevent collisions with other circuit uses.
pub fn hash_jurisdiction(iso_code: &[u8; 3]) -> FieldElement {
    let domain_fe = FieldElement::from(JURISDICTION_DOMAIN);
    let code_val = (iso_code[0] as u64)
        | ((iso_code[1] as u64) << 8)
        | ((iso_code[2] as u64) << 16);
    let code_fe = FieldElement::from(code_val);
    poseidon::poseidon_hash(&domain_fe, &code_fe)
}

/// Sanctions Merkle tree containing hashed jurisdiction codes
#[derive(Debug, Clone)]
pub struct SanctionsList {
    tree: MerkleTree,
    /// Hashes of sanctioned jurisdictions (for lookup)
    sanctioned_hashes: Vec<FieldElement>,
}

impl SanctionsList {
    /// Build a sanctions list from ISO 3166-1 alpha-3 codes
    pub fn from_codes(codes: &[[u8; 3]]) -> Self {
        let mut tree = MerkleTree::new();
        let mut sanctioned_hashes = Vec::with_capacity(codes.len());

        for code in codes {
            let h = hash_jurisdiction(code);
            sanctioned_hashes.push(h);
            tree.append(h);
        }

        SanctionsList {
            tree,
            sanctioned_hashes,
        }
    }

    /// Get the Merkle root of the sanctions tree
    pub fn root(&self) -> FieldElement {
        self.tree.root()
    }

    /// Check if a jurisdiction hash is in the sanctions list
    pub fn contains(&self, jurisdiction_hash: &FieldElement) -> bool {
        self.sanctioned_hashes.contains(jurisdiction_hash)
    }

    /// Get inclusion proof for a sanctioned jurisdiction (used internally for testing)
    pub fn get_inclusion_proof(&self, index: usize) -> Option<MerkleProof> {
        self.tree.get_proof(index)
    }

    /// Number of sanctioned jurisdictions
    pub fn len(&self) -> usize {
        self.sanctioned_hashes.len()
    }

    /// Whether the sanctions list is empty
    pub fn is_empty(&self) -> bool {
        self.sanctioned_hashes.is_empty()
    }
}

/// Witness for jurisdiction proof (private inputs)
#[derive(Debug, Clone)]
pub struct JurisdictionWitness {
    /// User's jurisdiction ISO code (3 bytes, e.g. b"USA")
    pub jurisdiction_code: [u8; 3],
    /// Salt for the user's jurisdiction commitment
    pub salt: FieldElement,
}

/// Public inputs for jurisdiction proof
#[derive(Debug, Clone)]
pub struct JurisdictionPublicInputs {
    /// Poseidon commitment to user's jurisdiction: Poseidon(jurisdiction_hash, salt)
    pub jurisdiction_commitment: FieldElement,
    /// Root of the sanctions Merkle tree (published by regulator)
    pub sanctions_merkle_root: FieldElement,
}

/// Jurisdiction proof output
#[derive(Debug, Clone)]
pub struct JurisdictionProof {
    pub public_inputs: JurisdictionPublicInputs,
    pub proof_valid: bool,
}

/// Compute jurisdiction commitment: Poseidon(jurisdiction_hash, salt)
///
/// This commits to the jurisdiction without revealing the code.
pub fn compute_jurisdiction_commitment(
    jurisdiction_code: &[u8; 3],
    salt: &FieldElement,
) -> FieldElement {
    let j_hash = hash_jurisdiction(jurisdiction_code);
    poseidon::poseidon_hash(&j_hash, salt)
}

/// Prove jurisdiction non-membership in sanctions list
///
/// Circuit logic:
///   1. Compute jurisdiction_hash = hash_jurisdiction(code)
///   2. Compute commitment = Poseidon(jurisdiction_hash, salt)
///   3. Assert commitment == public jurisdiction_commitment
///   4. Assert jurisdiction_hash is NOT in the sanctions Merkle tree
///
/// Non-membership is proven by checking that the jurisdiction hash
/// does not appear in the sanctioned set. In a full ZK system this
/// would use a sorted Merkle tree with non-membership witnesses;
/// here we verify against the known sanctions list.
pub fn prove_jurisdiction(
    witness: &JurisdictionWitness,
    public_inputs: &JurisdictionPublicInputs,
    sanctions_list: &SanctionsList,
) -> Result<JurisdictionProof, String> {
    // Constraint 1: Compute jurisdiction hash
    let j_hash = hash_jurisdiction(&witness.jurisdiction_code);

    // Constraint 2: Verify commitment matches
    let recomputed_commitment = poseidon::poseidon_hash(&j_hash, &witness.salt);
    if recomputed_commitment != public_inputs.jurisdiction_commitment {
        return Err("Jurisdiction commitment mismatch".to_string());
    }

    // Constraint 3: Verify sanctions root matches
    if sanctions_list.root() != public_inputs.sanctions_merkle_root {
        return Err("Sanctions Merkle root mismatch".to_string());
    }

    // Constraint 4: Prove non-membership — jurisdiction must NOT be sanctioned
    if sanctions_list.contains(&j_hash) {
        return Err("Jurisdiction is in sanctions list".to_string());
    }

    Ok(JurisdictionProof {
        public_inputs: public_inputs.clone(),
        proof_valid: true,
    })
}

/// Verify a jurisdiction proof
pub fn verify_jurisdiction_proof(proof: &JurisdictionProof) -> bool {
    proof.proof_valid
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_sanctions() -> SanctionsList {
        SanctionsList::from_codes(&[
            *b"IRN", // Iran
            *b"PRK", // North Korea
            *b"SYR", // Syria
            *b"CUB", // Cuba
            *b"RUS", // Russia
        ])
    }

    #[test]
    fn test_hash_jurisdiction_deterministic() {
        let h1 = hash_jurisdiction(b"USA");
        let h2 = hash_jurisdiction(b"USA");
        assert_eq!(h1, h2);
    }

    #[test]
    fn test_hash_jurisdiction_different_codes() {
        let h1 = hash_jurisdiction(b"USA");
        let h2 = hash_jurisdiction(b"BRA");
        assert_ne!(h1, h2);
    }

    #[test]
    fn test_sanctions_list_contains() {
        let list = sample_sanctions();
        let iran = hash_jurisdiction(b"IRN");
        let brazil = hash_jurisdiction(b"BRA");
        assert!(list.contains(&iran));
        assert!(!list.contains(&brazil));
    }

    #[test]
    fn test_sanctions_list_root_nonzero() {
        let list = sample_sanctions();
        assert_ne!(list.root(), FieldElement::ZERO);
    }

    #[test]
    fn test_jurisdiction_commitment() {
        let salt = FieldElement::from(42u64);
        let c1 = compute_jurisdiction_commitment(b"BRA", &salt);
        let c2 = compute_jurisdiction_commitment(b"BRA", &salt);
        assert_eq!(c1, c2);

        let c3 = compute_jurisdiction_commitment(b"USA", &salt);
        assert_ne!(c1, c3);
    }

    #[test]
    fn test_prove_jurisdiction_valid() {
        let sanctions = sample_sanctions();
        let salt = FieldElement::from(7777u64);

        let commitment = compute_jurisdiction_commitment(b"BRA", &salt);
        let witness = JurisdictionWitness {
            jurisdiction_code: *b"BRA",
            salt,
        };
        let public = JurisdictionPublicInputs {
            jurisdiction_commitment: commitment,
            sanctions_merkle_root: sanctions.root(),
        };

        let proof = prove_jurisdiction(&witness, &public, &sanctions)
            .expect("Brazil should pass sanctions check");
        assert!(verify_jurisdiction_proof(&proof));
    }

    #[test]
    fn test_prove_jurisdiction_sanctioned() {
        let sanctions = sample_sanctions();
        let salt = FieldElement::from(7777u64);

        let commitment = compute_jurisdiction_commitment(b"IRN", &salt);
        let witness = JurisdictionWitness {
            jurisdiction_code: *b"IRN",
            salt,
        };
        let public = JurisdictionPublicInputs {
            jurisdiction_commitment: commitment,
            sanctions_merkle_root: sanctions.root(),
        };

        assert!(prove_jurisdiction(&witness, &public, &sanctions).is_err());
    }

    #[test]
    fn test_prove_jurisdiction_wrong_commitment() {
        let sanctions = sample_sanctions();
        let witness = JurisdictionWitness {
            jurisdiction_code: *b"BRA",
            salt: FieldElement::from(111u64),
        };
        let public = JurisdictionPublicInputs {
            jurisdiction_commitment: FieldElement::from(999u64), // wrong
            sanctions_merkle_root: sanctions.root(),
        };

        assert!(prove_jurisdiction(&witness, &public, &sanctions).is_err());
    }

    #[test]
    fn test_prove_jurisdiction_wrong_root() {
        let sanctions = sample_sanctions();
        let salt = FieldElement::from(7777u64);
        let commitment = compute_jurisdiction_commitment(b"BRA", &salt);

        let witness = JurisdictionWitness {
            jurisdiction_code: *b"BRA",
            salt,
        };
        let public = JurisdictionPublicInputs {
            jurisdiction_commitment: commitment,
            sanctions_merkle_root: FieldElement::from(1u64), // wrong root
        };

        assert!(prove_jurisdiction(&witness, &public, &sanctions).is_err());
    }
}
