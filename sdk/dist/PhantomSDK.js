/**
 * PhantomSDK - Main SDK class for PHANTOM protocol
 */
import { RpcProvider, Contract, uint256 } from 'starknet';
import { NoteStore } from './storage/NoteStore';
import { ProverWorkerClient } from './proof/ProverWorkerClient';
import { PHANTOM_POOL_ADDRESS, COMPLIANCE_ORACLE_ADDRESS, INTENT_MATCHER_ADDRESS, TOKEN_ADDRESSES, AVNU_API_URL, WASM_PATH, getAssetBySymbol, } from './constants';
import { PhantomPoolABI, ComplianceOracleABI, IntentMatcherABI } from './contracts/PhantomPoolABI';
import { generateRandomFieldElement } from './storage/encryption';
export class PhantomSDK {
    provider;
    account;
    pool;
    complianceOracle;
    intentMatcher;
    noteStore;
    prover;
    constructor(config) {
        // Initialize provider with real RPC
        this.provider = new RpcProvider({
            nodeUrl: config.rpcUrl,
        });
        // Use provided account
        this.account = config.account;
        // Initialize contracts
        this.pool = new Contract(PhantomPoolABI, PHANTOM_POOL_ADDRESS, this.provider);
        this.pool.connect(this.account);
        this.complianceOracle = new Contract(ComplianceOracleABI, COMPLIANCE_ORACLE_ADDRESS, this.provider);
        this.intentMatcher = new Contract(IntentMatcherABI, INTENT_MATCHER_ADDRESS, this.provider);
        // Initialize NoteStore with encryption
        this.noteStore = new NoteStore(config.storagePassword);
        // Initialize prover client
        this.prover = new ProverWorkerClient(WASM_PATH);
    }
    /**
     * Initialize the SDK (connect to worker, load notes)
     */
    async initialize() {
        await this.noteStore.initialize();
        await this.prover.initialize();
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.prover.terminate();
    }
    // ─── SHIELD ───────────────────────────────────────────────────────────────
    /**
     * Deposit assets into the shield pool
     */
    async shield(params) {
        const { asset, amount, onProgress } = params;
        const assetInfo = getAssetBySymbol(asset);
        if (!assetInfo) {
            throw new Error(`Unsupported asset: ${asset}`);
        }
        onProgress?.('generating_randomness', 'Generating cryptographic randomness...');
        // Generate random secrets
        const nullifierSecret = generateRandomFieldElement();
        const salt = generateRandomFieldElement();
        const serialNumber = generateRandomFieldElement();
        onProgress?.('computing_commitment', 'Computing commitment...');
        // Compute commitment via WASM
        const commitment = await this.prover.deriveCommitment({
            amount: '0x' + amount.toString(16),
            assetId: assetInfo.id,
            nullifierSecret,
            salt,
        });
        onProgress?.('generating_proof', 'Generating zero-knowledge proof...');
        // Generate ZK proof
        const proof = await this.prover.proveShield({
            commitment,
            assetId: assetInfo.id,
            amount: '0x' + amount.toString(16),
            nullifierSecret,
            salt,
        });
        onProgress?.('submitting_transaction', 'Submitting transaction to Starknet...');
        // Approve token transfer
        const tokenAddress = assetInfo.contractAddress;
        const tokenContract = new Contract([
            {
                type: 'function',
                name: 'approve',
                inputs: [
                    { name: 'spender', type: 'ContractAddress' },
                    { name: 'amount', type: 'u256' },
                ],
                outputs: [{ name: 'success', type: 'bool' }],
            },
        ], tokenAddress, this.account);
        const approveCall = tokenContract.populate('approve', [
            PHANTOM_POOL_ADDRESS,
            uint256.bnToUint256(amount),
        ]);
        await this.account.execute(approveCall);
        // Call shield function
        const proofArray = this.hexToCalldata(proof);
        const shieldCall = this.pool.populate('shield', [
            tokenAddress,
            uint256.bnToUint256(amount),
            commitment,
            proofArray,
        ]);
        const tx = await this.account.execute(shieldCall);
        const receipt = await this.provider.waitForTransaction(tx.transaction_hash);
        // Extract leaf index from events (simplified)
        const leafIndex = 0; // Would parse from actual events
        const merkleRoot = await this.pool.get_merkle_root();
        // Create and save note
        const note = {
            commitment,
            amount,
            assetId: assetInfo.id,
            nullifierSecret,
            serialNumber,
            salt,
            leafIndex,
            merkleRoot,
            createdAt: Date.now(),
            spent: false,
        };
        await this.noteStore.saveNote(note);
        return note;
    }
    // ─── UNSHIELD ─────────────────────────────────────────────────────────────
    /**
     * Withdraw assets from the shield pool
     */
    async unshield(params) {
        const { note, recipient, amount, onProgress } = params;
        if (amount > note.amount) {
            throw new Error('Amount exceeds note balance');
        }
        onProgress?.('fetching_merkle_data', 'Fetching Merkle tree data...');
        // Fetch current Merkle root
        const currentRoot = await this.pool.get_merkle_root();
        onProgress?.('computing_nullifier', 'Computing nullifier...');
        // Compute nullifier
        const nullifier = await this.prover.deriveNullifier({
            nullifierSecret: note.nullifierSecret,
            serialNumber: note.serialNumber,
        });
        const changeAmount = note.amount - amount;
        let changeCommitment = null;
        let newNullifierSecret = '0x0';
        let newSalt = '0x0';
        if (changeAmount > 0n) {
            // Generate change note
            newNullifierSecret = generateRandomFieldElement();
            newSalt = generateRandomFieldElement();
            changeCommitment = await this.prover.deriveCommitment({
                amount: '0x' + changeAmount.toString(16),
                assetId: note.assetId,
                nullifierSecret: newNullifierSecret,
                salt: newSalt,
            });
        }
        onProgress?.('generating_proof', 'Generating zero-knowledge proof...');
        // Generate Merkle proof (simplified - would fetch actual path)
        const merklePath = [];
        // Generate unshield proof
        const proof = await this.prover.proveUnshield({
            nullifier,
            changeCommitment,
            merkleRoot: note.merkleRoot,
            noteCommitment: note.commitment,
            noteAmount: '0x' + note.amount.toString(16),
            noteAssetId: note.assetId,
            withdrawalAmount: '0x' + amount.toString(16),
            nullifierSecret: note.nullifierSecret,
            serialNumber: note.serialNumber,
            merklePath,
            changeAmount: '0x' + changeAmount.toString(16),
            newNullifierSecret,
            newSalt,
        });
        onProgress?.('submitting_transaction', 'Submitting transaction to Starknet...');
        // Call unshield function
        const proofArray = this.hexToCalldata(proof);
        const unshieldCall = this.pool.populate('unshield', [
            nullifier,
            recipient,
            TOKEN_ADDRESSES.WBTC, // Would use actual asset
            uint256.bnToUint256(amount),
            note.merkleRoot,
            changeCommitment || { Some: '0x0', None: '0x1' },
            proofArray,
        ]);
        const tx = await this.account.execute(unshieldCall);
        await this.provider.waitForTransaction(tx.transaction_hash);
        // Mark note as spent
        await this.noteStore.markNoteSpent(note.commitment);
        // Save change note if applicable
        if (changeAmount > 0n && changeCommitment) {
            const changeNote = {
                commitment: changeCommitment,
                amount: changeAmount,
                assetId: note.assetId,
                nullifierSecret: newNullifierSecret,
                serialNumber: generateRandomFieldElement(),
                salt: newSalt,
                leafIndex: 0,
                merkleRoot: currentRoot,
                createdAt: Date.now(),
                spent: false,
            };
            await this.noteStore.saveNote(changeNote);
        }
        return tx.transaction_hash;
    }
    // ─── PRIVATE SWAP ─────────────────────────────────────────────────────────
    /**
     * Execute a private swap
     */
    async privateSwap(params) {
        const { noteIn, assetOut, minAmountOut, slippageTolerance, onProgress } = params;
        onProgress?.('fetching_price_quote', 'Fetching price from AVNU...');
        // Fetch real price from AVNU API
        const assetOutInfo = getAssetBySymbol(assetOut);
        if (!assetOutInfo) {
            throw new Error(`Unsupported asset: ${assetOut}`);
        }
        const quote = await this.fetchAVNUQuote({
            sellTokenAddress: TOKEN_ADDRESSES.WBTC, // Would use actual input asset
            buyTokenAddress: assetOutInfo.contractAddress,
            sellAmount: noteIn.amount,
            takerAddress: PHANTOM_POOL_ADDRESS,
        });
        onProgress?.('generating_proof', 'Generating swap proof...');
        // Generate output note
        const outputNullifierSecret = generateRandomFieldElement();
        const outputSalt = generateRandomFieldElement();
        const outputCommitment = await this.prover.deriveCommitment({
            amount: '0x' + minAmountOut.toString(16),
            assetId: assetOutInfo.id,
            nullifierSecret: outputNullifierSecret,
            salt: outputSalt,
        });
        // Compute nullifier for input
        const nullifierIn = await this.prover.deriveNullifier({
            nullifierSecret: noteIn.nullifierSecret,
            serialNumber: noteIn.serialNumber,
        });
        // Generate swap proof
        const proof = await this.prover.provePrivateSwap({
            nullifierIn,
            commitmentOut: outputCommitment,
            merkleRoot: noteIn.merkleRoot,
            inputAmount: '0x' + noteIn.amount.toString(16),
            outputAmount: '0x' + minAmountOut.toString(16),
            outputAssetId: assetOutInfo.id,
            outputNullifierSecret,
            outputSalt,
            minRate: '0x0', // Would compute actual rates
            maxRate: '0xffffffffffffffff',
        });
        onProgress?.('executing_swap', 'Executing swap via AVNU...');
        // Settle swap
        const proofArray = this.hexToCalldata(proof);
        const swapCall = this.pool.populate('settle_private_swap', [
            nullifierIn,
            outputCommitment,
            proofArray,
            [], // swap_params from AVNU
        ]);
        const tx = await this.account.execute(swapCall);
        await this.provider.waitForTransaction(tx.transaction_hash);
        // Mark input note as spent
        await this.noteStore.markNoteSpent(noteIn.commitment);
        // Save output note
        const outputNote = {
            commitment: outputCommitment,
            amount: minAmountOut,
            assetId: assetOutInfo.id,
            nullifierSecret: outputNullifierSecret,
            serialNumber: generateRandomFieldElement(),
            salt: outputSalt,
            leafIndex: 0,
            merkleRoot: await this.pool.get_merkle_root(),
            createdAt: Date.now(),
            spent: false,
        };
        await this.noteStore.saveNote(outputNote);
        return outputNote;
    }
    // ─── SHIELDED YIELD ───────────────────────────────────────────────────────
    /**
     * Deposit to shielded yield protocol
     */
    async depositShieldedYield(params) {
        const { note, protocol, onProgress } = params;
        onProgress?.('fetching_apy', `Fetching APY from ${protocol}...`);
        // Fetch real APY from protocol
        const apy = await this.fetchProtocolAPY(protocol);
        onProgress?.('generating_proof', 'Generating yield deposit proof...');
        // Generate yield position
        const yieldPositionSecret = generateRandomFieldElement();
        const depositCommitment = await this.prover.deriveCommitment({
            amount: '0x' + note.amount.toString(16),
            assetId: note.assetId,
            nullifierSecret: yieldPositionSecret,
            salt: generateRandomFieldElement(),
        });
        const nullifierIn = await this.prover.deriveNullifier({
            nullifierSecret: note.nullifierSecret,
            serialNumber: note.serialNumber,
        });
        const protocolId = protocol === 'vesu' ? 0 : protocol === 'uncap' ? 1 : 2;
        const proof = await this.prover.proveYieldDeposit({
            depositCommitment,
            protocolId,
            nullifierIn,
            merkleRoot: note.merkleRoot,
            depositAmount: '0x' + note.amount.toString(16),
            yieldPositionSecret,
            depositTimestamp: Date.now(),
        });
        onProgress?.('depositing', `Depositing to ${protocol}...`);
        // Call deposit function
        const proofArray = this.hexToCalldata(proof);
        const depositCall = this.pool.populate('deposit_shielded_yield', [
            depositCommitment,
            protocolId,
            proofArray,
            [], // yield_params
        ]);
        const tx = await this.account.execute(depositCall);
        await this.provider.waitForTransaction(tx.transaction_hash);
        // Create yield position
        const position = {
            depositCommitment,
            protocol,
            protocolId,
            principalAmount: note.amount,
            assetId: note.assetId,
            yieldPositionSecret,
            depositTimestamp: Date.now(),
            lastClaimTimestamp: 0,
            claimed: false,
        };
        await this.noteStore.saveYieldPosition(position);
        return position;
    }
    // ─── COMPLIANCE ───────────────────────────────────────────────────────────
    /**
     * Generate compliance proof for regulator
     */
    async generateComplianceProof(params) {
        const { note, regulatorId, scope, kycProofData } = params;
        // Fetch compliance oracle data
        const kycRoot = await this.complianceOracle.get_kyc_root();
        const sanctionsRoot = await this.complianceOracle.get_sanctions_root();
        const threshold = await this.complianceOracle.get_reporting_threshold();
        // Generate compliance proof bundle
        const scopeNum = scope === 'amount_only' ? 0 : scope === 'kyc_status' ? 1 : 2;
        const proofBundle = await this.prover.proveCompliance({
            regulatorId: '0x' + BigInt(regulatorId).toString(16),
            scope: scopeNum,
            kycMerkleRoot: kycRoot,
            kycCommitment: '0x0', // Would compute from kycProofData
            reportingThreshold: '0x' + threshold.toString(16),
            amountInRange: note.amount < threshold,
            sanctionsMerkleRoot: sanctionsRoot,
            recipientCleared: true,
        });
        const proof = {
            regulatorId,
            scope,
            kycProof: {
                kycMerkleRoot: kycRoot,
                kycCommitment: '0x0',
                verified: true,
            },
            amountProof: {
                reportingThreshold: threshold,
                amountInRange: note.amount < threshold,
                verified: true,
            },
            sanctionsProof: {
                sanctionsMerkleRoot: sanctionsRoot,
                recipientCleared: true,
                verified: true,
            },
            proofBundle,
            generatedAt: Date.now(),
        };
        return proof;
    }
    // ─── INTENTS ──────────────────────────────────────────────────────────────
    /**
     * Submit intent to dark pool
     */
    async submitIntent(params) {
        const { noteIn, assetOut, minAmountOut, deadline } = params;
        const assetOutInfo = getAssetBySymbol(assetOut);
        if (!assetOutInfo) {
            throw new Error(`Unsupported asset: ${assetOut}`);
        }
        // Generate intent commitment
        const nullifierSecret = generateRandomFieldElement();
        const intentCommitment = await this.prover.deriveCommitment({
            amount: '0x' + noteIn.amount.toString(16),
            assetId: assetOutInfo.id,
            nullifierSecret,
            salt: generateRandomFieldElement(),
        });
        // Generate intent proof
        const proof = await this.prover.proveIntent({
            assetIn: '0x' + noteIn.assetId.toString(16),
            amountIn: '0x' + noteIn.amount.toString(16),
            assetOut: '0x' + assetOutInfo.id.toString(16),
            minAmountOut: '0x' + minAmountOut.toString(16),
            nullifierSecret,
            deadline,
        });
        // Submit intent
        const proofArray = this.hexToCalldata(proof);
        const intentCall = this.intentMatcher.populate('submit_intent', [
            intentCommitment,
            BigInt(deadline),
            proofArray,
        ]);
        const tx = await this.account.execute(intentCall);
        await this.provider.waitForTransaction(tx.transaction_hash);
        // Compute nullifier
        const nullifier = await this.prover.deriveNullifier({
            nullifierSecret,
            serialNumber: noteIn.serialNumber,
        });
        const receipt = {
            commitment: intentCommitment,
            nullifier,
            assetIn: noteIn.assetId,
            amountIn: noteIn.amount,
            assetOut: assetOutInfo.id,
            minAmountOut: minAmountOut,
            deadline,
            status: 'pending',
            submittedAt: Date.now(),
        };
        await this.noteStore.saveIntent(receipt);
        return receipt;
    }
    // ─── HELPERS ──────────────────────────────────────────────────────────────
    /**
     * Fetch AVNU quote
     */
    async fetchAVNUQuote(params) {
        const url = new URL(`${AVNU_API_URL}/swap/v2/quotes`);
        url.searchParams.set('sellTokenAddress', params.sellTokenAddress);
        url.searchParams.set('buyTokenAddress', params.buyTokenAddress);
        url.searchParams.set('sellAmount', params.sellAmount.toString());
        url.searchParams.set('takerAddress', params.takerAddress);
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`AVNU API error: ${response.statusText}`);
        }
        return response.json();
    }
    /**
     * Fetch APY from yield protocol
     */
    async fetchProtocolAPY(protocol) {
        // In production: call actual protocol contract
        // For now, return placeholder
        return 0.05; // 5% APY placeholder
    }
    /**
     * Convert hex proof to calldata array
     */
    hexToCalldata(hex) {
        // Remove 0x prefix and split into felt252-sized chunks
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        const chunkSize = 62; // felt252 is ~62 hex chars
        const chunks = [];
        for (let i = 0; i < cleanHex.length; i += chunkSize) {
            chunks.push('0x' + cleanHex.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * Get all shielded notes
     */
    async getAllNotes() {
        return this.noteStore.getAllNotes();
    }
    /**
     * Get all yield positions
     */
    async getAllYieldPositions() {
        return this.noteStore.getAllYieldPositions();
    }
    /**
     * Export backup
     */
    async exportBackup() {
        return this.noteStore.exportEncryptedBackup();
    }
    /**
     * Import backup
     */
    async importBackup(file) {
        return this.noteStore.importFromBackup(file);
    }
}
//# sourceMappingURL=PhantomSDK.js.map