//! PHANTOM ZK Prover WASM Bindings
//!
//! This module provides WASM bindings for the PHANTOM ZK circuits,
//! enabling browser-based proof generation.

use wasm_bindgen::prelude::*;
use phantom_prover::shield::{prove_shield};
use phantom_prover::crypto::poseidon::{FieldElement, derive_commitment};

/// Initialize panic hook for better error messages in WASM
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Shield proof input
#[wasm_bindgen]
#[derive(serde::Serialize, serde::Deserialize)]
pub struct ShieldProofInput {
    amount: u64,
    asset_id: u8,
    nullifier_secret: u64,
    salt: u64,
}

#[wasm_bindgen]
impl ShieldProofInput {
    #[wasm_bindgen(constructor)]
    pub fn new(
        amount: u64,
        asset_id: u8,
        nullifier_secret: u64,
        salt: u64,
    ) -> ShieldProofInput {
        ShieldProofInput {
            amount,
            asset_id,
            nullifier_secret,
            salt,
        }
    }
}

/// Shield proof output
#[wasm_bindgen]
pub struct ShieldProofOutput {
    proof_hex: String,
    commitment: String,
    nullifier_hash: String,
    asset_id: u8,
}

#[wasm_bindgen]
impl ShieldProofOutput {
    #[wasm_bindgen(getter)]
    pub fn proof_hex(&self) -> String {
        self.proof_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn commitment(&self) -> String {
        self.commitment.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nullifier_hash(&self) -> String {
        self.nullifier_hash.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn asset_id(&self) -> u8 {
        self.asset_id
    }
}

/// Generate a shield proof
#[wasm_bindgen]
pub fn prove_shield_wasm(input: JsValue) -> Result<ShieldProofOutput, JsValue> {
    let input: ShieldProofInput = serde_wasm_bindgen::from_value(input)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse input: {}", e)))?;;

    let amount = FieldElement::from_u64(input.amount);
    let nullifier_secret = FieldElement::from_u64(input.nullifier_secret);
    let salt = FieldElement::from_u64(input.salt);
    
    // Compute commitment
    let commitment = derive_commitment(&amount, input.asset_id, &nullifier_secret, &salt);
    
    // Generate proof
    let proof = prove_shield(commitment, input.asset_id, amount, nullifier_secret, salt)
        .map_err(|e| JsValue::from_str(&format!("Proof generation failed: {}", e)))?;

    Ok(ShieldProofOutput {
        proof_hex: proof.to_hex(),
        commitment: commitment.to_hex(),
        nullifier_hash: FieldElement::from_u64(input.nullifier_secret).to_hex(),
        asset_id: input.asset_id,
    })
}

/// Verify a shield proof
#[wasm_bindgen]
pub fn verify_shield_wasm(proof_hex: String, commitment: String, asset_id: u8) -> Result<bool, JsValue> {
    use phantom_prover::shield::verify_shield;
    
    let commitment_fe = FieldElement::from_hex(&commitment[2..])
        .map_err(|e| JsValue::from_str(&format!("Invalid commitment: {}", e)))?;
    
    Ok(verify_shield(&proof_hex, commitment_fe, asset_id))
}

/// Get circuit info
#[wasm_bindgen]
pub fn get_circuit_info(circuit_name: &str) -> String {
    match circuit_name {
        "shield" => serde_json::json!({
            "name": "shield",
            "constraints": 4300,
            "trace_height": 256,
            "description": "Shield (deposit) circuit - proves commitment formation"
        }).to_string(),
        "unshield" => serde_json::json!({
            "name": "unshield",
            "constraints": 5000,
            "trace_height": 512,
            "description": "Unshield (withdraw) circuit - proves note spending"
        }).to_string(),
        "private_swap" => serde_json::json!({
            "name": "private_swap",
            "constraints": 7500,
            "trace_height": 1024,
            "description": "Private swap circuit - proves atomic exchange"
        }).to_string(),
        "private_yield" => serde_json::json!({
            "name": "private_yield",
            "constraints": 6000,
            "trace_height": 512,
            "description": "Private yield circuit - proves yield accumulation"
        }).to_string(),
        "compliance" => serde_json::json!({
            "name": "compliance",
            "constraints": 8000,
            "trace_height": 512,
            "description": "Compliance circuit - proves KYC/sanctions status"
        }).to_string(),
        "intent" => serde_json::json!({
            "name": "intent",
            "constraints": 4000,
            "trace_height": 256,
            "description": "Intent circuit - proves intent validity"
        }).to_string(),
        _ => serde_json::json!({
            "error": "Unknown circuit"
        }).to_string(),
    }
}

/// Get library version
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
