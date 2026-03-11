/**
 * Proof types for PHANTOM SDK
 */
export interface ShieldInputs {
    commitment: string;
    asset_id: number;
    amount: string;
    nullifier_secret: string;
    salt: string;
}
export interface UnshieldInputs {
    nullifier: string;
    change_commitment: string | null;
    merkle_root: string;
    note_commitment: string;
    note_amount: string;
    note_asset_id: number;
    withdrawal_amount: string;
    nullifier_secret: string;
    serial_number: string;
    merkle_path: string[];
    change_amount: string;
    new_nullifier_secret: string;
    new_salt: string;
}
export interface PrivateSwapInputs {
    nullifier_in: string;
    commitment_out: string;
    merkle_root: string;
    input_amount: string;
    output_amount: string;
    output_asset_id: number;
    output_nullifier_secret: string;
    output_salt: string;
    min_rate: string;
    max_rate: string;
}
export interface YieldDepositInputs {
    deposit_commitment: string;
    protocol_id: number;
    nullifier_in: string;
    merkle_root: string;
    deposit_amount: string;
    yield_position_secret: string;
    deposit_timestamp: number;
}
export interface YieldClaimInputs {
    position_nullifier: string;
    yield_commitment: string;
    remaining_commitment: string;
    merkle_root: string;
    claimable_yield: string;
    remaining_principal: string;
    claim_timestamp: number;
}
export interface ComplianceInputs {
    regulator_id: string;
    scope: number;
    kyc_merkle_root: string;
    kyc_commitment: string;
    reporting_threshold: string;
    amount_in_range: boolean;
    sanctions_merkle_root: string;
    recipient_cleared: boolean;
}
export interface IntentInputs {
    asset_in: string;
    amount_in: string;
    asset_out: string;
    min_amount_out: string;
    nullifier_secret: string;
    deadline: number;
}
export interface ProverRequest {
    id: string;
    type: string;
    inputs: Record<string, unknown>;
}
export interface ProverResponse {
    id: string;
    type?: string;
    success: boolean;
    result?: string;
    error?: string;
}
//# sourceMappingURL=ProofTypes.d.ts.map