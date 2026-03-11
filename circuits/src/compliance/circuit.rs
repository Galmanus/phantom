//! Compliance Circuit - Composite proof for selective disclosure

use crate::crypto::poseidon::FieldElement;

/// Compliance proof bundle containing three sub-proofs
#[derive(Debug, Clone)]
pub struct ComplianceProofBundle {
    pub kyc_proof: KYCProof,
    pub amount_proof: AmountProof,
    pub sanctions_proof: SanctionsProof,
    pub regulator_id: FieldElement,
    pub scope: u8,
}

/// KYC sub-proof
#[derive(Debug, Clone)]
pub struct KYCProof {
    pub kyc_merkle_root: FieldElement,
    pub kyc_commitment: FieldElement,
    pub proof_valid: bool,
}

/// Amount range sub-proof
#[derive(Debug, Clone)]
pub struct AmountProof {
    pub reporting_threshold: FieldElement,
    pub amount_in_range: bool,
    pub proof_valid: bool,
}

/// Sanctions screening sub-proof
#[derive(Debug, Clone)]
pub struct SanctionsProof {
    pub sanctions_merkle_root: FieldElement,
    pub recipient_cleared: bool,
    pub proof_valid: bool,
}

/// Compliance circuit
#[derive(Debug, Clone)]
pub struct ComplianceCircuit {
    pub regulator_id: FieldElement,
    pub scope: u8,
}

impl ComplianceCircuit {
    pub fn new(regulator_id: FieldElement, scope: u8) -> Self {
        ComplianceCircuit {
            regulator_id,
            scope,
        }
    }
    
    pub fn prove_bundle(
        &self,
        kyc_root: FieldElement,
        kyc_commitment: FieldElement,
        threshold: FieldElement,
        amount_in_range: bool,
        sanctions_root: FieldElement,
        recipient_cleared: bool,
    ) -> Result<ComplianceProofBundle, String> {
        Ok(ComplianceProofBundle {
            kyc_proof: KYCProof {
                kyc_merkle_root: kyc_root,
                kyc_commitment,
                proof_valid: true,
            },
            amount_proof: AmountProof {
                reporting_threshold: threshold,
                amount_in_range,
                proof_valid: true,
            },
            sanctions_proof: SanctionsProof {
                sanctions_merkle_root: sanctions_root,
                recipient_cleared,
                proof_valid: true,
            },
            regulator_id: self.regulator_id,
            scope: self.scope,
        })
    }
    
    pub fn verify_bundle(bundle: &ComplianceProofBundle) -> bool {
        bundle.kyc_proof.proof_valid
            && bundle.amount_proof.proof_valid
            && bundle.sanctions_proof.proof_valid
    }
}
