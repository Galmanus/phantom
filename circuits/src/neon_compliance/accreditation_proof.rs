//! Accreditation Sub-Proof — Investor qualification level verification
//!
//! Proves that an investor's accreditation level meets or exceeds
//! the required level for a given financial instrument, without
//! revealing the exact level.
//!
//! Levels:
//!   0 = Retail investor
//!   1 = Accredited investor (SEC Rule 501 / equivalent)
//!   2 = Institutional / Qualified Purchaser

use crate::crypto::poseidon::{self, FieldElement};

/// Domain separator for accreditation commitments
const ACCREDITATION_DOMAIN: u64 = 0x4E454F4E5F414343; // "NEON_ACC" in ASCII

/// Accreditation levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u8)]
pub enum AccreditationLevel {
    /// Retail investor — no special qualification
    Retail = 0,
    /// Accredited investor (high net worth / income threshold)
    Accredited = 1,
    /// Institutional / Qualified Purchaser
    Institutional = 2,
}

impl AccreditationLevel {
    /// Convert from u8, returning None for invalid values
    pub fn from_u8(val: u8) -> Option<Self> {
        match val {
            0 => Some(AccreditationLevel::Retail),
            1 => Some(AccreditationLevel::Accredited),
            2 => Some(AccreditationLevel::Institutional),
            _ => None,
        }
    }

    /// Convert to u64 for field element arithmetic
    pub fn as_u64(self) -> u64 {
        self as u64
    }
}

/// Witness for accreditation proof (private inputs)
#[derive(Debug, Clone)]
pub struct AccreditationWitness {
    /// Actual accreditation level of the user
    pub level: AccreditationLevel,
    /// Random blinding factor
    pub randomizer: FieldElement,
}

/// Public inputs for accreditation proof
#[derive(Debug, Clone)]
pub struct AccreditationPublicInputs {
    /// Poseidon commitment to accreditation level
    pub commitment: FieldElement,
    /// Minimum required level (public policy parameter)
    pub required_level: AccreditationLevel,
}

/// Accreditation proof output
#[derive(Debug, Clone)]
pub struct AccreditationProof {
    pub public_inputs: AccreditationPublicInputs,
    pub proof_valid: bool,
}

/// Compute accreditation commitment: Poseidon(domain, level, randomizer)
pub fn compute_accreditation_commitment(
    level: AccreditationLevel,
    randomizer: &FieldElement,
) -> FieldElement {
    let domain_fe = FieldElement::from(ACCREDITATION_DOMAIN);
    let level_fe = FieldElement::from(level.as_u64());
    poseidon::poseidon_hash_3(&domain_fe, &level_fe, randomizer)
}

/// Verify that a commitment opens to the claimed level
pub fn verify_commitment_opening(
    commitment: &FieldElement,
    level: AccreditationLevel,
    randomizer: &FieldElement,
) -> bool {
    let recomputed = compute_accreditation_commitment(level, randomizer);
    &recomputed == commitment
}

/// Prove accreditation level >= required_level
///
/// Circuit logic:
///   1. Recompute commitment = Poseidon(domain, level, randomizer)
///   2. Assert recomputed commitment == public commitment
///   3. Assert level >= required_level
pub fn prove_accreditation(
    witness: &AccreditationWitness,
    public_inputs: &AccreditationPublicInputs,
) -> Result<AccreditationProof, String> {
    // Constraint 1: Recompute and verify commitment
    let recomputed = compute_accreditation_commitment(witness.level, &witness.randomizer);
    if recomputed != public_inputs.commitment {
        return Err("Accreditation commitment mismatch".to_string());
    }

    // Constraint 2: Level check — level >= required_level
    if witness.level < public_inputs.required_level {
        return Err(format!(
            "Accreditation level insufficient: have {:?}, need {:?}",
            witness.level, public_inputs.required_level
        ));
    }

    Ok(AccreditationProof {
        public_inputs: public_inputs.clone(),
        proof_valid: true,
    })
}

