//! Private yield witness generation

use super::circuit::{YieldDepositWitness, YieldClaimWitness};
use crate::crypto::poseidon::FieldElement;

pub fn generate_yield_deposit_witness(
    deposit_amount: FieldElement,
    yield_position_secret: FieldElement,
    deposit_timestamp: u64,
) -> Result<YieldDepositWitness, String> {
    Ok(YieldDepositWitness {
        deposit_amount,
        yield_position_secret,
        deposit_timestamp,
    })
}

pub fn generate_yield_claim_witness(
    claimable_yield: FieldElement,
    remaining_principal: FieldElement,
    claim_timestamp: u64,
) -> Result<YieldClaimWitness, String> {
    Ok(YieldClaimWitness {
        claimable_yield,
        remaining_principal,
        claim_timestamp,
    })
}
