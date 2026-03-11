//! Private swap witness generation

use super::circuit::PrivateSwapWitness;
use crate::crypto::poseidon::FieldElement;

pub fn generate_private_swap_witness(
    input_amount: FieldElement,
    output_amount: FieldElement,
    output_asset_id: u8,
    output_nullifier_secret: FieldElement,
    output_salt: FieldElement,
) -> Result<PrivateSwapWitness, String> {
    Ok(PrivateSwapWitness {
        input_amount,
        output_amount,
        output_asset_id,
        output_nullifier_secret,
        output_salt,
    })
}
