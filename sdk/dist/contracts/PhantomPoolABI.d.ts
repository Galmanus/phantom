/**
 * PhantomPool ABI (simplified - full ABI would be generated from Cairo)
 */
export declare const PhantomPoolABI: readonly [{
    readonly type: "function";
    readonly name: "shield";
    readonly inputs: readonly [{
        readonly name: "asset";
        readonly type: "ContractAddress";
    }, {
        readonly name: "amount";
        readonly type: "u256";
    }, {
        readonly name: "commitment";
        readonly type: "felt252";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [{
        readonly name: "new_merkle_root";
        readonly type: "felt252";
    }, {
        readonly name: "leaf_index";
        readonly type: "u32";
    }];
}, {
    readonly type: "function";
    readonly name: "unshield";
    readonly inputs: readonly [{
        readonly name: "nullifier";
        readonly type: "felt252";
    }, {
        readonly name: "recipient";
        readonly type: "ContractAddress";
    }, {
        readonly name: "asset";
        readonly type: "ContractAddress";
    }, {
        readonly name: "amount";
        readonly type: "u256";
    }, {
        readonly name: "merkle_root";
        readonly type: "felt252";
    }, {
        readonly name: "change_commitment";
        readonly type: "Option<felt252>";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "settle_private_swap";
    readonly inputs: readonly [{
        readonly name: "nullifier_in";
        readonly type: "felt252";
    }, {
        readonly name: "commitment_out";
        readonly type: "felt252";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }, {
        readonly name: "swap_params";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "deposit_shielded_yield";
    readonly inputs: readonly [{
        readonly name: "commitment";
        readonly type: "felt252";
    }, {
        readonly name: "protocol";
        readonly type: "u8";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }, {
        readonly name: "yield_params";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "claim_shielded_yield";
    readonly inputs: readonly [{
        readonly name: "yield_position_nullifier";
        readonly type: "felt252";
    }, {
        readonly name: "new_commitment";
        readonly type: "felt252";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "get_merkle_root";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "root";
        readonly type: "felt252";
    }];
}, {
    readonly type: "function";
    readonly name: "is_nullifier_spent";
    readonly inputs: readonly [{
        readonly name: "nullifier";
        readonly type: "felt252";
    }];
    readonly outputs: readonly [{
        readonly name: "spent";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "is_valid_historical_root";
    readonly inputs: readonly [{
        readonly name: "root";
        readonly type: "felt252";
    }];
    readonly outputs: readonly [{
        readonly name: "valid";
        readonly type: "bool";
    }];
}, {
    readonly type: "event";
    readonly name: "Shielded";
    readonly keys: readonly ["commitment", "asset_id"];
    readonly data: readonly ["leaf_index", "new_merkle_root"];
}, {
    readonly type: "event";
    readonly name: "Unshielded";
    readonly keys: readonly ["nullifier"];
    readonly data: readonly ["change_commitment", "new_merkle_root"];
}];
/**
 * ComplianceOracle ABI
 */
export declare const ComplianceOracleABI: readonly [{
    readonly type: "function";
    readonly name: "verify_compliance_proof";
    readonly inputs: readonly [{
        readonly name: "regulator_id";
        readonly type: "felt252";
    }, {
        readonly name: "scope";
        readonly type: "u8";
    }, {
        readonly name: "public_inputs";
        readonly type: "Span<felt252>";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [{
        readonly name: "valid";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "get_kyc_root";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "root";
        readonly type: "felt252";
    }];
}, {
    readonly type: "function";
    readonly name: "get_sanctions_root";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "root";
        readonly type: "felt252";
    }];
}, {
    readonly type: "function";
    readonly name: "get_reporting_threshold";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "threshold";
        readonly type: "u256";
    }];
}];
/**
 * IntentMatcher ABI
 */
export declare const IntentMatcherABI: readonly [{
    readonly type: "function";
    readonly name: "submit_intent";
    readonly inputs: readonly [{
        readonly name: "commitment";
        readonly type: "felt252";
    }, {
        readonly name: "expiry";
        readonly type: "u64";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "settle_matched_intents";
    readonly inputs: readonly [{
        readonly name: "intent_a_nullifier";
        readonly type: "felt252";
    }, {
        readonly name: "intent_b_nullifier";
        readonly type: "felt252";
    }, {
        readonly name: "proof";
        readonly type: "Span<felt252>";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "is_intent_pending";
    readonly inputs: readonly [{
        readonly name: "commitment";
        readonly type: "felt252";
    }];
    readonly outputs: readonly [{
        readonly name: "pending";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "get_total_settlements";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "count";
        readonly type: "u64";
    }];
}];
//# sourceMappingURL=PhantomPoolABI.d.ts.map