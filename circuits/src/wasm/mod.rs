//! WASM module for browser prover

#[cfg(feature = "wasm")]
pub mod bindings;

#[cfg(feature = "wasm")]
pub use bindings::*;
