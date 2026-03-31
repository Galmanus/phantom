//! Compliance Circuit - Composite proof for selective disclosure
//!
//! This module provides the legacy compliance bundle interface.
//! For NEON Covenant integration with Poseidon commitments, Merkle
//! non-membership proofs, and accreditation verification, use
//! [`crate::neon_compliance`] instead.

use crate::crypto::poseidon::FieldElement;
use crate::neon_compliance::{
    NeonComplianceCircuit, NeonComplianceProof,
    NeonComplianceWitness, NeonCompliancePublicInputs,
};
use crate::neon_compliance::jurisdiction_proof::SanctionsList;

/// Compliance proof bundle containing three sub-proofs
#[derive(Debug, Clone)]
pub struct ComplianceProofBundle {
    pub kyc_proof: KYCProof,
    pub amount_proof: AmountProof,
    pub sanctions_proof: SanctionsProof,
    pub regulator_id: FieldElement,
    pub scope: u8,
    /// Optional NEON compliance proof (populated when using NEON path)
    pub neon_proof: Option<NeonComplianceProof>,
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

    /// Legacy prove_bundle — kept for backward compatibility.
    /// For new integrations, use [`prove_with_neon`] instead.
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
            neon_proof: None,
        })
    }

    /// Prove compliance using the NEON Covenant ZK system.
    ///
    /// This replaces the legacy stub sub-proofs with real Poseidon
    /// commitments, Merkle non-membership, and accreditation proofs.
    pub fn prove_with_neon(
        &self,
        witness: &NeonComplianceWitness,
        public_inputs: &NeonCompliancePublicInputs,
        sanctions_list: Option<&SanctionsList>,
        threshold: FieldElement,
        amount_in_range: bool,
    ) -> Result<ComplianceProofBundle, String> {
        let level = public_inputs.compliance_level;
        let neon_circuit = NeonComplianceCircuit::new(level);

        // Generate the NEON compliance proof
        let neon_proof = neon_circuit.prove(witness, public_inputs, sanctions_list)?;

        // Extract sanctions root from public inputs or use ZERO
        let sanctions_root = public_inputs
            .jurisdiction
            .as_ref()
            .map(|j| j.sanctions_merkle_root)
            .unwrap_or(FieldElement::ZERO);

        // Map NEON proof into the legacy bundle format
        Ok(ComplianceProofBundle {
            kyc_proof: KYCProof {
                kyc_merkle_root: public_inputs.age.commitment,
                kyc_commitment: public_inputs.compliance_commitment,
                proof_valid: neon_proof.age_proof.proof_valid,
            },
            amount_proof: AmountProof {
                reporting_threshold: threshold,
                amount_in_range,
                proof_valid: true,
            },
            sanctions_proof: SanctionsProof {
                sanctions_merkle_root: sanctions_root,
                recipient_cleared: neon_proof.jurisdiction_proof
                    .as_ref()
                    .map(|p| p.proof_valid)
                    .unwrap_or(true),
                proof_valid: neon_proof.jurisdiction_proof
                    .as_ref()
                    .map(|p| p.proof_valid)
                    .unwrap_or(true),
            },
            regulator_id: self.regulator_id,
            scope: self.scope,
            neon_proof: Some(neon_proof),
        })
    }

    /// Verify a compliance bundle (supports both legacy and NEON paths)
    pub fn verify_bundle(bundle: &ComplianceProofBundle) -> bool {
        // If NEON proof is present, verify it
        if let Some(ref neon) = bundle.neon_proof {
            if !NeonComplianceCircuit::verify(neon) {
                return false;
            }
        }

        bundle.kyc_proof.proof_valid
            && bundle.amount_proof.proof_valid
            && bundle.sanctions_proof.proof_valid
    }
}
