//! Sanctions screening sub-proof for compliance

use crate::crypto::poseidon::FieldElement;

pub struct SanctionsSubProof {
    pub sanctions_merkle_root: FieldElement,
    pub recipient_cleared: bool,
}
