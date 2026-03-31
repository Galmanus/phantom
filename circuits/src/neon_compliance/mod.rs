//! NEON Compliance Module — ZK bridge between NEON Covenant and MIDAS
//!
//! Provides composite compliance proofs using Poseidon commitments and
//! Merkle trees. Three sub-proofs compose into a single compliance bundle:
//!
//!   - **Age proof**: Proves age >= minimum without revealing age
//!   - **Jurisdiction proof**: Proves non-membership in sanctions Merkle tree
//!   - **Accreditation proof**: Proves investor qualification level
//!
//! Compliance levels control which sub-proofs are required:
//!   - BASIC: age only
//!   - STANDARD: age + jurisdiction
//!   - ENHANCED: all three
//!
//! The composite compliance commitment is:
//!   Poseidon(age_commitment, jurisdiction_hash, accreditation_level, salt)

pub mod age_proof;
pub mod jurisdiction_proof;
pub mod accreditation_proof;

use crate::crypto::poseidon::{self, FieldElement};
use crate::crypto::merkle::MerkleTree;

use age_proof::{AgeWitness, AgePublicInputs, AgeProof};
use jurisdiction_proof::{
    JurisdictionWitness, JurisdictionPublicInputs, JurisdictionProof, SanctionsList,
};
use accreditation_proof::{
    AccreditationLevel, AccreditationWitness, AccreditationPublicInputs, AccreditationProof,
};

/// Domain separator for composite compliance commitments
const COMPLIANCE_DOMAIN: u64 = 0x4E454F4E5F434D50; // "NEON_CMP" in ASCII

/// Domain separator for compliance nullifiers
const COMPLIANCE_NULLIFIER_DOMAIN: u64 = 0x4E454F4E5F434E4C; // "NEON_CNL" in ASCII

// ── Compliance Levels ──────────────────────────────────────────────

/// Compliance levels determine which sub-proofs are required
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u8)]
pub enum ComplianceLevel {
    /// Age verification only
    Basic = 1,
    /// Age + jurisdiction screening
    Standard = 2,
    /// Age + jurisdiction + accreditation
    Enhanced = 3,
}

impl ComplianceLevel {
    pub fn from_u8(val: u8) -> Option<Self> {
        match val {
            1 => Some(ComplianceLevel::Basic),
            2 => Some(ComplianceLevel::Standard),
            3 => Some(ComplianceLevel::Enhanced),
            _ => None,
        }
    }

    /// Whether this level requires age proof
    pub fn requires_age(&self) -> bool {
        true // all levels require age
    }

    /// Whether this level requires jurisdiction proof
    pub fn requires_jurisdiction(&self) -> bool {
        matches!(self, ComplianceLevel::Standard | ComplianceLevel::Enhanced)
    }

    /// Whether this level requires accreditation proof
    pub fn requires_accreditation(&self) -> bool {
        matches!(self, ComplianceLevel::Enhanced)
    }
}

// ── Composite Compliance Commitment ────────────────────────────────

/// Compute composite compliance commitment:
///   Poseidon(domain, age_commitment, jurisdiction_hash, accreditation_level, salt)
///
/// This single commitment binds all compliance attributes together.
pub fn compute_compliance_commitment(
    age_commitment: &FieldElement,
    jurisdiction_hash: &FieldElement,
    accreditation_level: AccreditationLevel,
    salt: &FieldElement,
) -> FieldElement {
    let domain_fe = FieldElement::from(COMPLIANCE_DOMAIN);
    let level_fe = FieldElement::from(accreditation_level.as_u64());

    // Poseidon(domain, age_commitment, jurisdiction_hash, level, salt)
    let h1 = poseidon::poseidon_hash(&domain_fe, age_commitment);
    let h2 = poseidon::poseidon_hash(&h1, jurisdiction_hash);
    let h3 = poseidon::poseidon_hash(&h2, &level_fe);
    poseidon::poseidon_hash(&h3, salt)
}

// ── Compliance Nullifier ───────────────────────────────────────────

/// Derive a compliance nullifier to prevent reuse of expired proofs.
///
/// nullifier = Poseidon(COMPLIANCE_NULLIFIER_DOMAIN, secret, expiry_timestamp)
///
/// Once a compliance proof expires, the nullifier is published on-chain
/// to prevent the old proof from being replayed.
pub fn derive_compliance_nullifier(
    compliance_secret: &FieldElement,
    expiry_timestamp: u64,
) -> FieldElement {
    let domain_fe = FieldElement::from(COMPLIANCE_NULLIFIER_DOMAIN);
    let expiry_fe = FieldElement::from(expiry_timestamp);
    poseidon::poseidon_hash_3(&domain_fe, compliance_secret, &expiry_fe)
}

