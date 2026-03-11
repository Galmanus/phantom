//! Shield circuit constraints

use crate::crypto::poseidon::{FieldElement, derive_commitment};
use super::circuit::{ShieldPublicInputs, ShieldWitness};

/// Constraint system for shield circuit
pub struct ShieldConstraints {
    pub public_inputs: ShieldPublicInputs,
    pub witness: ShieldWitness,
}

impl ShieldConstraints {
    /// Create new constraint system
    pub fn new(public_inputs: ShieldPublicInputs, witness: ShieldWitness) -> Self {
        ShieldConstraints {
            public_inputs,
            witness,
        }
    }
    
    /// Check all constraints are satisfied
    pub fn check(&self) -> Result<(), String> {
        self.check_commitment()?;
        self.check_amount_range()?;
        self.check_asset_id_range()?;
        Ok(())
    }
    
    /// Constraint 1: commitment == Poseidon(amount, asset_id, nullifier_secret, salt)
    fn check_commitment(&self) -> Result<(), String> {
        let expected = derive_commitment(
            &self.witness.amount,
            self.public_inputs.asset_id,
            &self.witness.nullifier_secret,
            &self.witness.salt,
        );
        
        if self.public_inputs.commitment.0 != expected.0 {
            return Err("Commitment constraint failed".to_string());
        }
        
        Ok(())
    }
    
    /// Constraint 2: amount > 0
    fn check_amount_range(&self) -> Result<(), String> {
        if self.witness.amount == FieldElement::ZERO {
            return Err("Amount must be greater than zero".to_string());
        }
        Ok(())
    }
    
    /// Constraint 3: asset_id < 6
    fn check_asset_id_range(&self) -> Result<(), String> {
        if self.public_inputs.asset_id >= 6 {
            return Err("Asset ID must be less than 6".to_string());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_valid_constraints() {
        let amount = FieldElement::from_u64(1000);
        let asset_id = 0u8;
        let secret = FieldElement::from_u64(12345);
        let salt = FieldElement::from_u64(67890);
        
        let commitment = derive_commitment(&amount, asset_id, &secret, &salt);
        
        let public_inputs = ShieldPublicInputs { commitment, asset_id };
        let witness = ShieldWitness {
            amount,
            nullifier_secret: secret,
            salt,
        };
        
        let constraints = ShieldConstraints::new(public_inputs, witness);
        assert!(constraints.check().is_ok());
    }
    
    #[test]
    fn test_zero_amount_constraint() {
        let amount = FieldElement::ZERO;
        let asset_id = 0u8;
        let secret = FieldElement::from_u64(12345);
        let salt = FieldElement::from_u64(67890);
        
        let commitment = derive_commitment(&amount, asset_id, &secret, &salt);
        
        let public_inputs = ShieldPublicInputs { commitment, asset_id };
        let witness = ShieldWitness {
            amount,
            nullifier_secret: secret,
            salt,
        };
        
        let constraints = ShieldConstraints::new(public_inputs, witness);
        assert!(constraints.check().is_err());
    }
}
