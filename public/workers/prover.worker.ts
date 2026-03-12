/**
 * PHANTOM Prover Web Worker - Real ZK Proof Generation
 * 
 * CRITICAL: This worker requires the WASM module to be built.
 * Run: pnpm run circuits:build or bash scripts/build_wasm.sh
 * 
 * Without WASM, proof operations will fail with explicit errors.
 * NO FALLBACK TO MOCKS - security critical!
 */

/// <reference lib="webworker" />

// Type definitions for worker messages
type WorkerMessage =
  | { type: 'init'; wasmPath?: string }
  | { type: 'prove_shield'; id: string; inputs: ShieldProofInputs }
  | { type: 'prove_unshield'; id: string; inputs: UnshieldProofInputs }
  | { type: 'prove_private_swap'; id: string; inputs: PrivateSwapProofInputs }
  | { type: 'prove_yield_deposit'; id: string; inputs: YieldDepositProofInputs }
  | { type: 'prove_yield_claim'; id: string; inputs: YieldClaimProofInputs }
  | { type: 'prove_compliance'; id: string; inputs: ComplianceProofInputs }
  | { type: 'derive_commitment'; id: string; inputs: CommitmentInputs }
  | { type: 'derive_nullifier'; id: string; inputs: NullifierInputs }
  | { type: 'cancel'; id: string };

type WorkerResponse =
  | { type: 'ready' }
  | { type: 'proof_result'; id: string; success: true; proof: string }
  | { type: 'proof_result'; id: string; success: false; error: string }
  | { type: 'derived_result'; id: string; success: true; result: string }
  | { type: 'derived_result'; id: string; success: false; error: string }
  | { type: 'progress'; id: string; step: string }
  | { type: 'error'; message: string };

// Input types
interface ShieldProofInputs {
  commitment: string;
  assetId: number;
  amount: string;
  nullifierSecret: string;
  salt: string;
}

interface UnshieldProofInputs {
  nullifier: string;
  changeCommitment: string | null;
  merkleRoot: string;
  noteCommitment: string;
  noteAmount: string;
  noteAssetId: number;
  withdrawalAmount: string;
  nullifierSecret: string;
  serialNumber: string;
  merklePath: string[];
  changeAmount: string;
  newNullifierSecret: string;
  newSalt: string;
}

interface PrivateSwapProofInputs {
  nullifierIn: string;
  commitmentOut: string;
  merkleRoot: string;
  inputAmount: string;
  outputAmount: string;
  outputAssetId: number;
  outputNullifierSecret: string;
  outputSalt: string;
  minRate: string;
  maxRate: string;
}

interface YieldDepositProofInputs {
  depositCommitment: string;
  protocolId: number;
  nullifierIn: string;
  merkleRoot: string;
  depositAmount: string;
  yieldPositionSecret: string;
  depositTimestamp: number;
}

interface YieldClaimProofInputs {
  positionNullifier: string;
  yieldCommitment: string;
  remainingCommitment: string;
  merkleRoot: string;
  claimableYield: string;
  remainingPrincipal: string;
  claimTimestamp: number;
}

interface ComplianceProofInputs {
  regulatorId: string;
  scope: number;
  kycMerkleRoot: string;
  kycCommitment: string;
  reportingThreshold: string;
  amountInRange: boolean;
  sanctionsMerkleRoot: string;
  recipientCleared: boolean;
}

interface CommitmentInputs {
  amount: string;
  assetId: number;
  nullifierSecret: string;
  salt: string;
}

interface NullifierInputs {
  nullifierSecret: string;
  serialNumber: string;
}

// Global state - MUST have WASM loaded
let wasmModule: any = null;
let isReady = false;

// Error handler for uncaught errors
self.onerror = (event) => {
  console.error('[ProverWorker] Uncaught error:', event);
  const errorEvent = event as ErrorEvent;
  self.postMessage({
    type: 'error',
    message: errorEvent.message || 'Unknown worker error',
  } as WorkerResponse);
};

// Handle unhandled promise rejections
self.onunhandledrejection = (event) => {
  console.error('[ProverWorker] Unhandled rejection:', event.reason);
};

/**
 * Main message handler
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  const id = 'id' in msg ? (msg as any).id : 'unknown';

  // Handle initialization
  if (msg.type === 'init') {
    await handleInit(msg.wasmPath);
    return;
  }

  // Handle cancellation
  if (msg.type === 'cancel') {
    // Cancel is handled per-operation
    return;
  }

  // All other operations require WASM to be loaded
  if (!isReady || !wasmModule) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: 'WASM prover not initialized. Run "pnpm run circuits:build" or "bash scripts/build_wasm.sh" first.',
    } as WorkerResponse);
    return;
  }

  // Route to appropriate handler
  try {
    switch (msg.type) {
      case 'prove_shield':
        await handleProveShield(msg.id, msg.inputs);
        break;
      case 'prove_unshield':
        await handleProveUnshield(msg.id, msg.inputs);
        break;
      case 'prove_private_swap':
        await handleProvePrivateSwap(msg.id, msg.inputs);
        break;
      case 'prove_yield_deposit':
        await handleProveYieldDeposit(msg.id, msg.inputs);
        break;
      case 'prove_yield_claim':
        await handleProveYieldClaim(msg.id, msg.inputs);
        break;
      case 'prove_compliance':
        await handleProveCompliance(msg.id, msg.inputs);
        break;
      case 'derive_commitment':
        await handleDeriveCommitment(msg.id, msg.inputs);
        break;
      case 'derive_nullifier':
        await handleDeriveNullifier(msg.id, msg.inputs);
        break;
      default:
        throw new Error(`Unknown operation type: ${(msg as any).type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
});

/**
 * Initialize the WASM prover
 * CRITICAL: This MUST load real WASM module
 */
