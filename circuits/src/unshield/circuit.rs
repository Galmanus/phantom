//! Unshield Circuit — PLACEHOLDER
//!
//! PLACEHOLDER: Real Stwo proof generation pending Starknet 0.14.2 native verifier syscall.

use crate::crypto::poseidon::{FieldElement, derive_commitment};
use crate::crypto::nullifier::{derive_nullifier, derive_serial_number};

/// Unshield proof public inputs
#[derive(Debug, Clone)]
pub struct UnshieldPublicInputs {
    pub nullifier: FieldElement,
    pub merkle_root: FieldElement,
    pub recipient: FieldElement,
    pub amount: FieldElement,
    pub asset_id: u8,
    pub change_commitment: Option<FieldElement>,
}

/// Unshield proof witness (private inputs)
#[derive(Debug, Clone)]
pub struct UnshieldWitness {
    pub note_commitment: FieldElement,
    pub nullifier_secret: FieldElement,
    pub serial_number: FieldElement,
    pub merkle_path: Vec<(FieldElement, bool)>,
    pub note_amount: FieldElement,
    pub new_nullifier_secret: Option<FieldElement>,
    pub new_salt: Option<FieldElement>,
}

/// Unshield proof
#[derive(Debug, Clone)]
pub struct UnshieldProof {
    pub public_inputs: UnshieldPublicInputs,
    pub proof_valid: bool,
}

impl UnshieldProof {
    pub fn to_hex(&self) -> String {
        // PLACEHOLDER
        format!("0x{:064x}", 0u64)
    }
}

/// Unshield circuit
#[derive(Debug, Clone)]
pub struct UnshieldCircuit {
    pub public_inputs: UnshieldPublicInputs,
    pub witness: UnshieldWitness,
}

impl UnshieldCircuit {
    pub fn prove(&self) -> Result<UnshieldProof, String> {
        // PLACEHOLDER: Real Stwo proof generation pending Starknet 0.14.2
        
        // Verify nullifier is correctly derived
        let expected_nullifier = derive_nullifier(
            &self.witness.nullifier_secret,
            &self.witness.serial_number,
        );
        
        if self.public_inputs.nullifier != expected_nullifier {
            return Err("Nullifier does not match secret and serial number".to_string());
        }

        Ok(UnshieldProof {
            public_inputs: self.public_inputs.clone(),
            proof_valid: true,
        })
    }

    pub fn verify(proof: &UnshieldProof) -> bool {
        proof.proof_valid
    }
}

/// Convenience function for WASM bindings
pub fn prove_unshield(
    nullifier: FieldElement,
    merkle_root: FieldElement,
    recipient: FieldElement,
    amount: FieldElement,
    asset_id: u8,
    change_commitment: Option<FieldElement>,
    note_commitment: FieldElement,
    nullifier_secret: FieldElement,
    serial_number: FieldElement,
) -> Result<UnshieldProof, String> {
    let circuit = UnshieldCircuit {
        public_inputs: UnshieldPublicInputs {
            nullifier,
            merkle_root,
            recipient,
            amount,
            asset_id,
            change_commitment,
        },
        witness: UnshieldWitness {
            note_commitment,
            nullifier_secret,
            serial_number,
            merkle_path: vec![],
            note_amount: amount,
            new_nullifier_secret: None,
            new_salt: None,
        },
    };
    circuit.prove()
}

/// Convenience function for WASM bindings
pub fn verify_unshield(_proof_hex: &str) -> bool {
    // PLACEHOLDER: Real verification pending
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::poseidon::fe_from_u64;

    #[test]
    fn test_valid_unshield() {
        let amount = fe_from_u64(1000);
        let secret = fe_from_u64(12345);
        let salt = fe_from_u64(67890);
        let asset_id = 0u8;

        let serial_number = derive_serial_number(&secret, &salt);
        let nullifier = derive_nullifier(&secret, &serial_number);
        let commitment = derive_commitment(&amount, asset_id, &secret, &salt);

        let circuit = UnshieldCircuit {
            public_inputs: UnshieldPublicInputs {
                nullifier,
                merkle_root: fe_from_u64(0),
                recipient: fe_from_u64(0xdeadbeef),
                amount,
                asset_id,
                change_commitment: None,
            },
            witness: UnshieldWitness {
                note_commitment: commitment,
                nullifier_secret: secret,
                serial_number,
                merkle_path: vec![],
                note_amount: amount,
                new_nullifier_secret: None,
                new_salt: None,
            },
        };

        let result = circuit.prove();
        assert!(result.is_ok(), "Unshield should prove successfully: {:?}", result.err());
    }
}
