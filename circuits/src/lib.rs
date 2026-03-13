//! PHANTOM Prover - ZK Circuits for Private BTCFi on Starknet
//! 
//! This crate provides zero-knowledge proof circuits using Stwo,
//! optimized for WASM execution in the browser.

pub mod crypto;
pub mod shield;    // PLACEHOLDER: Real Stwo proof pending Starknet 0.14.2
pub mod unshield;  // PLACEHOLDER: Real Stwo proof pending Starknet 0.14.2
pub mod private_swap;
pub mod private_yield;
pub mod compliance;
pub mod intent;

#[cfg(feature = "wasm")]
pub mod wasm;

pub use crypto::poseidon;
pub use crypto::merkle;
pub use crypto::nullifier;

// Re-export helper functions for WASM bindings
pub use crypto::poseidon::{fe_to_hex, fe_from_hex, fe_from_u64};