/// Verify that a compliance nullifier matches expected derivation
pub fn verify_compliance_nullifier(
    nullifier: &FieldElement,
    compliance_secret: &FieldElement,
    expiry_timestamp: u64,
) -> bool {
    let expected = derive_compliance_nullifier(compliance_secret, expiry_timestamp);
    nullifier == &expected
}

// ── Compliance Merkle Root ─────────────────────────────────────────

/// Generate a compliance Merkle root for on-chain registration.
///
/// Takes a set of compliance commitments and builds a Merkle tree.
/// The root is registered on-chain so verifiers can check membership.
pub fn build_compliance_merkle_tree(commitments: &[FieldElement]) -> MerkleTree {
    let mut tree = MerkleTree::new();
    for commitment in commitments {
        tree.append(*commitment);
    }
    tree
}

// ── Composite Proof Bundle ─────────────────────────────────────────

/// Complete witness for a NEON compliance proof
#[derive(Debug, Clone)]
pub struct NeonComplianceWitness {
    /// Age sub-proof witness
    pub age: AgeWitness,
    /// Jurisdiction sub-proof witness (None for BASIC level)
    pub jurisdiction: Option<JurisdictionWitness>,
    /// Accreditation sub-proof witness (None for BASIC/STANDARD)
    pub accreditation: Option<AccreditationWitness>,
    /// Salt for the composite commitment
    pub compliance_salt: FieldElement,
    /// Secret for nullifier derivation
    pub compliance_secret: FieldElement,
    /// Expiry timestamp (Unix seconds)
    pub expiry_timestamp: u64,
}

/// Public inputs for the composite compliance proof
#[derive(Debug, Clone)]
pub struct NeonCompliancePublicInputs {
    /// Composite compliance commitment
    pub compliance_commitment: FieldElement,
    /// Required compliance level
    pub compliance_level: ComplianceLevel,
    /// Age public inputs
    pub age: AgePublicInputs,
    /// Jurisdiction public inputs (None for BASIC)
    pub jurisdiction: Option<JurisdictionPublicInputs>,
    /// Accreditation public inputs (None for BASIC/STANDARD)
    pub accreditation: Option<AccreditationPublicInputs>,
    /// Compliance nullifier (published when proof expires)
    pub nullifier: FieldElement,
}

/// Composite NEON compliance proof bundle
#[derive(Debug, Clone)]
pub struct NeonComplianceProof {
    pub public_inputs: NeonCompliancePublicInputs,
    pub age_proof: AgeProof,
    pub jurisdiction_proof: Option<JurisdictionProof>,
    pub accreditation_proof: Option<AccreditationProof>,
    pub proof_valid: bool,
}

/// NEON Compliance Circuit — composes sub-proofs into a single bundle
#[derive(Debug, Clone)]
pub struct NeonComplianceCircuit {
    pub compliance_level: ComplianceLevel,
}

impl NeonComplianceCircuit {
    pub fn new(compliance_level: ComplianceLevel) -> Self {
        NeonComplianceCircuit { compliance_level }
    }

