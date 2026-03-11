//! Shield witness generation

use super::circuit::{ShieldWitness, ShieldPublicInputs};
use crate::crypto::poseidon::FieldElement;

/// Generate shield witness from private inputs
pub fn generate_shield_witness(
    amount: FieldElement,
    nullifier_secret: FieldElement,
    salt: FieldElement,
    public_inputs: &ShieldPublicInputs,
) -> Result<ShieldWitness, String> {
    // Validate amount is not zero
    if amount == FieldElement::ZERO {
        return Err("Amount cannot be zero".to_string());
    }
    
    // Validate asset_id is in valid range
    if public_inputs.asset_id >= 6 {
        return Err("Invalid asset ID".to_string());
    }
    
    Ok(ShieldWitness {
        amount,
        nullifier_secret,
        salt,
    })
}
