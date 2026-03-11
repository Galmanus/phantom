//! Merkle path utilities for unshield proofs

use crate::crypto::merkle::{MerkleProof, MerklePathElement, verify_path};
use crate::crypto::poseidon::FieldElement;

/// Verify a Merkle path against a root
pub fn verify_unshield_merkle_path(
    note_commitment: FieldElement,
    merkle_path: &MerkleProof,
    merkle_root: FieldElement,
) -> bool {
    verify_path(note_commitment, merkle_path, merkle_root)
}