    /// Generate composite compliance proof
    ///
    /// Depending on compliance_level, this will:
    ///   BASIC:    prove age only
    ///   STANDARD: prove age + jurisdiction
    ///   ENHANCED: prove age + jurisdiction + accreditation
    pub fn prove(
        &self,
        witness: &NeonComplianceWitness,
        public_inputs: &NeonCompliancePublicInputs,
        sanctions_list: Option<&SanctionsList>,
    ) -> Result<NeonComplianceProof, String> {
        // Validate compliance level matches
        if public_inputs.compliance_level != self.compliance_level {
            return Err("Compliance level mismatch".to_string());
        }

        // ── Sub-proof 1: Age (always required) ──
        let age_proof = age_proof::prove_age(&witness.age, &public_inputs.age)?;

        // ── Sub-proof 2: Jurisdiction (STANDARD and ENHANCED) ──
        let jurisdiction_proof = if self.compliance_level.requires_jurisdiction() {
            let j_witness = witness.jurisdiction.as_ref()
                .ok_or("Jurisdiction witness required for STANDARD/ENHANCED compliance")?;
            let j_public = public_inputs.jurisdiction.as_ref()
                .ok_or("Jurisdiction public inputs required for STANDARD/ENHANCED compliance")?;
            let sanctions = sanctions_list
                .ok_or("Sanctions list required for jurisdiction proof")?;

            let proof = jurisdiction_proof::prove_jurisdiction(j_witness, j_public, sanctions)?;
            Some(proof)
        } else {
            None
        };

        // ── Sub-proof 3: Accreditation (ENHANCED only) ──
        let accreditation_proof = if self.compliance_level.requires_accreditation() {
            let a_witness = witness.accreditation.as_ref()
                .ok_or("Accreditation witness required for ENHANCED compliance")?;
            let a_public = public_inputs.accreditation.as_ref()
                .ok_or("Accreditation public inputs required for ENHANCED compliance")?;

            let proof = accreditation_proof::prove_accreditation(a_witness, a_public)?;
            Some(proof)
        } else {
            None
        };

        // ── Verify composite commitment ──
        let age_commitment = public_inputs.age.commitment;
        let jurisdiction_hash = if let Some(ref j_pub) = public_inputs.jurisdiction {
            j_pub.jurisdiction_commitment
        } else {
            FieldElement::ZERO
        };
        let accreditation_level = if let Some(ref a_pub) = public_inputs.accreditation {
            a_pub.required_level
        } else {
            AccreditationLevel::Retail
        };

        let expected_commitment = compute_compliance_commitment(
            &age_commitment,
            &jurisdiction_hash,
            accreditation_level,
            &witness.compliance_salt,
        );

        if expected_commitment != public_inputs.compliance_commitment {
            return Err("Composite compliance commitment mismatch".to_string());
        }

        // ── Verify nullifier ──
        let expected_nullifier = derive_compliance_nullifier(
            &witness.compliance_secret,
            witness.expiry_timestamp,
        );

        if expected_nullifier != public_inputs.nullifier {
            return Err("Compliance nullifier mismatch".to_string());
        }

        Ok(NeonComplianceProof {
            public_inputs: public_inputs.clone(),
            age_proof,
            jurisdiction_proof,
            accreditation_proof,
            proof_valid: true,
        })
    }

