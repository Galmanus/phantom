/**
 * ProverWorkerClient - Communicates with WASM prover in Web Worker
 * 
 * All proof generation runs off the main thread to avoid blocking the UI.
 */

import type { ShieldedNote, YieldPosition } from '../types';

type ProverRequestType =
  | 'prove_shield'
  | 'prove_unshield'
  | 'prove_private_swap'
  | 'prove_yield_deposit'
  | 'prove_yield_claim'
  | 'prove_compliance'
  | 'prove_intent'
  | 'derive_commitment'
  | 'derive_nullifier';

interface ProverRequest {
  id: string;
  type: ProverRequestType;
  inputs: Record<string, unknown>;
}

interface ProverResponse {
  id?: string;
  success: boolean;
  result?: string;
  error?: string;
  type?: string;
}

export class ProverWorkerClient {
  private worker: Worker | null = null;
  private initialized = false;
  private pendingRequests = new Map<string, {
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }>();

  constructor(private wasmPath: string) {}

  /**
   * Initialize the worker and load WASM
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      try {
        // Worker loaded from public/workers directory
        this.worker = new Worker('/workers/prover.worker.js');
        
        this.worker.onmessage = (event: MessageEvent) => {
          const data = event.data as ProverResponse;
          this.handleResponse(data);
        };

        this.worker.onerror = (error) => {
          console.error('Worker error:', error);
          reject(new Error('Failed to initialize prover worker'));
        };

        // Send initialization message
        this.worker.postMessage({
          type: 'init',
          wasmPath: this.wasmPath,
        });

        // Wait for ready signal
        const initHandler = (event: MessageEvent<ProverResponse>) => {
          if (event.data.type === 'ready') {
            this.worker!.removeEventListener('message', initHandler);
            this.initialized = true;
            resolve();
          }
        };
        
        this.worker.addEventListener('message', initHandler);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.initialized) {
            reject(new Error('Worker initialization timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(new Error(`Failed to create worker: ${error}`));
      }
    });
  }

  /**
   * Handle response from worker
   */
  private handleResponse(response: ProverResponse): void {
    const pending = this.pendingRequests.get(response.id || '');
    if (!pending) return;

    this.pendingRequests.delete(response.id || '');

    if (response.success && response.result !== undefined) {
      pending.resolve(response.result);
    } else {
      pending.reject(new Error(response.error || 'Unknown error'));
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send request to worker
   */
  private async sendRequest(
    type: ProverRequestType,
    inputs: Record<string, unknown>
  ): Promise<string> {
    if (!this.worker || !this.initialized) {
      throw new Error('Worker not initialized');
    }

    const id = this.generateRequestId();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.worker!.postMessage({
        id,
        type,
        inputs,
      } as ProverRequest);

      // Timeout after 5 minutes (proof generation can take time)
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Proof generation timeout'));
        }
      }, 300000);
    });
  }

  /**
   * Generate shield proof
   */
  async proveShield(params: {
    commitment: string;
    assetId: number;
    amount: string;
    nullifierSecret: string;
    salt: string;
  }): Promise<string> {
    return this.sendRequest('prove_shield', params);
  }

  /**
   * Generate unshield proof
   */
  async proveUnshield(params: {
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
  }): Promise<string> {
    return this.sendRequest('prove_unshield', params);
  }

  /**
   * Generate private swap proof
   */
  async provePrivateSwap(params: {
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
  }): Promise<string> {
    return this.sendRequest('prove_private_swap', params);
  }

  /**
   * Generate yield deposit proof
   */
  async proveYieldDeposit(params: {
    depositCommitment: string;
    protocolId: number;
    nullifierIn: string;
    merkleRoot: string;
    depositAmount: string;
    yieldPositionSecret: string;
    depositTimestamp: number;
  }): Promise<string> {
    return this.sendRequest('prove_yield_deposit', params);
  }

  /**
   * Generate yield claim proof
   */
  async proveYieldClaim(params: {
    positionNullifier: string;
    yieldCommitment: string;
    remainingCommitment: string;
    merkleRoot: string;
    claimableYield: string;
    remainingPrincipal: string;
    claimTimestamp: number;
  }): Promise<string> {
    return this.sendRequest('prove_yield_claim', params);
  }

  /**
   * Generate compliance proof bundle
   */
  async proveCompliance(params: {
    regulatorId: string;
    scope: number;
    kycMerkleRoot: string;
    kycCommitment: string;
    reportingThreshold: string;
    amountInRange: boolean;
    sanctionsMerkleRoot: string;
    recipientCleared: boolean;
  }): Promise<string> {
    return this.sendRequest('prove_compliance', params);
  }

  /**
   * Generate intent proof
   */
  async proveIntent(params: {
    assetIn: string;
    amountIn: string;
    assetOut: string;
    minAmountOut: string;
    nullifierSecret: string;
    deadline: number;
  }): Promise<string> {
    return this.sendRequest('prove_intent', params);
  }

  /**
   * Derive commitment (helper function)
   */
  async deriveCommitment(params: {
    amount: string;
    assetId: number;
    nullifierSecret: string;
    salt: string;
  }): Promise<string> {
    return this.sendRequest('derive_commitment', params);
  }

  /**
   * Derive nullifier (helper function)
   */
  async deriveNullifier(params: {
    nullifierSecret: string;
    serialNumber: string;
  }): Promise<string> {
    return this.sendRequest('derive_nullifier', params);
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.initialized = false;
      this.pendingRequests.clear();
    }
  }
}