async function handleInit(wasmPath?: string): Promise<void> {
  try {
    // Try to load the WASM module
    // The module should be at /phantom_prover.js (built by wasm-pack)
    const modulePath = wasmPath || '/phantom_prover.js';
    
    try {
      wasmModule = await import(modulePath);
      await wasmModule.default();
      isReady = true;
      self.postMessage({ type: 'ready' } as WorkerResponse);
    } catch (importError) {
      // WASM not built yet - this is expected in development
      const errorMsg = importError instanceof Error 
        ? importError.message 
        : String(importError);
        
      console.error('[ProverWorker] WASM module not found:', errorMsg);
      self.postMessage({
        type: 'error',
        message: `WASM module not found at ${modulePath}. ` +
                 `Run 'pnpm run circuits:build' or 'bash scripts/build_wasm.sh' to build it. ` +
                 `Current error: ${errorMsg}`,
      } as WorkerResponse);
    }
  } catch (error) {
    console.error('[ProverWorker] Init failed:', error);
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to initialize',
    } as WorkerResponse);
  }
}

/**
 * Generate shield proof - REAL WASM call required
 */
async function handleProveShield(id: string, inputs: ShieldProofInputs): Promise<void> {
  if (!wasmModule?.prove_shield) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  self.postMessage({ type: 'progress', id, step: 'computing_commitment' } as WorkerResponse);
  
  try {
    const proof = wasmModule.prove_shield(
      inputs.commitment,
      inputs.assetId,
      inputs.amount,
      inputs.nullifierSecret,
      inputs.salt
    );
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Shield proof failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate unshield proof - REAL WASM call required
 */
async function handleProveUnshield(id: string, inputs: UnshieldProofInputs): Promise<void> {
  if (!wasmModule?.prove_unshield) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  self.postMessage({ type: 'progress', id, step: 'building_merkle_witness' } as WorkerResponse);
  
  try {
    const proof = wasmModule.prove_unshield(JSON.stringify(inputs));
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Unshield proof failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate private swap proof - REAL WASM call required
 */
async function handleProvePrivateSwap(id: string, inputs: PrivateSwapProofInputs): Promise<void> {
  if (!wasmModule?.prove_private_swap) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  self.postMessage({ type: 'progress', id, step: 'computing_exchange_rate' } as WorkerResponse);
  
  try {
    const proof = wasmModule.prove_private_swap(JSON.stringify(inputs));
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Private swap proof failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate yield deposit proof - REAL WASM call required
 */
async function handleProveYieldDeposit(id: string, inputs: YieldDepositProofInputs): Promise<void> {
  if (!wasmModule?.prove_yield_deposit) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  self.postMessage({ type: 'progress', id, step: 'computing_yield_commitment' } as WorkerResponse);
  
  try {
    const proof = wasmModule.prove_yield_deposit(JSON.stringify(inputs));
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Yield deposit proof failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate yield claim proof - REAL WASM call required
 */
async function handleProveYieldClaim(id: string, inputs: YieldClaimProofInputs): Promise<void> {
  if (!wasmModule?.prove_yield_claim) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  self.postMessage({ type: 'progress', id, step: 'computing_claim_proof' } as WorkerResponse);
  
  try {
    const proof = wasmModule.prove_yield_claim(JSON.stringify(inputs));
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Yield claim proof failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate compliance proof - REAL WASM call required
 */
async function handleProveCompliance(id: string, inputs: ComplianceProofInputs): Promise<void> {
  if (!wasmModule?.prove_compliance) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  self.postMessage({ type: 'progress', id, step: 'building_compliance_proof' } as WorkerResponse);
  
  try {
    const proof = wasmModule.prove_compliance(JSON.stringify(inputs));
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Compliance proof failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Derive commitment using REAL Poseidon from WASM
 */
async function handleDeriveCommitment(id: string, inputs: CommitmentInputs): Promise<void> {
  if (!wasmModule?.derive_commitment_js) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  try {
    const result = wasmModule.derive_commitment_js(
      inputs.amount,
      inputs.assetId,
      inputs.nullifierSecret,
      inputs.salt
    );
    
    self.postMessage({
      type: 'derived_result',
      id,
      success: true,
      result,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Commitment derivation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Derive nullifier using REAL Poseidon from WASM
 */
async function handleDeriveNullifier(id: string, inputs: NullifierInputs): Promise<void> {
  if (!wasmModule?.derive_nullifier_js) {
    throw new Error('WASM prover not available. Build WASM with: pnpm run circuits:build');
  }
  
  try {
    const result = wasmModule.derive_nullifier_js(
      inputs.nullifierSecret,
      inputs.serialNumber
    );
    
    self.postMessage({
      type: 'derived_result',
      id,
      success: true,
      result,
    } as WorkerResponse);
  } catch (error) {
    throw new Error(`Nullifier derivation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
