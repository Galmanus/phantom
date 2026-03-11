//! PHANTOM Prover - ZK Circuits for Private BTCFi on Starknet
//! 
//! This crate provides zero-knowledge proof circuits using Stwo,
//! optimized for WASM execution in the browser.

pub mod crypto;
pub mod shield;
pub mod unshield;
pub mod private_swap;
pub mod private_yield;
pub mod compliance;
pub mod intent;

#[cfg(feature = "wasm")]
pub mod wasm;

pub use crypto::poseidon;
pub use crypto::merkle;
pub use crypto::nullifier;