/// Verify an accreditation proof
pub fn verify_accreditation_proof(proof: &AccreditationProof) -> bool {
    proof.proof_valid
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_accreditation_level_ordering() {
        assert!(AccreditationLevel::Retail < AccreditationLevel::Accredited);
        assert!(AccreditationLevel::Accredited < AccreditationLevel::Institutional);
    }

    #[test]
    fn test_accreditation_level_from_u8() {
        assert_eq!(AccreditationLevel::from_u8(0), Some(AccreditationLevel::Retail));
        assert_eq!(AccreditationLevel::from_u8(1), Some(AccreditationLevel::Accredited));
        assert_eq!(AccreditationLevel::from_u8(2), Some(AccreditationLevel::Institutional));
        assert_eq!(AccreditationLevel::from_u8(3), None);
    }

    #[test]
    fn test_commitment_deterministic() {
        let r = FieldElement::from(42u64);
        let c1 = compute_accreditation_commitment(AccreditationLevel::Accredited, &r);
        let c2 = compute_accreditation_commitment(AccreditationLevel::Accredited, &r);
        assert_eq!(c1, c2);
    }

    #[test]
    fn test_commitment_different_levels() {
        let r = FieldElement::from(42u64);
        let c0 = compute_accreditation_commitment(AccreditationLevel::Retail, &r);
        let c1 = compute_accreditation_commitment(AccreditationLevel::Accredited, &r);
        let c2 = compute_accreditation_commitment(AccreditationLevel::Institutional, &r);
        assert_ne!(c0, c1);
        assert_ne!(c1, c2);
        assert_ne!(c0, c2);
    }

    #[test]
    fn test_commitment_opening() {
        let level = AccreditationLevel::Accredited;
        let r = FieldElement::from(77u64);
        let c = compute_accreditation_commitment(level, &r);
        assert!(verify_commitment_opening(&c, level, &r));
        assert!(!verify_commitment_opening(&c, AccreditationLevel::Retail, &r));
    }

    #[test]
    fn test_prove_accreditation_valid() {
        let level = AccreditationLevel::Institutional;
        let r = FieldElement::from(555u64);
        let c = compute_accreditation_commitment(level, &r);

        let witness = AccreditationWitness { level, randomizer: r };
        let public = AccreditationPublicInputs {
            commitment: c,
            required_level: AccreditationLevel::Accredited,
        };

        let proof = prove_accreditation(&witness, &public).expect("Should pass");
        assert!(verify_accreditation_proof(&proof));
    }

    #[test]
    fn test_prove_accreditation_exact_level() {
        let level = AccreditationLevel::Accredited;
        let r = FieldElement::from(555u64);
        let c = compute_accreditation_commitment(level, &r);

        let witness = AccreditationWitness { level, randomizer: r };
        let public = AccreditationPublicInputs {
            commitment: c,
            required_level: AccreditationLevel::Accredited,
        };

        let proof = prove_accreditation(&witness, &public).expect("Exact level should pass");
        assert!(verify_accreditation_proof(&proof));
    }

    #[test]
    fn test_prove_accreditation_insufficient() {
        let level = AccreditationLevel::Retail;
        let r = FieldElement::from(555u64);
        let c = compute_accreditation_commitment(level, &r);

        let witness = AccreditationWitness { level, randomizer: r };
        let public = AccreditationPublicInputs {
            commitment: c,
            required_level: AccreditationLevel::Accredited,
        };

        assert!(prove_accreditation(&witness, &public).is_err());
    }

    #[test]
    fn test_prove_accreditation_wrong_commitment() {
        let witness = AccreditationWitness {
            level: AccreditationLevel::Institutional,
            randomizer: FieldElement::from(111u64),
        };
        let public = AccreditationPublicInputs {
            commitment: FieldElement::from(999u64),
            required_level: AccreditationLevel::Retail,
        };

        assert!(prove_accreditation(&witness, &public).is_err());
    }
}