    /// Verify a composite compliance proof
    pub fn verify(proof: &NeonComplianceProof) -> bool {
        if !proof.proof_valid {
            return false;
        }

        // Verify age sub-proof
        if !age_proof::verify_age_proof(&proof.age_proof) {
            return false;
        }

        // Verify jurisdiction sub-proof if present
        if let Some(ref j_proof) = proof.jurisdiction_proof {
            if !jurisdiction_proof::verify_jurisdiction_proof(j_proof) {
                return false;
            }
        }

        // Verify accreditation sub-proof if present
        if let Some(ref a_proof) = proof.accreditation_proof {
            if !accreditation_proof::verify_accreditation_proof(a_proof) {
                return false;
            }
        }

        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_basic_witness_and_public() -> (NeonComplianceWitness, NeonCompliancePublicInputs) {
        let age = 25u64;
        let age_randomizer = FieldElement::from(111u64);
        let age_commitment = age_proof::compute_age_commitment(age, &age_randomizer);

        let compliance_salt = FieldElement::from(999u64);
        let compliance_secret = FieldElement::from(888u64);
        let expiry = 1700000000u64;

        let composite = compute_compliance_commitment(
            &age_commitment.commitment,
            &FieldElement::ZERO,
            AccreditationLevel::Retail,
            &compliance_salt,
        );

        let nullifier = derive_compliance_nullifier(&compliance_secret, expiry);

        let witness = NeonComplianceWitness {
            age: AgeWitness { age, randomizer: age_randomizer },
            jurisdiction: None,
            accreditation: None,
            compliance_salt,
            compliance_secret,
            expiry_timestamp: expiry,
        };

        let public = NeonCompliancePublicInputs {
            compliance_commitment: composite,
            compliance_level: ComplianceLevel::Basic,
            age: AgePublicInputs {
                commitment: age_commitment.commitment,
                minimum_age: 18,
            },
            jurisdiction: None,
            accreditation: None,
            nullifier,
        };

        (witness, public)
    }

    #[test]
    fn test_basic_compliance() {
        let (witness, public) = make_basic_witness_and_public();
        let circuit = NeonComplianceCircuit::new(ComplianceLevel::Basic);

        let proof = circuit.prove(&witness, &public, None)
            .expect("Basic compliance should succeed");
        assert!(NeonComplianceCircuit::verify(&proof));
    }

    #[test]
    fn test_standard_compliance() {
        let age = 30u64;
        let age_r = FieldElement::from(111u64);
        let age_c = age_proof::compute_age_commitment(age, &age_r);

        let j_salt = FieldElement::from(222u64);
        let j_commitment = jurisdiction_proof::compute_jurisdiction_commitment(b"BRA", &j_salt);

        let sanctions = SanctionsList::from_codes(&[*b"IRN", *b"PRK", *b"SYR"]);

        let compliance_salt = FieldElement::from(333u64);
        let compliance_secret = FieldElement::from(444u64);
        let expiry = 1700000000u64;

        let composite = compute_compliance_commitment(
            &age_c.commitment,
            &j_commitment,
            AccreditationLevel::Retail,
            &compliance_salt,
        );
        let null = derive_compliance_nullifier(&compliance_secret, expiry);

        let witness = NeonComplianceWitness {
            age: AgeWitness { age, randomizer: age_r },
            jurisdiction: Some(JurisdictionWitness {
                jurisdiction_code: *b"BRA",
                salt: j_salt,
            }),
            accreditation: None,
            compliance_salt,
            compliance_secret,
            expiry_timestamp: expiry,
        };

        let public = NeonCompliancePublicInputs {
            compliance_commitment: composite,
            compliance_level: ComplianceLevel::Standard,
            age: AgePublicInputs {
                commitment: age_c.commitment,
                minimum_age: 18,
            },
            jurisdiction: Some(JurisdictionPublicInputs {
                jurisdiction_commitment: j_commitment,
                sanctions_merkle_root: sanctions.root(),
            }),
            accreditation: None,
            nullifier: null,
        };

        let circuit = NeonComplianceCircuit::new(ComplianceLevel::Standard);
        let proof = circuit.prove(&witness, &public, Some(&sanctions))
            .expect("Standard compliance for Brazil should succeed");
        assert!(NeonComplianceCircuit::verify(&proof));
    }

    #[test]
    fn test_enhanced_compliance() {
        let age = 45u64;
        let age_r = FieldElement::from(111u64);
        let age_c = age_proof::compute_age_commitment(age, &age_r);

        let j_salt = FieldElement::from(222u64);
        let j_commitment = jurisdiction_proof::compute_jurisdiction_commitment(b"USA", &j_salt);

        let acc_r = FieldElement::from(333u64);
        let acc_level = AccreditationLevel::Institutional;
        let acc_commitment = accreditation_proof::compute_accreditation_commitment(acc_level, &acc_r);

        let sanctions = SanctionsList::from_codes(&[*b"IRN", *b"PRK"]);

        let compliance_salt = FieldElement::from(444u64);
        let compliance_secret = FieldElement::from(555u64);
        let expiry = 1700000000u64;

        let composite = compute_compliance_commitment(
            &age_c.commitment,
            &j_commitment,
            acc_level,
            &compliance_salt,
        );
        let null = derive_compliance_nullifier(&compliance_secret, expiry);

        let witness = NeonComplianceWitness {
            age: AgeWitness { age, randomizer: age_r },
            jurisdiction: Some(JurisdictionWitness {
                jurisdiction_code: *b"USA",
                salt: j_salt,
            }),
            accreditation: Some(AccreditationWitness {
                level: acc_level,
                randomizer: acc_r,
            }),
            compliance_salt,
            compliance_secret,
            expiry_timestamp: expiry,
        };

        let public = NeonCompliancePublicInputs {
            compliance_commitment: composite,
            compliance_level: ComplianceLevel::Enhanced,
            age: AgePublicInputs {
                commitment: age_c.commitment,
                minimum_age: 21,
            },
            jurisdiction: Some(JurisdictionPublicInputs {
                jurisdiction_commitment: j_commitment,
                sanctions_merkle_root: sanctions.root(),
            }),
            accreditation: Some(AccreditationPublicInputs {
                commitment: acc_commitment,
                required_level: AccreditationLevel::Accredited,
            }),
            nullifier: null,
        };

        let circuit = NeonComplianceCircuit::new(ComplianceLevel::Enhanced);
        let proof = circuit.prove(&witness, &public, Some(&sanctions))
            .expect("Enhanced compliance should succeed");
        assert!(NeonComplianceCircuit::verify(&proof));
    }

    #[test]
    fn test_compliance_nullifier_deterministic() {
        let secret = FieldElement::from(12345u64);
        let expiry = 1700000000u64;

        let n1 = derive_compliance_nullifier(&secret, expiry);
        let n2 = derive_compliance_nullifier(&secret, expiry);
        assert_eq!(n1, n2);
    }

    #[test]
    fn test_compliance_nullifier_different_expiry() {
        let secret = FieldElement::from(12345u64);
        let n1 = derive_compliance_nullifier(&secret, 1700000000);
        let n2 = derive_compliance_nullifier(&secret, 1700000001);
        assert_ne!(n1, n2);
    }

    #[test]
    fn test_compliance_nullifier_verification() {
        let secret = FieldElement::from(12345u64);
        let expiry = 1700000000u64;
        let n = derive_compliance_nullifier(&secret, expiry);

        assert!(verify_compliance_nullifier(&n, &secret, expiry));
        assert!(!verify_compliance_nullifier(&n, &secret, expiry + 1));
    }

    #[test]
    fn test_compliance_merkle_tree() {
        let commitments: Vec<FieldElement> = (0u64..5)
            .map(|i| FieldElement::from(i * 1000 + 42))
            .collect();

        let tree = build_compliance_merkle_tree(&commitments);
        assert_eq!(tree.leaf_count(), 5);
        assert_ne!(tree.root(), FieldElement::ZERO);

        // Verify inclusion proof for each commitment
        for i in 0..5 {
            let proof = tree.get_proof(i).expect("Proof should exist");
            assert!(
                crate::crypto::merkle::verify_path(commitments[i], &proof, tree.root()),
                "Merkle proof failed for commitment {}",
                i
            );
        }
    }

    #[test]
    fn test_composite_commitment_deterministic() {
        let age_c = FieldElement::from(100u64);
        let j_hash = FieldElement::from(200u64);
        let salt = FieldElement::from(300u64);

        let c1 = compute_compliance_commitment(&age_c, &j_hash, AccreditationLevel::Accredited, &salt);
        let c2 = compute_compliance_commitment(&age_c, &j_hash, AccreditationLevel::Accredited, &salt);
        assert_eq!(c1, c2);
    }

    #[test]
    fn test_enhanced_sanctioned_jurisdiction_fails() {
        let age = 45u64;
        let age_r = FieldElement::from(111u64);
        let age_c = age_proof::compute_age_commitment(age, &age_r);

        let j_salt = FieldElement::from(222u64);
        let j_commitment = jurisdiction_proof::compute_jurisdiction_commitment(b"IRN", &j_salt);

        let acc_r = FieldElement::from(333u64);
        let acc_level = AccreditationLevel::Institutional;
        let acc_commitment = accreditation_proof::compute_accreditation_commitment(acc_level, &acc_r);

        let sanctions = SanctionsList::from_codes(&[*b"IRN", *b"PRK"]);

        let compliance_salt = FieldElement::from(444u64);
        let compliance_secret = FieldElement::from(555u64);
        let expiry = 1700000000u64;

        let composite = compute_compliance_commitment(
            &age_c.commitment,
            &j_commitment,
            acc_level,
            &compliance_salt,
        );
        let null = derive_compliance_nullifier(&compliance_secret, expiry);

        let witness = NeonComplianceWitness {
            age: AgeWitness { age, randomizer: age_r },
            jurisdiction: Some(JurisdictionWitness {
                jurisdiction_code: *b"IRN", // sanctioned
                salt: j_salt,
            }),
            accreditation: Some(AccreditationWitness {
                level: acc_level,
                randomizer: acc_r,
            }),
            compliance_salt,
            compliance_secret,
            expiry_timestamp: expiry,
        };

        let public = NeonCompliancePublicInputs {
            compliance_commitment: composite,
            compliance_level: ComplianceLevel::Enhanced,
            age: AgePublicInputs {
                commitment: age_c.commitment,
                minimum_age: 21,
            },
            jurisdiction: Some(JurisdictionPublicInputs {
                jurisdiction_commitment: j_commitment,
                sanctions_merkle_root: sanctions.root(),
            }),
            accreditation: Some(AccreditationPublicInputs {
                commitment: acc_commitment,
                required_level: AccreditationLevel::Accredited,
            }),
            nullifier: null,
        };

        let circuit = NeonComplianceCircuit::new(ComplianceLevel::Enhanced);
        assert!(circuit.prove(&witness, &public, Some(&sanctions)).is_err());
    }
}
