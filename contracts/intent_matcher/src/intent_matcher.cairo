use starknet::ContractAddress;

// PHANTOM Intent Matcher - Dark Pool Intent Settlement
// Manages encrypted trade intents and atomic settlement

// Verifier interface
trait IVerifier<T> {
    fn verify_intent_proof(
        self: @T,
        commitment: felt252,
        expiry: u64,
        proof: Span<felt252>,
    ) -> bool;

    fn verify_matching_proof(
        self: @T,
        intent_a_nullifier: felt252,
        intent_b_nullifier: felt252,
        proof: Span<felt252>,
    ) -> bool;
}

#[storage]
struct Storage {
    // Intent commitments: commitment -> (expiry_timestamp, submitter)
    pending_intents: LegacyMap<felt252, (u64, ContractAddress)>,
    // Used intent nullifiers (prevents replay)
    used_intent_nullifiers: LegacyMap<felt252, bool>,
    // Nullifier secrets hashed for ownership verification
    intent_ownership: LegacyMap<felt252, felt252>,
    // Settlement count
    total_settlements: u64,
    // PhantomPool address (only contract that can execute settlements)
    phantom_pool: ContractAddress,
    // Verifier contract
    verifier: ContractAddress,
    // Test mode flag
    test_mode: bool,
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
    VerifierUpdated: VerifierUpdated,
    TestModeChanged: TestModeChanged,
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

#[derive(Drop, starknet::Event)]
struct VerifierUpdated {
    old_verifier: ContractAddress,
    new_verifier: ContractAddress,
}

#[derive(Drop, starknet::Event)]
struct TestModeChanged {
    old_value: bool,
    new_value: bool,
}

#[embeddable_as(IntentMatcher)]
mod intent_matcher_impl {
    use super::{
        Storage, IVerifier,
        IntentSubmitted, IntentSettled, IntentExpired, IntentCancelled,
        VerifierUpdated, TestModeChanged,
    };
    use starknet::event::EventEmitter;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use starknet::ContractAddressZeroable;
    use core::poseidon::poseidon_hash_span;

    #[abi(embed_v0)]
    trait IIntentMatcher {
        fn submit_intent(
            ref self: ContractState,
            commitment: felt252,
            expiry: u64,
            nullifier_secret: felt252,
            proof: Span<felt252>,
        );
        
        fn settle_matched_intents(
            ref self: ContractState,
            intent_a_commitment: felt252,
            intent_b_commitment: felt252,
            proof: Span<felt252>,
        );
        
        fn cancel_intent(
            ref self: ContractState,
            commitment: felt252,
            nullifier_secret: felt252,
        );
        
        fn is_intent_pending(self: @ContractState, commitment: felt252) -> bool;
        fn is_nullifier_used(self: @ContractState, nullifier: felt252) -> bool;
        fn get_intent_expiry(self: @ContractState, commitment: felt252) -> u64;
        fn get_total_settlements(self: @ContractState) -> u64;

        fn set_verifier(ref self: ContractState, verifier: ContractAddress);
        fn set_test_mode(ref self: ContractState, enabled: bool);
    }

    #[external(v0)]
    fn submit_intent(
        ref self: ContractState,
        commitment: felt252,
        expiry: u64,
        nullifier_secret: felt252,
        proof: Span<felt252>,
    ) {
        // 1. Validate commitment is non-zero
        assert(commitment != 0, 'Invalid commitment');
        
        // 2. Validate expiry is in the future
        let now = get_block_timestamp();
        assert(expiry > now, 'Intent already expired');
        
        // 3. Check intent not already submitted
        assert(!self.is_intent_pending(commitment), 'Intent already exists');
        
        // 4. CRITICAL: Verify ZK proof
        let proof_valid = self._verify_intent_proof(commitment, expiry, proof);
        assert(proof_valid, 'Invalid intent proof');
        
        // 5. CRITICAL: Store ownership binding
        // Hash nullifier secret with commitment for ownership verification
        let ownership_hash = poseidon_hash_span(@[nullifier_secret, commitment]);
        self.intent_ownership.write(commitment, ownership_hash);
        
        // 6. Store intent
        let caller = get_caller_address();
        self.pending_intents.write(commitment, (expiry, caller));
        
        self.emit(IntentSubmitted {
            commitment,
            expiry,
            submitter: caller,
        });
    }

    #[external(v0)]
    fn settle_matched_intents(
        ref self: ContractState,
        intent_a_commitment: felt252,
        intent_b_commitment: felt252,
        proof: Span<felt252>,
    ) {
        // Only PhantomPool can settle
        assert(get_caller_address() == self.phantom_pool.read(), 'Only PhantomPool can settle');
        
        // Verify both intents exist and are pending
        assert(self.is_intent_pending(intent_a_commitment), 'Intent A not pending');
        assert(self.is_intent_pending(intent_b_commitment), 'Intent B not pending');
        
        // CRITICAL: Verify matching proof
        let proof_valid = self._verify_matching_proof(
            intent_a_commitment,
            intent_b_commitment,
            proof,
        );
        assert(proof_valid, 'Invalid matching proof');
        
        // Compute nullifiers for both intents (for tracking)
        let nullifier_a = self._compute_intent_nullifier(intent_a_commitment);
        let nullifier_b = self._compute_intent_nullifier(intent_b_commitment);
        
        // Mark nullifiers as used
        self.used_intent_nullifiers.write(nullifier_a, true);
        self.used_intent_nullifiers.write(nullifier_b, true);
        
        // Clear pending intents
        self.pending_intents.write(intent_a_commitment, (0, ContractAddressZeroable::zero()));
        self.pending_intents.write(intent_b_commitment, (0, ContractAddressZeroable::zero()));
        
        // Increment settlement count
        let total = self.total_settlements.read();
        self.total_settlements.write(total + 1);
        
        self.emit(IntentSettled {
            intent_a_nullifier: nullifier_a,
            intent_b_nullifier: nullifier_b,
            settlement_timestamp: get_block_timestamp(),
        });
    }

