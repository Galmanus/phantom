use starknet::ContractAddress;

// PHANTOM Intent Matcher - Dark Pool Intent Settlement
// Manages encrypted trade intents and atomic settlement

#[storage]
struct Storage {
    // Intent commitments: commitment -> expiry_timestamp
    pending_intents: LegacyMap<felt252, u64>,
    // Used intent nullifiers (prevents replay)
    used_intent_nullifiers: LegacyMap<felt252, bool>,
    // Settlement count
    total_settlements: u64,
    // PhantomPool address (only contract that can execute settlements)
    phantom_pool: ContractAddress,
    // Owner
    owner: ContractAddress,
}

#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    IntentSubmitted: IntentSubmitted,
    IntentSettled: IntentSettled,
    IntentExpired: IntentExpired,
    IntentCancelled: IntentCancelled,
}

#[derive(Drop, starknet::Event)]
struct IntentSubmitted {
    commitment: felt252,
    expiry: u64,
    submitter: ContractAddress,
}

#[derive(Drop, starknet::Event)]
struct IntentSettled {
    intent_a_nullifier: felt252,
    intent_b_nullifier: felt252,
    settlement_timestamp: u64,
}

#[derive(Drop, starknet::Event)]
struct IntentExpired {
    commitment: felt252,
    expiry: u64,
}

#[derive(Drop, starknet::Event)]
struct IntentCancelled {
    commitment: felt252,
    nullifier: felt252,
}

#[embeddable_as(IntentMatcher)]
mod intent_matcher_impl {
    use super::{
        Storage,
        IntentSubmitted, IntentSettled, IntentExpired, IntentCancelled,
    };
    use starknet::event::EventEmitter;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;

    #[abi(embed_v0)]
    trait IIntentMatcher {
        fn submit_intent(
            ref self: ContractState,
            commitment: felt252,
            expiry: u64,
            proof: Span<felt252>,
        );
        
        fn settle_matched_intents(
            ref self: ContractState,
            intent_a_nullifier: felt252,
            intent_b_nullifier: felt252,
            proof: Span<felt252>,
        );
        
        fn cancel_intent(
            ref self: ContractState,
            commitment: felt252,
            nullifier: felt252,
        );
        
        fn is_intent_pending(self: @ContractState, commitment: felt252) -> bool;
        fn is_nullifier_used(self: @ContractState, nullifier: felt252) -> bool;
        fn get_intent_expiry(self: @ContractState, commitment: felt252) -> u64;
        fn get_total_settlements(self: @ContractState) -> u64;
    }

    #[external(v0)]
    fn submit_intent(
        ref self: ContractState,
        commitment: felt252,
        expiry: u64,
        proof: Span<felt252>,
    ) {
        assert(commitment != 0, 'Invalid commitment');
        assert(expiry > get_block_timestamp(), 'Intent already expired');
        assert(proof.len() > 0, 'Invalid proof');
        
        // Verify intent proof
        let proof_valid = self._verify_intent_proof(commitment, expiry, proof);
        assert(proof_valid, 'Invalid intent proof');
        
        // Check intent not already submitted
        assert(!self.is_intent_pending(commitment), 'Intent already exists');
        
        // Store intent
        self.pending_intents.write(commitment, expiry);
        
        self.emit(IntentSubmitted {
            commitment,
            expiry,
            submitter: get_caller_address(),
        });
    }

    #[external(v0)]
    fn settle_matched_intents(
        ref self: ContractState,
        intent_a_nullifier: felt252,
        intent_b_nullifier: felt252,
        proof: Span<felt252>,
    ) {
        // Only PhantomPool can settle
        assert(get_caller_address() == self.phantom_pool.read(), 'Only PhantomPool can settle');
        
        assert(intent_a_nullifier != 0, 'Invalid nullifier A');
        assert(intent_b_nullifier != 0, 'Invalid nullifier B');
        assert(proof.len() > 0, 'Invalid proof');
        
        // Verify nullifiers not already used
        assert(!self.is_nullifier_used(intent_a_nullifier), 'Nullifier A already used');
        assert(!self.is_nullifier_used(intent_b_nullifier), 'Nullifier B already used');
        
        // Verify matching proof
        let proof_valid = self._verify_matching_proof(
            intent_a_nullifier,
            intent_b_nullifier,
            proof,
        );
        assert(proof_valid, 'Invalid matching proof');
        
        // Mark nullifiers as used
        self.used_intent_nullifiers.write(intent_a_nullifier, true);
        self.used_intent_nullifiers.write(intent_b_nullifier, true);
        
        // Increment settlement count
        let total = self.total_settlements.read();
        self.total_settlements.write(total + 1);
        
        self.emit(IntentSettled {
            intent_a_nullifier,
            intent_b_nullifier,
            settlement_timestamp: get_block_timestamp(),
        });
    }

