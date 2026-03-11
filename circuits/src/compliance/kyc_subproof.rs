//! KYC sub-proof for compliance

use crate::crypto::poseidon::FieldElement;

pub struct KYCSubProof {
    pub kyc_merkle_root: FieldElement,
    pub kyc_commitment: FieldElement,
}