    #[external(v0)]
    fn cancel_intent(
        ref self: ContractState,
        commitment: felt252,
        nullifier_secret: felt252,
    ) {
        // 1. Verify intent exists and is pending
        assert(self.is_intent_pending(commitment), 'Intent not pending');
        
        // 2. CRITICAL: Verify caller owns this intent
        let stored_ownership = self.intent_ownership.read(commitment);
        let caller_ownership = poseidon_hash_span(@[nullifier_secret, commitment]);
        assert(stored_ownership == caller_ownership, 'Not intent owner');
        
        // 3. Compute and mark nullifier as used (to prevent replay)
        let nullifier = self._compute_intent_nullifier(commitment);
        assert(!self.used_intent_nullifiers.read(nullifier), 'Intent already settled');
        
        self.used_intent_nullifiers.write(nullifier, true);
        
        // 4. Remove intent
        self.pending_intents.write(commitment, (0, ContractAddressZeroable::zero()));
        self.intent_ownership.write(commitment, 0);
        
        self.emit(IntentCancelled { commitment, nullifier });
    }

    #[external(v0)]
    fn is_intent_pending(self: @ContractState, commitment: felt252) -> bool {
        if commitment == 0 {
            return false;
        }
        
        let (expiry, submitter) = self.pending_intents.read(commitment);
        if expiry == 0 {
            return false;
        }
        
        // Check if still valid (not expired)
        get_block_timestamp() < expiry
    }

    #[external(v0)]
    fn is_nullifier_used(self: @ContractState, nullifier: felt252) -> bool {
        nullifier != 0 && self.used_intent_nullifiers.read(nullifier)
    }

    #[external(v0)]
    fn get_intent_expiry(self: @ContractState, commitment: felt252) -> u64 {
        let (expiry, _) = self.pending_intents.read(commitment);
        expiry
    }

    #[external(v0)]
    fn get_total_settlements(self: @ContractState) -> u64 {
        self.total_settlements.read()
    }

    #[external(v0)]
    fn set_verifier(ref self: ContractState, verifier: ContractAddress) {
        assert(get_caller_address() == self.owner.read(), 'Only owner');
        
        let old = self.verifier.read();
        self.verifier.write(verifier);
        
        self.emit(VerifierUpdated { old_verifier: old, new_verifier: verifier });
    }

    #[external(v0)]
    fn set_test_mode(ref self: ContractState, enabled: bool) {
        assert(get_caller_address() == self.owner.read(), 'Only owner');
        
        let old = self.test_mode.read();
        self.test_mode.write(enabled);
        
        self.emit(TestModeChanged { old_value: old, new_value: enabled });
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _verify_intent_proof(
            self: @ContractState,
            commitment: felt252,
            expiry: u64,
            proof: Span<felt252>,
        ) -> bool {
            // Test mode: accept empty proof
            if self.test_mode.read() {
                if proof.len() == 1 && *proof.at(0) == 0 {
                    return true;
                }
            }

            // Production: verify via verifier contract
            let verifier_addr = self.verifier.read();
            if verifier_addr == ContractAddressZeroable::zero() {
                // Fallback to basic validation
                return proof.len() >= 64;
            }

            let verifier = IVerifierDispatcher { contract_address: verifier_addr };
            verifier.verify_intent_proof(commitment, expiry, proof)
        }

        fn _verify_matching_proof(
            self: @ContractState,
            intent_a_commitment: felt252,
            intent_b_commitment: felt252,
            proof: Span<felt252>,
        ) -> bool {
            // Test mode
            if self.test_mode.read() {
                if proof.len() == 1 && *proof.at(0) == 0 {
                    return true;
                }
            }

            // Production
            let verifier_addr = self.verifier.read();
            if verifier_addr == ContractAddressZeroable::zero() {
                return proof.len() >= 64;
            }

            // Compute nullifiers for verification
            let nullifier_a = self._compute_intent_nullifier(intent_a_commitment);
            let nullifier_b = self._compute_intent_nullifier(intent_b_commitment);

            let verifier = IVerifierDispatcher { contract_address: verifier_addr };
            verifier.verify_matching_proof(nullifier_a, nullifier_b, proof)
        }

        fn _compute_intent_nullifier(self: @ContractState, commitment: felt252) -> felt252 {
            // Compute nullifier from commitment
            // In production, this should be more sophisticated
            poseidon_hash_span(@[commitment, 'INTENT'.into()])
        }
    }
}

#[constructor]
fn constructor(
    ref self: ContractState,
    phantom_pool: ContractAddress,
    owner: ContractAddress,
    verifier: ContractAddress,
) {
    assert(phantom_pool != ContractAddressZeroable::zero(), 'Invalid PhantomPool address');
    assert(owner != ContractAddressZeroable::zero(), 'Invalid owner address');
    
    self.phantom_pool.write(phantom_pool);
    self.owner.write(owner);
    self.verifier.write(verifier);
    self.total_settlements.write(0);
    self.test_mode.write(true); // Test mode by default
}
