//! Matching proof utilities for intent matching

use starknet_crypto::FieldElement;
use super::circuit::MatchingProof;

pub fn verify_intent_match(
    intent_a_asset_in: FieldElement,
    intent_a_asset_out: FieldElement,
    intent_b_asset_in: FieldElement,
    intent_b_asset_out: FieldElement,
) -> bool {
    intent_a_asset_in == intent_b_asset_out
        && intent_a_asset_out == intent_b_asset_in
}
