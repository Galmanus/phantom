//! Shield Circuit - Prove commitment was formed correctly
//!
//! Public inputs: commitment, asset_id
//! Private inputs: amount, nullifier_secret, salt
//!
//! Proves: commitment == Poseidon(amount, asset_id, nullifier_secret, salt)

use crate::crypto::poseidon::{FieldElement, derive_commitment};
use crate::shield::air::{ShieldAirConstraints, generate_trace};

/// Shield circuit public inputs
#[derive(Debug, Clone)]
pub struct ShieldPublicInputs {
    pub commitment: FieldElement,
    pub asset_id: u8,
}

/// Shield circuit witness (private inputs)
#[derive(Debug, Clone)]
pub struct ShieldWitness {
    pub amount: FieldElement,
    pub nullifier_secret: FieldElement,
    pub salt: FieldElement,
}

/// Shield circuit
#[derive(Debug, Clone)]
pub struct ShieldCircuit {
    pub public_inputs: ShieldPublicInputs,
    pub witness: ShieldWitness,
}

impl ShieldCircuit {
    /// Create a new shield circuit
    pub fn new(
        commitment: FieldElement,
        asset_id: u8,
        amount: FieldElement,
        nullifier_secret: FieldElement,
        salt: FieldElement,
    ) -> Self {
        ShieldCircuit {
            public_inputs: ShieldPublicInputs {
                commitment,
                asset_id,
            },
            witness: ShieldWitness {
                amount,
                nullifier_secret,
                salt,
            },
        }
    }
    
    /// Generate the witness (validate private inputs)
    pub fn generate_witness(&self) -> Result<ShieldWitness, String> {
        // Validate amount > 0
        if self.witness.amount == FieldElement::ZERO {
            return Err("Amount must be greater than zero".to_string());
        }
        
        // Validate asset_id < 6
        if self.public_inputs.asset_id >= 6 {
            return Err("Invalid asset ID".to_string());
        }
        
        // Validate commitment matches
        let expected_commitment = derive_commitment(
            &self.witness.amount,
            self.public_inputs.asset_id,
            &self.witness.nullifier_secret,
            &self.witness.salt,
        );
        
        if self.public_inputs.commitment.0 != expected_commitment.0 {
            return Err("Commitment mismatch".to_string());
        }
        
        Ok(self.witness.clone())
    }
    
    /// Prove the circuit (simplified - real implementation uses Stwo)
    pub fn prove(&self) -> Result<ShieldProof, String> {
        // Validate witness
        self.generate_witness()?;
        
        // In production: generate actual Stwo proof
        // For now, return a serialized proof structure
        
        Ok(ShieldProof {
            public_inputs: self.public_inputs.clone(),
            proof_data: self._generate_proof_data(),
        })
    }
    
    /// Verify a shield proof
    pub fn verify(proof: &ShieldProof) -> bool {
        // Verify commitment matches public inputs
        let expected = derive_commitment(
            &proof.proof_data.amount,
            proof.public_inputs.asset_id,
            &proof.proof_data.nullifier_secret,
            &proof.proof_data.salt,
        );

        proof.public_inputs.commitment.0 == expected.0
    }
    
    /// Generate proof data (placeholder for real Stwo proof)
    fn _generate_proof_data(&self) -> ProofData {
        ProofData {
            amount: self.witness.amount,
            nullifier_secret: self.witness.nullifier_secret,
            salt: self.witness.salt,
        }
    }
}

/// Shield proof
#[derive(Debug, Clone)]
pub struct ShieldProof {
    pub public_inputs: ShieldPublicInputs,
    pub proof_data: ProofData,
}

/// Internal proof data
#[derive(Debug, Clone)]
pub struct ProofData {
    pub amount: FieldElement,
    pub nullifier_secret: FieldElement,
    pub salt: FieldElement,
}

impl ShieldProof {
    /// Serialize proof to hex string
    pub fn to_hex(&self) -> String {
        let mut result = String::new();
        
        // Public inputs
        result.push_str(&self.public_inputs.commitment.to_hex()[2..]);
        result.push_str(&format!("{:02x}", self.public_inputs.asset_id));
        
        // Proof data
        result.push_str(&self.proof_data.amount.to_hex()[2..]);
        result.push_str(&self.proof_data.nullifier_secret.to_hex()[2..]);
        result.push_str(&self.proof_data.salt.to_hex()[2..]);
        
        result
    }
    
