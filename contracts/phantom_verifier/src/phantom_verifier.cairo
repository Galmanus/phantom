use starknet::ContractAddress;

// PHANTOM Verifier - Stwo Proof Verification Wrapper
// Supports migration from custom Stwo verifier to native Starknet 0.14.2 verification

#[storage]
struct Storage {
    // Mode: 0 = CUSTOM (Stwo inline), 1 = NATIVE (Starknet 0.14.2 syscall)
    verification_mode: u8,
    // Owner controls mode switch (with 7-day timelock)
    owner: ContractAddress,
    // Pending mode change: (new_mode, valid_after_timestamp)
    pending_mode_change: (u8, u64),
    // Timelock duration in seconds (7 days minimum)
    timelock_duration: u64,
}

#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    ProofVerified: ProofVerified,
    VerificationModeChanged: VerificationModeChanged,
    ModeChangeScheduled: ModeChangeScheduled,
    OwnerChanged: OwnerChanged,
}

#[derive(Drop, starknet::Event)]
struct ProofVerified {
    circuit_id: felt252,
    verified: bool,
    timestamp: u64,
}

#[derive(Drop, starknet::Event)]
struct VerificationModeChanged {
    old_mode: u8,
    new_mode: u8,
    timestamp: u64,
}

#[derive(Drop, starknet::Event)]
struct ModeChangeScheduled {
    new_mode: u8,
    valid_after: u64,
    timestamp: u64,
}

#[derive(Drop, starknet::Event)]
struct OwnerChanged {
    old_owner: ContractAddress,
    new_owner: ContractAddress,
}

const MODE_CUSTOM: u8 = 0;
const MODE_NATIVE: u8 = 1;
const MIN_TIMELOCK_SECONDS: u64 = 604800; // 7 days

#[embeddable_as(PhantomVerifier)]
mod phantom_verifier_impl {
    use super::{
        Storage, MODE_CUSTOM, MODE_NATIVE, MIN_TIMELOCK_SECONDS,
        ProofVerified, VerificationModeChanged, ModeChangeScheduled, OwnerChanged,
    };
    use starknet::event::EventEmitter;
    use starknet::get_block_timestamp;

    #[abi(embed_v0)]
    trait IPhantomVerifier {
        fn verify_proof(
            self: @ContractState,
            circuit_id: felt252,
            public_inputs: Span<felt252>,
            proof: Span<felt252>,
        ) -> bool;
        
        fn schedule_mode_change(ref self: ContractState, new_mode: u8);
        fn execute_mode_change(ref self: ContractState);
        fn get_verification_mode(self: @ContractState) -> u8;
        fn get_pending_mode_change(self: @ContractState) -> (u8, u64);
        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress);
    }

    #[external(v0)]
    fn verify_proof(
        self: @ContractState,
        circuit_id: felt252,
        public_inputs: Span<felt252>,
        proof: Span<felt252>,
    ) -> bool {
        let mode = self.verification_mode.read();
        let verified = match mode {
            MODE_CUSTOM => self._verify_custom(circuit_id, public_inputs, proof),
            MODE_NATIVE => self._verify_native(circuit_id, public_inputs, proof),
            _ => panic('Invalid verification mode'),
        };

        self.emit(ProofVerified {
            circuit_id,
            verified,
            timestamp: get_block_timestamp(),
        });

        verified
    }

    #[external(v0)]
    fn schedule_mode_change(ref self: ContractState, new_mode: u8) {
        assert(new_mode == MODE_CUSTOM || new_mode == MODE_NATIVE, 'Invalid mode');
        
        let owner = self.owner.read();
        assert(get_caller_address() == owner, 'Only owner can schedule mode change');
        
        let valid_after = get_block_timestamp() + MIN_TIMELOCK_SECONDS;
        self.pending_mode_change.write((new_mode, valid_after));
        
        self.emit(ModeChangeScheduled {
            new_mode,
            valid_after,
            timestamp: get_block_timestamp(),
        });
    }

    #[external(v0)]
    fn execute_mode_change(ref self: ContractState) {
        let (new_mode, valid_after) = self.pending_mode_change.read();
        let current_time = get_block_timestamp();
        
        assert(current_time >= valid_after, 'Timelock not elapsed');
        
        let old_mode = self.verification_mode.read();
        self.verification_mode.write(new_mode);
        self.pending_mode_change.write((0, 0)); // Clear pending
        
        self.emit(VerificationModeChanged {
            old_mode,
            new_mode,
            timestamp: current_time,
        });
    }

    #[external(v0)]
    fn get_verification_mode(self: @ContractState) -> u8 {
        self.verification_mode.read()
    }

    #[external(v0)]
    fn get_pending_mode_change(self: @ContractState) -> (u8, u64) {
        self.pending_mode_change.read()
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        assert(new_owner != ContractAddress::ZERO, 'Invalid owner address');
        
        let old_owner = self.owner.read();
        assert(get_caller_address() == old_owner, 'Only owner can transfer ownership');
        
        self.owner.write(new_owner);
        
        self.emit(OwnerChanged {
            old_owner,
            new_owner,
        });
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _verify_custom(
            self: @ContractState,
            circuit_id: felt252,
            public_inputs: Span<felt252>,
            proof: Span<felt252>,
        ) -> bool {
            // CUSTOM mode: Stwo proof verification
            // This is a placeholder for the actual Stwo verification logic
            // In production, this deserializes the proof and runs the Stwo verifier
            
            // CRITICAL: Never return true without actual verification
            // The proof must be cryptographically verified
            
            // For now, we return false to indicate that custom verification
            // requires the actual Stwo verifier implementation
            // This will be replaced with real verification logic
            
            // Proof format: [circuit_public_inputs_hash, proof_data...]
            if proof.len() == 0 {
                return false;
            }
            
            // Verify proof structure
            // In real implementation: deserialize Stwo proof, verify against public inputs
            
            // Placeholder that always returns false until real Stwo integration
            // This prevents deployment without real verification
            false
        }

        fn _verify_native(
            self: @ContractState,
            circuit_id: felt252,
            public_inputs: Span<felt252>,
            proof: Span<felt252>,
        ) -> bool {
            // NATIVE mode: Starknet 0.14.2 verify_stark_proof syscall
            // This will use the native verification when available
            
            // For now, return false to indicate native mode is not yet available
            // Will be implemented when Starknet 0.14.2 is released
            false
        }
    }
}

#[constructor]
fn constructor(ref self: ContractState, owner: ContractAddress) {
    assert(owner != ContractAddress::ZERO, 'Invalid owner address');
    self.owner.write(owner);
    self.verification_mode.write(MODE_CUSTOM);
    self.timelock_duration.write(MIN_TIMELOCK_SECONDS);
}
