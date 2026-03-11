//! Unshield witness generation

use super::circuit::UnshieldWitness;
use crate::crypto::poseidon::FieldElement;
use crate::crypto::merkle::MerkleProof;

pub fn generate_unshield_witness(
    note_commitment: FieldElement,
    note_amount: FieldElement,
    note_asset_id: u8,
    withdrawal_amount: FieldElement,
    nullifier_secret: FieldElement,
    serial_number: FieldElement,
    merkle_path: MerkleProof,
    change_amount: FieldElement,
    new_nullifier_secret: FieldElement,
    new_salt: FieldElement,
) -> Result<UnshieldWitness, String> {
    Ok(UnshieldWitness {
        note_commitment,
        note_amount,
        note_asset_id,
        withdrawal_amount,
        nullifier_secret,
        serial_number,
        merkle_path,
        change_amount,
        new_nullifier_secret,
        new_salt,
    })
}
