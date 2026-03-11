/**
 * PHANTOM SDK Types
 */
// Asset types supported by PHANTOM
export var AssetId;
(function (AssetId) {
    AssetId[AssetId["WBTC"] = 0] = "WBTC";
    AssetId[AssetId["TBTC"] = 1] = "TBTC";
    AssetId[AssetId["LBTC"] = 2] = "LBTC";
    AssetId[AssetId["SOLVBTC"] = 3] = "SOLVBTC";
    AssetId[AssetId["STRK"] = 4] = "STRK";
    AssetId[AssetId["USDC"] = 5] = "USDC";
})(AssetId || (AssetId = {}));
// Error types
export class PhantomError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'PhantomError';
    }
}
export class ProofGenerationError extends PhantomError {
    constructor(message, details) {
        super(message, 'PROOF_GENERATION_FAILED', details);
        this.name = 'ProofGenerationError';
    }
}
export class TransactionError extends PhantomError {
    constructor(message, details) {
        super(message, 'TRANSACTION_FAILED', details);
        this.name = 'TransactionError';
    }
}
export class StorageError extends PhantomError {
    constructor(message, details) {
        super(message, 'STORAGE_ERROR', details);
        this.name = 'StorageError';
    }
}
//# sourceMappingURL=types.js.map