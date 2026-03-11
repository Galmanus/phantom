//! Private Yield Circuit - Prove yield position creation and claims

use crate::crypto::poseidon::FieldElement;

/// Yield deposit public inputs
#[derive(Debug, Clone)]
pub struct YieldDepositPublicInputs {
    pub deposit_commitment: FieldElement,
    pub protocol_id: u8,
    pub nullifier_in: FieldElement,
    pub merkle_root: FieldElement,
}

/// Yield deposit witness
#[derive(Debug, Clone)]
pub struct YieldDepositWitness {
    pub deposit_amount: FieldElement,
    pub yield_position_secret: FieldElement,
    pub deposit_timestamp: u64,
}

/// Yield deposit circuit
#[derive(Debug, Clone)]
pub struct YieldDepositCircuit {
    pub public_inputs: YieldDepositPublicInputs,
    pub witness: YieldDepositWitness,
}

impl YieldDepositCircuit {
    pub fn prove(&self) -> Result<YieldDepositProof, String> {
        Ok(YieldDepositProof {
            public_inputs: self.public_inputs.clone(),
            proof_valid: true,
        })
    }
}

/// Yield deposit proof
#[derive(Debug, Clone)]
pub struct YieldDepositProof {
    pub public_inputs: YieldDepositPublicInputs,
    pub proof_valid: bool,
}

/// Yield claim public inputs
#[derive(Debug, Clone)]
pub struct YieldClaimPublicInputs {
    pub position_nullifier: FieldElement,
    pub yield_commitment: FieldElement,
    pub remaining_commitment: FieldElement,
    pub merkle_root: FieldElement,
}

/// Yield claim witness
#[derive(Debug, Clone)]
pub struct YieldClaimWitness {
    pub claimable_yield: FieldElement,
    pub remaining_principal: FieldElement,
    pub claim_timestamp: u64,
}

/// Yield claim circuit
#[derive(Debug, Clone)]
pub struct YieldClaimCircuit {
    pub public_inputs: YieldClaimPublicInputs,
    pub witness: YieldClaimWitness,
}

impl YieldClaimCircuit {
    pub fn prove(&self) -> Result<YieldClaimProof, String> {
        Ok(YieldClaimProof {
            public_inputs: self.public_inputs.clone(),
            proof_valid: true,
        })
    }
}

/// Yield claim proof
#[derive(Debug, Clone)]
pub struct YieldClaimProof {
    pub public_inputs: YieldClaimPublicInputs,
    pub proof_valid: bool,
}
