/**
 * PHANTOM Prover Web Worker
 * 
 * Handles ZK proof generation in a background thread to avoid blocking the UI.
 * Uses the Stwo WASM module for proof generation.
 */

let wasmModule = null;

// Initialize the WASM module
async function initWasm() {
  if (wasmModule) return wasmModule;
  
  try {
    // Import the WASM module from the public directory
    const wasm = await import('/wasm/phantom_prover_wasm.js');
    await wasm.default();
    wasmModule = wasm;
    return wasmModule;
  } catch (error) {
    throw new Error(`Failed to load WASM module: ${error.message}`);
  }
}

// Handle incoming messages
self.onmessage = async function(event) {
  const { id, type, payload } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'init':
        await initWasm();
        result = { success: true };
        break;
        
      case 'prove_shield':
        // Ensure WASM is loaded
        const wasm = await initWasm();
        
        // Generate shield proof
        const proofInput = {
          amount: payload.amount,
          asset_id: payload.assetId,
          nullifier_secret: payload.nullifierSecret,
          salt: payload.salt
        };
        
        // Call the WASM function
        const proofOutput = wasm.prove_shield_wasm(proofInput);
        
        // Return full proof output as JSON string
        result = {
          success: true,
          result: JSON.stringify({
            proof: proofOutput.proof_hex,
            commitment: proofOutput.commitment,
            nullifierHash: proofOutput.nullifier_hash,
            assetId: proofOutput.asset_id
          })
        };
        break;
        
      case 'get_circuit_info':
        const wasmInfo = await initWasm();
        const info = wasmInfo.get_circuit_info(payload.circuitName);
        result = { success: true, result: info };
        break;
        
      case 'get_version':
        const wasmVer = await initWasm();
        result = { success: true, result: wasmVer.get_version() };
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    self.postMessage({ id, ...result });
  } catch (error) {
    self.postMessage({ 
      id, 
      success: false,
      error: error.message 
    });
  }
};

// Signal that the worker is ready
self.postMessage({ type: 'ready' });
