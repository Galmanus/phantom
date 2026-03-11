use starknet::ContractAddress;

// Compliance Oracle Interface

#[generate_trait]
pub trait IComplianceOracle {
    fn verify_compliance_proof(
        self: @ContractState,
        regulator_id: felt252,
        scope: u8,
        public_inputs: Span<felt252>,
        proof: Span<felt252>,
    ) -> bool;

    fn register_regulator(
        ref self: ContractState,
        regulator_id: felt252,
        public_key: felt252,
    );

    fn update_kyc_root(ref self: ContractState, new_root: felt252);
    fn update_sanctions_root(ref self: ContractState, new_root: felt252);
    fn update_reporting_threshold(ref self: ContractState, new_threshold: u256);

    fn get_kyc_root(self: @ContractState) -> felt252;
    fn get_sanctions_root(self: @ContractState) -> felt252;
    fn get_reporting_threshold(self: @ContractState) -> u256;
    fn get_regulator_public_key(self: @ContractState, regulator_id: felt252) -> felt252;
    fn is_regulator_registered(self: @ContractState, regulator_id: felt252) -> bool;

    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress);
    fn update_verifier(ref self: ContractState, new_verifier: ContractAddress);
}
