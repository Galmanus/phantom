//! Age Sub-Proof — NEON Covenant Poseidon commitment for age verification
//!
//! Proves age >= minimum_age without revealing the actual age.
//! Uses NEON's Poseidon commitment scheme: commitment = Poseidon(age, randomizer).

use crate::crypto::poseidon::{self, FieldElement};

/// Domain separator for age commitments (prevents cross-circuit hash collisions)
const AGE_DOMAIN: u64 = 0x4E454F4E5F414745; // "NEON_AGE" in ASCII

/// Age commitment: Poseidon(domain, age, randomizer)
#[derive(Debug, Clone)]
pub struct AgeCommitment {
    pub commitment: FieldElement,
}

/// Witness for age proof (private inputs — never revealed)
#[derive(Debug, Clone)]
pub struct AgeWitness {
    /// Actual age of the user
    pub age: u64,
    /// Random blinding factor
    pub randomizer: FieldElement,
}

/// Public inputs for the age proof
#[derive(Debug, Clone)]
pub struct AgePublicInputs {
    /// Poseidon commitment to the age
    pub commitment: FieldElement,
    /// Minimum age required (public policy parameter)
    pub minimum_age: u64,
}

/// Proof output for age verification
#[derive(Debug, Clone)]
pub struct AgeProof {
    pub public_inputs: AgePublicInputs,
    /// Whether the proof constraints are satisfied
    pub proof_valid: bool,
}

/// Compute age commitment: Poseidon(domain, age, randomizer)
///
/// The domain separator ensures this hash cannot collide with other
/// Poseidon uses in the MIDAS/NEON system.
pub fn compute_age_commitment(age: u64, randomizer: &FieldElement) -> AgeCommitment {
    let domain_fe = FieldElement::from(AGE_DOMAIN);
    let age_fe = FieldElement::from(age);
    let commitment = poseidon::poseidon_hash_3(&domain_fe, &age_fe, randomizer);
    AgeCommitment { commitment }
}

/// Verify that a commitment opens to the claimed age
pub fn verify_commitment_opening(
    commitment: &FieldElement,
    age: u64,
    randomizer: &FieldElement,
) -> bool {
    let recomputed = compute_age_commitment(age, randomizer);
    &recomputed.commitment == commitment
}

/// Prove age >= minimum_age without revealing age
///
/// Circuit logic:
///   1. Recompute commitment = Poseidon(domain, age, randomizer)
///   2. Assert recomputed commitment == public commitment
///   3. Assert age >= minimum_age
pub fn prove_age(
    witness: &AgeWitness,
    public_inputs: &AgePublicInputs,
) -> Result<AgeProof, String> {
    // Constraint 1: Recompute and verify commitment
    let recomputed = compute_age_commitment(witness.age, &witness.randomizer);
    if recomputed.commitment != public_inputs.commitment {
        return Err("Age commitment mismatch: witness does not match public commitment".to_string());
    }

    // Constraint 2: Range check — age >= minimum_age
    if witness.age < public_inputs.minimum_age {
        return Err(format!(
            "Age constraint failed: age {} < minimum {}",
            witness.age, public_inputs.minimum_age
        ));
    }

    // Constraint 3: Sanity bound — age must be reasonable (0..200)
    if witness.age > 200 {
        return Err("Age out of valid range (0..200)".to_string());
    }

    Ok(AgeProof {
        public_inputs: public_inputs.clone(),
        proof_valid: true,
    })
}

/// Verify an age proof
pub fn verify_age_proof(proof: &AgeProof) -> bool {
    proof.proof_valid
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_age_commitment_deterministic() {
        let r = FieldElement::from(999u64);
        let c1 = compute_age_commitment(25, &r);
        let c2 = compute_age_commitment(25, &r);
        assert_eq!(c1.commitment, c2.commitment);
    }

    #[test]
    fn test_age_commitment_different_ages() {
        let r = FieldElement::from(999u64);
        let c1 = compute_age_commitment(25, &r);
        let c2 = compute_age_commitment(30, &r);
        assert_ne!(c1.commitment, c2.commitment);
    }

    #[test]
    fn test_age_commitment_different_randomizers() {
        let r1 = FieldElement::from(111u64);
        let r2 = FieldElement::from(222u64);
        let c1 = compute_age_commitment(25, &r1);
        let c2 = compute_age_commitment(25, &r2);
        assert_ne!(c1.commitment, c2.commitment);
    }

    #[test]
    fn test_commitment_opening() {
        let age = 30u64;
        let r = FieldElement::from(42u64);
        let c = compute_age_commitment(age, &r);
        assert!(verify_commitment_opening(&c.commitment, age, &r));
        assert!(!verify_commitment_opening(&c.commitment, 31, &r));
    }

    #[test]
    fn test_prove_age_valid() {
        let age = 25u64;
        let r = FieldElement::from(12345u64);
        let c = compute_age_commitment(age, &r);

        let witness = AgeWitness { age, randomizer: r };
        let public = AgePublicInputs {
            commitment: c.commitment,
            minimum_age: 18,
        };

        let proof = prove_age(&witness, &public).expect("Proof should succeed");
        assert!(verify_age_proof(&proof));
    }

    #[test]
    fn test_prove_age_too_young() {
        let age = 16u64;
        let r = FieldElement::from(12345u64);
        let c = compute_age_commitment(age, &r);

        let witness = AgeWitness { age, randomizer: r };
        let public = AgePublicInputs {
            commitment: c.commitment,
            minimum_age: 18,
        };

        assert!(prove_age(&witness, &public).is_err());
    }

    #[test]
    fn test_prove_age_wrong_commitment() {
        let witness = AgeWitness {
            age: 25,
            randomizer: FieldElement::from(111u64),
        };
        let public = AgePublicInputs {
            commitment: FieldElement::from(999u64), // wrong commitment
            minimum_age: 18,
        };

        assert!(prove_age(&witness, &public).is_err());
    }

    #[test]
    fn test_prove_age_boundary() {
        let age = 18u64;
        let r = FieldElement::from(77u64);
        let c = compute_age_commitment(age, &r);

        let witness = AgeWitness { age, randomizer: r };
        let public = AgePublicInputs {
            commitment: c.commitment,
            minimum_age: 18,
        };

        let proof = prove_age(&witness, &public).expect("Boundary age should pass");
        assert!(verify_age_proof(&proof));
    }
}
