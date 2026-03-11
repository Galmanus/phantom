use starknet::ContractAddress;

// PHANTOM Pool Interface

#[generate_trait]
pub trait IPhantomPool {
    fn shield(
        ref self: ContractState,
        asset: ContractAddress,
        amount: u256,
        commitment: felt252,
        proof: Span<felt252>,
    ) -> (felt252, u32);

    fn unshield(
        ref self: ContractState,
        nullifier: felt252,
        recipient: ContractAddress,
        asset: ContractAddress,
        amount: u256,
        merkle_root: felt252,
        change_commitment: Option<felt252>,
        proof: Span<felt252>,
    );

    fn settle_private_swap(
        ref self: ContractState,
        nullifier_in: felt252,
        commitment_out: felt252,
        proof: Span<felt252>,
        swap_params: Span<felt252>,
    );

    fn deposit_shielded_yield(
        ref self: ContractState,
        commitment: felt252,
        protocol: u8,
        proof: Span<felt252>,
        yield_params: Span<felt252>,
    );

    fn claim_shielded_yield(
        ref self: ContractState,
        yield_position_nullifier: felt252,
        new_commitment: felt252,
        proof: Span<felt252>,
    );

    fn update_verifier(ref self: ContractState, new_verifier: ContractAddress);
    fn pause(ref self: ContractState);
    fn unpause(ref self: ContractState);
    fn add_supported_asset(ref self: ContractState, asset: ContractAddress);

    fn get_merkle_root(self: @ContractState) -> felt252;
    fn is_nullifier_spent(self: @ContractState, nullifier: felt252) -> bool;
    fn is_valid_historical_root(self: @ContractState, root: felt252) -> bool;
    fn is_paused(self: @ContractState) -> bool;
}
