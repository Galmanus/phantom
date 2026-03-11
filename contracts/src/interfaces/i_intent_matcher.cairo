use starknet::ContractAddress;

// Intent Matcher Interface

#[generate_trait]
pub trait IIntentMatcher<T> {
    fn submit_intent(
        ref self: T,
        commitment: felt252,
        expiry: u64,
        proof: Span<felt252>,
    );

    fn settle_matched_intents(
        ref self: T,
        intent_a_nullifier: felt252,
        intent_b_nullifier: felt252,
        proof: Span<felt252>,
    );

    fn cancel_intent(
        ref self: T,
        commitment: felt252,
        nullifier: felt252,
    );

    fn is_intent_pending(self: @T, commitment: felt252) -> bool;
    fn is_nullifier_used(self: @T, nullifier: felt252) -> bool;
    fn get_intent_expiry(self: @T, commitment: felt252) -> u64;
    fn get_total_settlements(self: @T) -> u64;
}
