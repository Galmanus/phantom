/**
 * Prover Web Worker - Runs ZK proof generation off the main thread
 * 
 * OBSTACLE 2 SOLUTION:
 * All proof generation runs in a Web Worker to avoid blocking the UI.
 * This allows the browser to remain responsive while proofs are generated.
 * 
 * The worker communicates with the main thread via postMessage:
 * - Input: { type: 'prove_shield' | 'prove_unshield' | ..., inputs: {...} }
 * - Output: { type: 'proof_result', success: true/false, proof/error }
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

// Global state
let phantomProver: any = null;
let isReady = false;
let currentOperation: string | null = null;

/**
 * Simple sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  if (currentOperation) {
    const id = currentOperation;
    currentOperation = null;
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: event.reason?.message || String(event.reason),
    } as WorkerResponse);
  }
};

/**
 * Main message handler
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  // Handle initialization
  if (msg.type === 'init') {
    await handleInit(msg.wasmPath);
    return;
  }

  // Handle cancellation
  if (msg.type === 'cancel') {
    handleCancel(msg.id);
    return;
  }

  // All other operations require initialization
  if (!isReady || !phantomProver) {
    const id = 'id' in msg ? (msg as any).id : 'unknown';
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: 'Prover not initialized',
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
    const id = 'id' in msg ? (msg as any).id : 'unknown';
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
 */
async function handleInit(wasmPath?: string): Promise<void> {
  try {
    // In a full implementation, we would dynamically import the WASM module
    // For now, we set up the worker to be ready for when WASM is loaded
    
    // TODO: Load WASM module
    // const wasmModule = await import(wasmPath || '/phantom_prover.js');
    // await wasmModule.default();
    // phantomProver = new wasmModule.PhantomProver();
    
    isReady = true;
    self.postMessage({ type: 'ready' } as WorkerResponse);
  } catch (error) {
    console.error('[ProverWorker] Init failed:', error);
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to initialize',
    } as WorkerResponse);
  }
}

/**
 * Handle proof cancellation
 */
function handleCancel(id: string): void {
  if (currentOperation === id) {
    currentOperation = null;
    // In a full implementation, we would abort the WASM operation
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: 'Proof generation cancelled',
    } as WorkerResponse);
  }
}

/**
 * Generate shield proof
 */
async function handleProveShield(id: string, inputs: ShieldProofInputs): Promise<void> {
  currentOperation = id;
  
  self.postMessage({ type: 'progress', id, step: 'computing_commitment' } as WorkerResponse);
  
  try {
    // In production, this would call the actual WASM prover:
    // const proof = await phantomProver.prove_shield(JSON.stringify(inputs));
    
    // For now, simulate proof generation
    await simulateProofGeneration(id, 'shield');
    
    // Return a mock proof (in production, this would be real)
    const mockProof = generateMockProof(inputs.commitment);
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof: mockProof,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  } finally {
    currentOperation = null;
  }
}

/**
 * Generate unshield proof
 */
async function handleProveUnshield(id: string, inputs: UnshieldProofInputs): Promise<void> {
  currentOperation = id;
  
  self.postMessage({ type: 'progress', id, step: 'building_merkle_witness' } as WorkerResponse);
  
  try {
    await simulateProofGeneration(id, 'unshield');
    
    const mockProof = generateMockProof(inputs.nullifier);
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof: mockProof,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  } finally {
    currentOperation = null;
  }
}

/**
 * Generate private swap proof
 */
async function handleProvePrivateSwap(id: string, inputs: PrivateSwapProofInputs): Promise<void> {
  currentOperation = id;
  
  self.postMessage({ type: 'progress', id, step: 'computing_exchange_rate' } as WorkerResponse);
  
  try {
    await simulateProofGeneration(id, 'private_swap');
    
    const mockProof = generateMockProof(inputs.nullifierIn + inputs.commitmentOut);
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof: mockProof,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  } finally {
    currentOperation = null;
  }
}

/**
 * Generate yield deposit proof
 */
async function handleProveYieldDeposit(id: string, inputs: YieldDepositProofInputs): Promise<void> {
  currentOperation = id;
  
  self.postMessage({ type: 'progress', id, step: 'computing_yield_commitment' } as WorkerResponse);
  
  try {
    await simulateProofGeneration(id, 'yield_deposit');
    
    const mockProof = generateMockProof(inputs.depositCommitment);
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof: mockProof,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  } finally {
    currentOperation = null;
  }
}

