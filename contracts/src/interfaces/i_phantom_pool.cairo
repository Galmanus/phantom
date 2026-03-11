use starknet::ContractAddress;

// PHANTOM Pool Interface
// Note: ContractState is defined by the implementing contract's #[storage] struct

#[generate_trait]
pub trait IPhantomPool<T> {
    fn shield(
        ref self: T,
        asset: ContractAddress,
        amount: u256,
        commitment: felt252,
        proof: Span<felt252>,
    ) -> (felt252, u32);

    fn unshield(
        ref self: T,
        nullifier: felt252,
        recipient: ContractAddress,
        asset: ContractAddress,
        amount: u256,
        merkle_root: felt252,
        change_commitment: Option<felt252>,
        proof: Span<felt252>,
    );

    fn settle_private_swap(
        ref self: T,
        nullifier_in: felt252,
        commitment_out: felt252,
        proof: Span<felt252>,
        swap_params: Span<felt252>,
    );

    fn deposit_shielded_yield(
        ref self: T,
        commitment: felt252,
        protocol: u8,
        proof: Span<felt252>,
        yield_params: Span<felt252>,
    );

    fn claim_shielded_yield(
        ref self: T,
        yield_position_nullifier: felt252,
        new_commitment: felt252,
        proof: Span<felt252>,
    );

    fn update_verifier(ref self: T, new_verifier: ContractAddress);
    fn pause(ref self: T);
    fn unpause(ref self: T);
    fn add_supported_asset(ref self: T, asset: ContractAddress);

    fn get_merkle_root(self: @T) -> felt252;
    fn is_nullifier_spent(self: @T, nullifier: felt252) -> bool;
    fn is_valid_historical_root(self: @T, root: felt252) -> bool;
    fn is_paused(self: @T) -> bool;
}