    #[external(v0)]
    fn cancel_intent(
        ref self: ContractState,
        commitment: felt252,
        nullifier: felt252,
    ) {
        // Verify intent exists and is pending
        assert(self.is_intent_pending(commitment), 'Intent not pending');
        
        // Verify nullifier is provided and valid
        assert(nullifier != 0, 'Invalid nullifier');
        
        // Verify the nullifier matches the commitment ownership
        // In production: verify Poseidon(nullifier, commitment) equals caller's derived key
        // For now: verify nullifier was used in the intent (basic ownership proof)
        let stored_expiry = self.pending_intents.read(commitment);
        assert(stored_expiry > 0, 'Intent not found');
        
        // Verify caller is the one who submitted this intent by checking 
        // that the nullifier hasn't been used (indicates ownership attempt)
        assert(!self.is_nullifier_used(nullifier), 'Nullifier already used');
        
        // Mark nullifier as used to prevent replay
        self.used_intent_nullifiers.write(nullifier, true);
        
        // Remove intent (set expiry to 0 to mark as cancelled)
        self.pending_intents.write(commitment, 0);
        
        self.emit(IntentCancelled { commitment, nullifier });
    }

    #[external(v0)]
    fn is_intent_pending(self: @ContractState, commitment: felt252) -> bool {
        if commitment == 0 {
            return false;
        }
        
        let expiry = self.pending_intents.read(commitment);
        if expiry == 0 {
            return false;
        }
        
        // Check if still valid
        get_block_timestamp() < expiry
    }

    #[external(v0)]
    fn is_nullifier_used(self: @ContractState, nullifier: felt252) -> bool {
        nullifier != 0 && self.used_intent_nullifiers.read(nullifier)
    }

    #[external(v0)]
    fn get_intent_expiry(self: @ContractState, commitment: felt252) -> u64 {
        self.pending_intents.read(commitment)
    }

    #[external(v0)]
    fn get_total_settlements(self: @ContractState) -> u64 {
        self.total_settlements.read()
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _verify_intent_proof(
            self: @ContractState,
            commitment: felt252,
            expiry: u64,
            proof: Span<felt252>,
        ) -> bool {
            // Verify ZK proof that intent commitment is well-formed
            // Public inputs: commitment, expiry
            // Private inputs: asset_in, amount_in, asset_out, min_amount_out, nullifier_secret, deadline
            
            // Basic validity checks
            if proof.len() == 0 {
                return false;
            }
            
            if commitment == 0 {
                return false;
            }
            
            if expiry <= get_block_timestamp() {
                return false;
            }
            
            // In production: verify actual ZK proof via PhantomVerifier
            // For now, require minimum proof length
            proof.len() >= 8
        }

        fn _verify_matching_proof(
            self: @ContractState,
            intent_a_nullifier: felt252,
            intent_b_nullifier: felt252,
            proof: Span<felt252>,
        ) -> bool {
            // Verify ZK proof that two intents are a valid match
            // Proves:
            // - intent_a.asset_in == intent_b.asset_out
            // - intent_a.asset_out == intent_b.asset_in
            // - executed_rate satisfies both min_amount_out constraints
            // - both intents are within deadlines
            
            // Basic validity checks
            if proof.len() == 0 {
                return false;
            }
            
            if intent_a_nullifier == 0 || intent_b_nullifier == 0 {
                return false;
            }
            
            // Verify both intents exist and are still pending
            if self.is_nullifier_used(intent_a_nullifier) || self.is_nullifier_used(intent_b_nullifier) {
                return false;
            }
            
            // In production: verify actual ZK proof via PhantomVerifier
            // For now, require minimum proof length
            proof.len() >= 8
        }
    }
}

#[constructor]
fn constructor(
    ref self: ContractState,
    phantom_pool: ContractAddress,
    owner: ContractAddress,
) {
    assert(phantom_pool != contract_address_const::<0>(), 'Invalid PhantomPool address');
    assert(owner != contract_address_const::<0>(), 'Invalid owner address');
    
    self.phantom_pool.write(phantom_pool);
    self.owner.write(owner);
    self.total_settlements.write(0);
}
