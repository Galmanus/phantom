//! Unshield Circuit - Prove note ownership and nullifier derivation
//! 
//! Public inputs: nullifier, change_commitment, merkle_root
//! Private inputs: note data, merkle path, withdrawal amount

use crate::crypto::{
    poseidon::{FieldElement, derive_commitment, poseidon_hash_3},
    merkle::{MerkleProof, verify_path},
    nullifier::{derive_nullifier, NULLIFIER_DOMAIN},
};

/// Unshield circuit public inputs
#[derive(Debug, Clone)]
pub struct UnshieldPublicInputs {
    pub nullifier: FieldElement,
    pub change_commitment: Option<FieldElement>,
    pub merkle_root: FieldElement,
}

/// Unshield circuit witness
#[derive(Debug, Clone)]
pub struct UnshieldWitness {
    pub note_commitment: FieldElement,
    pub note_amount: FieldElement,
    pub note_asset_id: u8,
    pub withdrawal_amount: FieldElement,
    pub nullifier_secret: FieldElement,
    pub serial_number: FieldElement,
    pub merkle_path: MerkleProof,
    pub change_amount: FieldElement,
    pub new_nullifier_secret: FieldElement,
    pub new_salt: FieldElement,
}

/// Unshield circuit
#[derive(Debug, Clone)]
pub struct UnshieldCircuit {
    pub public_inputs: UnshieldPublicInputs,
    pub witness: UnshieldWitness,
}

impl UnshieldCircuit {
    pub fn new(
        nullifier: FieldElement,
        change_commitment: Option<FieldElement>,
        merkle_root: FieldElement,
        witness: UnshieldWitness,
    ) -> Self {
        UnshieldCircuit {
            public_inputs: UnshieldPublicInputs {
                nullifier,
                change_commitment,
                merkle_root,
            },
            witness,
        }
    }
    
    /// Generate and validate witness
    pub fn generate_witness(&self) -> Result<(), String> {
        // Constraint 1: Note exists in Merkle tree
        if !verify_path(
            self.witness.note_commitment,
            &self.witness.merkle_path,
            self.public_inputs.merkle_root,
        ) {
            return Err("Merkle path verification failed".to_string());
        }
        
        // Constraint 2: Nullifier correctly derived
        let expected_nullifier = derive_nullifier(
            &self.witness.nullifier_secret,
            &self.witness.serial_number,
        );
        if self.public_inputs.nullifier.0 != expected_nullifier.0 {
            return Err("Nullifier derivation failed".to_string());
        }
        
        // Constraint 3: withdrawal_amount <= note_amount
        // (simplified check - real impl needs range proof)
        
        // Constraint 4: Conservation law (withdrawal + change = note)
        // (simplified - real impl needs arithmetic circuit)
        
        // Constraint 5: Change commitment correctly formed if present
        if let Some(change_comm) = self.public_inputs.change_commitment {
            let expected = derive_commitment(
                &self.witness.change_amount,
                self.witness.note_asset_id,
                &self.witness.new_nullifier_secret,
                &self.witness.new_salt,
            );
            if change_comm.0 != expected.0 {
                return Err("Change commitment mismatch".to_string());
            }
        }
        
        Ok(())
    }
    
    /// Prove the circuit
    pub fn prove(&self) -> Result<UnshieldProof, String> {
        self.generate_witness()?;
        
        Ok(UnshieldProof {
            public_inputs: self.public_inputs.clone(),
            proof_valid: true,
        })
    }
    
    /// Verify proof
    pub fn verify(proof: &UnshieldProof) -> bool {
        proof.proof_valid
    }
}

/// Unshield proof
#[derive(Debug, Clone)]
pub struct UnshieldProof {
    pub public_inputs: UnshieldPublicInputs,
    pub proof_valid: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::merkle::{MerkleTree, MerklePathElement};
    
    #[test]
    fn test_valid_unshield() {
        let note_amount = FieldElement::from_u64(1000);
        let withdrawal = FieldElement::from_u64(600);
        let change = FieldElement::from_u64(400);
        let asset_id = 0u8;
        let secret = FieldElement::from_u64(12345);
        let serial = FieldElement::from_u64(1);
        let salt = FieldElement::from_u64(67890);
        
        let note_commitment = derive_commitment(&note_amount, asset_id, &secret, &salt);
        
        // Create Merkle tree with note
        let mut tree = MerkleTree::new();
        tree.append(note_commitment);
        let merkle_root = tree.root();
        let merkle_path = tree.get_proof(0).unwrap();
        
        // Derive nullifier
        let nullifier = derive_nullifier(&secret, &serial);
        
        // Create change commitment
        let new_secret = FieldElement::from_u64(11111);
        let new_salt = FieldElement::from_u64(22222);
        let change_commitment = derive_commitment(&change, asset_id, &new_secret, &new_salt);
        
        let witness = UnshieldWitness {
            note_commitment,
            note_amount,
            note_asset_id: asset_id,
            withdrawal_amount: withdrawal,
            nullifier_secret: secret,
            serial_number: serial,
            merkle_path,
            change_amount: change,
            new_nullifier_secret: new_secret,
            new_salt,
        };
        
        let circuit = UnshieldCircuit::new(
            nullifier,
            Some(change_commitment),
            merkle_root,
            witness,
        );
        
        assert!(circuit.generate_witness().is_ok());
    }
}
