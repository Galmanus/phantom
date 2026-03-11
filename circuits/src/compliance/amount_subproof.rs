//! Amount range sub-proof for compliance

use crate::crypto::poseidon::FieldElement;

pub struct AmountSubProof {
    pub reporting_threshold: FieldElement,
    pub amount_in_range: bool,
}