/**
 * Generate yield claim proof
 */
async function handleProveYieldClaim(id: string, inputs: YieldClaimProofInputs): Promise<void> {
  currentOperation = id;
  
  self.postMessage({ type: 'progress', id, step: 'computing_claim_proof' } as WorkerResponse);
  
  try {
    await simulateProofGeneration(id, 'yield_claim');
    
    const mockProof = generateMockProof(inputs.positionNullifier);
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof: mockProof,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  } finally {
    currentOperation = null;
  }
}

/**
 * Generate compliance proof
 */
async function handleProveCompliance(id: string, inputs: ComplianceProofInputs): Promise<void> {
  currentOperation = id;
  
  self.postMessage({ type: 'progress', id, step: 'building_compliance_proof' } as WorkerResponse);
  
  try {
    await simulateProofGeneration(id, 'compliance');
    
    const mockProof = generateMockProof(inputs.kycCommitment + inputs.sanctionsMerkleRoot);
    
    self.postMessage({
      type: 'proof_result',
      id,
      success: true,
      proof: mockProof,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'proof_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  } finally {
    currentOperation = null;
  }
}

/**
 * Derive commitment (helper function)
 */
async function handleDeriveCommitment(id: string, inputs: CommitmentInputs): Promise<void> {
  try {
    // In production, this would use Poseidon:
    // const commitment = await phantomProver.derive_commitment_js(
    //   inputs.amount,
    //   inputs.assetId,
    //   inputs.nullifierSecret,
    //   inputs.salt
    // );
    
    // Mock commitment derivation
    const mockCommitment = `0x${btoa(
      inputs.amount + inputs.assetId + inputs.nullifierSecret + inputs.salt
    ).slice(0, 64).padEnd(64, '0')}`;
    
    self.postMessage({
      type: 'derived_result',
      id,
      success: true,
      result: mockCommitment,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'derived_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
}

/**
 * Derive nullifier (helper function)
 */
async function handleDeriveNullifier(id: string, inputs: NullifierInputs): Promise<void> {
  try {
    // In production, this would use Poseidon:
    // const nullifier = await phantomProver.derive_nullifier_js(
    //   inputs.nullifierSecret,
    //   inputs.serialNumber
    // );
    
    // Mock nullifier derivation
    const mockNullifier = `0x${btoa(
      inputs.nullifierSecret + inputs.serialNumber + 'PHANTOM_V1_NULLIFIER'
    ).slice(0, 64).padEnd(64, '0')}`;
    
    self.postMessage({
      type: 'derived_result',
      id,
      success: true,
      result: mockNullifier,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: 'derived_result',
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
}

/**
 * Simulate proof generation with progress updates
 * 
 * In production, this would be actual WASM proving time.
 * Expected times (from StarkWare benchmarks):
 * - Shield: ~100ms
 * - Unshield: ~150ms
 * - Private Swap: ~250ms
 * - Yield: ~200ms
 * - Compliance: ~300ms
 */
async function simulateProofGeneration(id: string, proofType: string): Promise<void> {
  const delays: Record<string, number> = {
    shield: 100,
    unshield: 150,
    private_swap: 250,
    yield_deposit: 200,
    yield_claim: 200,
    compliance: 300,
  };
  
  const baseDelay = delays[proofType] || 100;
  
  // Simulate progressive steps
  const steps = ['initializing', 'witness_generation', 'constraint_evaluation', 'proof_compression'];
  
  for (const step of steps) {
    self.postMessage({ type: 'progress', id, step } as WorkerResponse);
    await sleep(baseDelay / steps.length);
  }
}

/**
 * Generate a mock proof for development
 * In production, this would be replaced with actual WASM proof generation
 */
function generateMockProof(seed: string): string {
  // Create a deterministic mock proof based on input
  const hash = btoa(seed);
  // Pad to create a mock proof
  const proof = hash.repeat(20).slice(0, 1024);
  
  return '0x' + btoa(proof).replace(/=/g, '').slice(0, 1024);
}

// Export types for TypeScript
export type { WorkerMessage, WorkerResponse };
