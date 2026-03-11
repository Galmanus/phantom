/**
 * ProverWorkerClient - Communicates with WASM prover in Web Worker
 *
 * All proof generation runs off the main thread to avoid blocking the UI.
 */
export class ProverWorkerClient {
    wasmPath;
    worker = null;
    initialized = false;
    pendingRequests = new Map();
    constructor(wasmPath) {
        this.wasmPath = wasmPath;
    }
    /**
     * Initialize the worker and load WASM
     */
    async initialize() {
        if (this.initialized)
            return;
        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker(new URL('../../frontend/workers/prover.worker.ts', import.meta.url));
                this.worker.onmessage = (event) => {
                    this.handleResponse(event.data);
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
                const initHandler = (event) => {
                    if (event.data.type === 'ready') {
                        this.worker.removeEventListener('message', initHandler);
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
            }
            catch (error) {
                reject(new Error(`Failed to create worker: ${error}`));
            }
        });
    }
    /**
     * Handle response from worker
     */
    handleResponse(response) {
        const pending = this.pendingRequests.get(response.id);
        if (!pending)
            return;
        this.pendingRequests.delete(response.id);
        if (response.success && response.result !== undefined) {
            pending.resolve(response.result);
        }
        else {
            pending.reject(new Error(response.error || 'Unknown error'));
        }
    }
    /**
     * Generate a unique request ID
     */
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Send request to worker
     */
    async sendRequest(type, inputs) {
        if (!this.worker || !this.initialized) {
            throw new Error('Worker not initialized');
        }
        const id = this.generateRequestId();
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.worker.postMessage({
                id,
                type,
                inputs,
            });
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
    async proveShield(params) {
        return this.sendRequest('prove_shield', params);
    }
    /**
     * Generate unshield proof
     */
    async proveUnshield(params) {
        return this.sendRequest('prove_unshield', params);
    }
    /**
     * Generate private swap proof
     */
    async provePrivateSwap(params) {
        return this.sendRequest('prove_private_swap', params);
    }
    /**
     * Generate yield deposit proof
     */
    async proveYieldDeposit(params) {
        return this.sendRequest('prove_yield_deposit', params);
    }
    /**
     * Generate yield claim proof
     */
    async proveYieldClaim(params) {
        return this.sendRequest('prove_yield_claim', params);
    }
    /**
     * Generate compliance proof bundle
     */
    async proveCompliance(params) {
        return this.sendRequest('prove_compliance', params);
    }
    /**
     * Generate intent proof
     */
    async proveIntent(params) {
        return this.sendRequest('prove_intent', params);
    }
    /**
     * Derive commitment (helper function)
     */
    async deriveCommitment(params) {
        return this.sendRequest('derive_commitment', params);
    }
    /**
     * Derive nullifier (helper function)
     */
    async deriveNullifier(params) {
        return this.sendRequest('derive_nullifier', params);
    }
    /**
     * Terminate the worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.initialized = false;
            this.pendingRequests.clear();
        }
    }
}
//# sourceMappingURL=ProverWorkerClient.js.map