    /// Deserialize proof from hex string
    pub fn from_hex(hex: &str) -> Result<Self, String> {
        // Parse hex string back to proof structure
        // Format: commitment(32) | asset_id(1) | amount(32) | secret(32) | salt(32)
        
        if hex.len() < 128 {
            return Err("Proof hex too short".to_string());
        }
        
        let hex = hex.strip_prefix("0x").unwrap_or(hex);
        
        let commitment = FieldElement::from_hex(&hex[0..64])?;
        let asset_id = u8::from_str_radix(&hex[64..66], 16).map_err(|e| e.to_string())?;
        let amount = FieldElement::from_hex(&hex[66..128])?;
        
        // For simplified proof, we only parse what we need
        // Full implementation would parse all proof data
        
        Ok(ShieldProof {
            public_inputs: ShieldPublicInputs { commitment, asset_id },
            proof_data: ProofData {
                amount,
                nullifier_secret: FieldElement::ZERO,
                salt: FieldElement::ZERO,
            },
        })
    }
}

/// Helper function to create a shield proof
pub fn prove_shield(
    commitment: FieldElement,
    asset_id: u8,
    amount: FieldElement,
    nullifier_secret: FieldElement,
    salt: FieldElement,
) -> Result<ShieldProof, String> {
    let circuit = ShieldCircuit::new(commitment, asset_id, amount, nullifier_secret, salt);
    circuit.prove()
}

/// Helper function to verify a shield proof
pub fn verify_shield(proof_hex: &str, commitment: FieldElement, asset_id: u8) -> bool {
    match ShieldProof::from_hex(proof_hex) {
        Ok(proof) => {
            if proof.public_inputs.commitment.0 != commitment.0 
                || proof.public_inputs.asset_id != asset_id 
            {
                return false;
            }
            ShieldCircuit::verify(&proof)
        }
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_valid_shield_proof() {
        let amount = FieldElement::from_u64(1000);
        let asset_id = 0u8;
        let secret = FieldElement::from_u64(12345);
        let salt = FieldElement::from_u64(67890);
        
        let commitment = derive_commitment(&amount, asset_id, &secret, &salt);
        
        let circuit = ShieldCircuit::new(commitment, asset_id, amount, secret, salt);
        let proof = circuit.prove().expect("Failed to generate proof");
        
        assert!(ShieldCircuit::verify(&proof));
    }
    
    #[test]
    fn test_zero_amount_fails() {
        let amount = FieldElement::ZERO;
        let asset_id = 0u8;
        let secret = FieldElement::from_u64(12345);
        let salt = FieldElement::from_u64(67890);
        
        let commitment = derive_commitment(&amount, asset_id, &secret, &salt);
        
        let circuit = ShieldCircuit::new(commitment, asset_id, amount, secret, salt);
        let result = circuit.generate_witness();
        
        assert!(result.is_err());
    }
    
    #[test]
    fn test_invalid_asset_id_fails() {
        let amount = FieldElement::from_u64(1000);
        let asset_id = 10u8; // Invalid
        let secret = FieldElement::from_u64(12345);
        let salt = FieldElement::from_u64(67890);
        
        let commitment = derive_commitment(&amount, asset_id, &secret, &salt);
        
        let circuit = ShieldCircuit::new(commitment, asset_id, amount, secret, salt);
        let result = circuit.generate_witness();
        
        assert!(result.is_err());
    }
    
    #[test]
    fn test_commitment_mismatch_fails() {
        let amount = FieldElement::from_u64(1000);
        let asset_id = 0u8;
        let secret = FieldElement::from_u64(12345);
        let salt = FieldElement::from_u64(67890);
        
        // Wrong commitment
        let commitment = FieldElement::from_u64(99999);
        
        let circuit = ShieldCircuit::new(commitment, asset_id, amount, secret, salt);
        let result = circuit.generate_witness();
        
        assert!(result.is_err());
    }
}
