//! WASM bindings for PHANTOM prover
//! 
//! Exposes all provers to TypeScript via wasm-bindgen.

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
use crate::crypto::poseidon::{FieldElement, derive_commitment, poseidon_hash_3};
#[cfg(feature = "wasm")]
use crate::crypto::nullifier::derive_nullifier;
#[cfg(feature = "wasm")]
use crate::shield::circuit::{ShieldCircuit, ShieldProof};
#[cfg(feature = "wasm")]
use crate::unshield::circuit::{UnshieldCircuit, UnshieldPublicInputs, UnshieldWitness};
#[cfg(feature = "wasm")]
use crate::private_swap::circuit::{PrivateSwapCircuit, PrivateSwapPublicInputs, PrivateSwapWitness};

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn prove_shield(
    commitment_hex: &str,
    asset_id: u8,
    amount_hex: &str,
    nullifier_secret_hex: &str,
    salt_hex: &str,
) -> Result<String, JsValue> {
    // Initialize panic hook for better error messages
    console_error_panic_hook::set_once();
    
    // Parse inputs
    let commitment = FieldElement::from_hex(commitment_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid commitment: {}", e)))?;
    let amount = FieldElement::from_hex(amount_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid amount: {}", e)))?;
    let nullifier_secret = FieldElement::from_hex(nullifier_secret_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid secret: {}", e)))?;
    let salt = FieldElement::from_hex(salt_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid salt: {}", e)))?;
    
    // Create circuit
    let circuit = ShieldCircuit::new(commitment, asset_id, amount, nullifier_secret, salt);
    
    // Generate proof
    let proof = circuit.prove()
        .map_err(|e| JsValue::from_str(&e))?;
    
    // Serialize to hex
    Ok(proof.to_hex())
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn verify_shield(
    proof_hex: &str,
    commitment_hex: &str,
    asset_id: u8,
) -> bool {
    let Ok(commitment) = FieldElement::from_hex(commitment_hex) else {
        return false;
    };
    
    let Ok(proof) = ShieldProof::from_hex(proof_hex) else {
        return false;
    };
    
    if proof.public_inputs.commitment.0 != commitment.0 
        || proof.public_inputs.asset_id != asset_id 
    {
        return false;
    }
    
    ShieldCircuit::verify(&proof)
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn derive_commitment_js(
    amount_hex: &str,
    asset_id: u8,
    nullifier_secret_hex: &str,
    salt_hex: &str,
) -> Result<String, JsValue> {
    let amount = FieldElement::from_hex(amount_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    let nullifier_secret = FieldElement::from_hex(nullifier_secret_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    let salt = FieldElement::from_hex(salt_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    
    let commitment = derive_commitment(&amount, asset_id, &nullifier_secret, &salt);
    Ok(commitment.to_hex())
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn derive_nullifier_js(
    nullifier_secret_hex: &str,
    serial_number_hex: &str,
) -> Result<String, JsValue> {
    let nullifier_secret = FieldElement::from_hex(nullifier_secret_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    let serial_number = FieldElement::from_hex(serial_number_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    
    let nullifier = derive_nullifier(&nullifier_secret, &serial_number);
    Ok(nullifier.to_hex())
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn poseidon_hash_js(
    left_hex: &str,
    right_hex: &str,
) -> Result<String, JsValue> {
    let left = FieldElement::from_hex(left_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    let right = FieldElement::from_hex(right_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    
    let result = crate::crypto::poseidon::poseidon_hash(&left, &right);
    Ok(result.to_hex())
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn poseidon_hash_3_js(
    a_hex: &str,
    b_hex: &str,
    c_hex: &str,
) -> Result<String, JsValue> {
    let a = FieldElement::from_hex(a_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    let b = FieldElement::from_hex(b_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    let c = FieldElement::from_hex(c_hex)
        .map_err(|e| JsValue::from_str(&e))?;
    
    let result = crate::crypto::poseidon::poseidon_hash_3(&a, &b, &c);
    Ok(result.to_hex())
}
