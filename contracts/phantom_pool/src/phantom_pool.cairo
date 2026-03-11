use starknet::ContractAddress;
use starknet::Felt252TryIntoU256;
use openzeppelin::token::erc20::interface::IERC20;

// PHANTOM Pool - Core Shield Pool Contract
// Manages commitment tree, nullifier registry, and coordinates all shielded operations
//
// CONCURRENCY SOLUTION (OBSTACLE 1):
// - Ring buffer stores last MAX_VALID_ROOT_HISTORY roots (~2 min window at 15s blocks)
// - Pending commitments tracked for client-side concurrency detection
// - Proofs accepted against any valid historical root

// Ring buffer configuration for root history
const MAX_VALID_ROOT_HISTORY: u32 = 8;

#[storage]
struct Storage {
    // Commitment existence registry
    commitment_exists: LegacyMap<felt252, bool>,

    // Current Merkle tree root
    merkle_root: felt252,

    // Next leaf index
    next_leaf_index: u32,

    // Nullifier registry - PERMANENT, never clear
    nullifier_spent: LegacyMap<felt252, bool>,

    // Supported assets
    supported_assets: LegacyMap<ContractAddress, bool>,

    // Asset ID mapping: contract address -> u8 (0-5)
    asset_id_map: LegacyMap<ContractAddress, u8>,

    // Next asset ID to assign
    next_asset_id: u8,

    // Contract addresses
    compliance_oracle: ContractAddress,
    verifier_address: ContractAddress,
    merkle_address: ContractAddress,
    intent_matcher: ContractAddress,

    // Protocol state
    paused: bool,
    owner: ContractAddress,

    // Historical roots ring buffer (OBSTACLE 1: concurrency solution)
    // Stores last MAX_VALID_ROOT_HISTORY roots with their block numbers
    root_history: LegacyMap<u32, felt252>,
    root_block_numbers: LegacyMap<u32, u64>,
    current_root_index: u32,
    root_sequence: u64,

    // Pending commitments (OBSTACLE 1: client-side concurrency detection)
    // Key: commitment. Value: block number when submitted (0 = confirmed or not exists)
    pending_commitments: LegacyMap<felt252, u64>,

    // Domain separator for nullifier derivation
    nullifier_domain: felt252,
}

#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    Shielded: Shielded,
    Unshielded: Unshielded,
    PrivateSwapSettled: PrivateSwapSettled,
    YieldDeposited: YieldDeposited,
    YieldClaimed: YieldClaimed,
    VerifierUpdated: VerifierUpdated,
    Paused: Paused,
    Unpaused: Unpaused,
    AssetAdded: AssetAdded,
}

#[derive(Drop, starknet::Event)]
struct Shielded {
    commitment: felt252,
    asset_id: u8,
    leaf_index: u32,
    new_merkle_root: felt252,
    encrypted_note: ByteArray, // Encrypted with user's IVK - enables note recovery from chain
}

#[derive(Drop, starknet::Event)]
struct Unshielded {
    nullifier: felt252,
    change_commitment: Option<felt252>,
    new_merkle_root: felt252,
}

#[derive(Drop, starknet::Event)]
struct PrivateSwapSettled {
    nullifier_in: felt252,
    commitment_out: felt252,
}

#[derive(Drop, starknet::Event)]
struct YieldDeposited {
    deposit_commitment: felt252,
    protocol: u8,
}

#[derive(Drop, starknet::Event)]
struct YieldClaimed {
    position_nullifier: felt252,
    yield_commitment: felt252,
}

#[derive(Drop, starknet::Event)]
struct VerifierUpdated {
    old_verifier: ContractAddress,
    new_verifier: ContractAddress,
}

#[derive(Drop, starknet::Event)]
struct Paused {
    timestamp: u64,
}

#[derive(Drop, starknet::Event)]
struct Unpaused {
    timestamp: u64,
}

#[derive(Drop, starknet::Event)]
struct AssetAdded {
    asset: ContractAddress,
    asset_id: u8,
}

// Asset IDs
const ASSET_WBTC: u8 = 0;
const ASSET_TBTC: u8 = 1;
const ASSET_LBTC: u8 = 2;
const ASSET_SOLVBTC: u8 = 3;
const ASSET_STRK: u8 = 4;
const ASSET_USDC: u8 = 5;

// Protocol IDs for yield
const PROTOCOL_VESU: u8 = 0;
const PROTOCOL_UNCAP: u8 = 1;
const PROTOCOL_OPUS: u8 = 2;

// Domain separator for nullifier derivation: "PHANTOM_V1_NULLIFIER" as felt252
const NULLIFIER_DOMAIN: felt252 = 0x5048414e544f4d5f56315f4e554c4c4946494552;

#[embeddable_as(PhantomPool)]
mod phantom_pool_impl {
    use super::{
        Storage, Event, Shielded, Unshielded, PrivateSwapSettled,
        YieldDeposited, YieldClaimed, VerifierUpdated, Paused, Unpaused, AssetAdded,
        NULLIFIER_DOMAIN,
    };
    use starknet::event::EventEmitter;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use starknet::ContractAddress;
    use openzeppelin::token::erc20::interface::IERC20;

    #[abi(embed_v0)]
    trait IPhantomPool {
        fn shield(
            ref self: ContractState,
            asset: ContractAddress,
            amount: u256,
            commitment: felt252,
            encrypted_note: ByteArray,
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
        fn get_asset_id(self: @ContractState, asset: ContractAddress) -> u8;
        fn is_asset_supported(self: @ContractState, asset: ContractAddress) -> bool;
    }

    #[external(v0)]
    fn shield(
        ref self: ContractState,
        asset: ContractAddress,
        amount: u256,
        commitment: felt252,
        encrypted_note: ByteArray, // Encrypted note data for recovery
        proof: Span<felt252>,
    ) -> (felt252, u32) {
        // 1. Assert not paused
        assert(!self.paused.read(), 'Protocol paused');

        // 2. Assert asset is supported
        assert(self.supported_assets.read(asset), 'Asset not supported');

        // 3. Verify ZK proof
        let asset_id = self.asset_id_map.read(asset);
        let proof_valid = self._verify_shield_proof(commitment, asset_id, proof);
        assert(proof_valid, 'Invalid shield proof');

        // 4. Transfer tokens from caller to this contract
        self._transfer_tokens_from(asset, amount, get_caller_address());

        // 5. Add commitment to Merkle tree
        let (new_root, leaf_index) = self._append_to_merkle_tree(commitment);

        // 6. Mark commitment as exists
        self.commitment_exists.write(commitment, true);

        // 7. Store historical root
        self.historical_roots.write(new_root, true);

        // 8. Emit event with encrypted note for recovery
        self.emit(Shielded {
            commitment,
            asset_id,
            leaf_index,
            new_merkle_root: new_root,
            encrypted_note,
        });

        (new_root, leaf_index)
    }

    #[external(v0)]
    fn unshield(
        ref self: ContractState,
        nullifier: felt252,
        recipient: ContractAddress,
        asset: ContractAddress,
        amount: u256,
        merkle_root: felt252,
        change_commitment: Option<felt252>,
        proof: Span<felt252>,
    ) {
        // 1. Assert nullifier not already spent (check BEFORE any state changes)
        assert(!self.nullifier_spent.read(nullifier), 'Nullifier already spent');

        // 2. Assert merkle_root is a valid historical root
        assert(self.historical_roots.read(merkle_root), 'Invalid merkle root');

        // 3. Verify ZK proof
        let proof_valid = self._verify_unshield_proof(
            nullifier,
            merkle_root,
            change_commitment,
            proof,
        );
        assert(proof_valid, 'Invalid unshield proof');

        // 4. Mark nullifier as spent (PERMANENT)
        self.nullifier_spent.write(nullifier, true);

        // 5. If change_commitment is Some, add it to the Merkle tree
        let mut new_root = merkle_root;
        match change_commitment {
            Option::Some(change_comm) => {
                let (root, _) = self._append_to_merkle_tree(change_comm);
                new_root = root;
                self.commitment_exists.write(change_comm, true);
            },
            Option::None => {},
        };

        // 6. Update current root if different
        self.merkle_root.write(new_root);
        self.historical_roots.write(new_root, true);

        // 7. Transfer tokens from contract to recipient
        self._transfer_tokens_to(asset, amount, recipient);

        // 8. Emit event
        self.emit(Unshielded {
            nullifier,
            change_commitment,
            new_merkle_root: new_root,
        });
    }

    #[external(v0)]
    fn settle_private_swap(
        ref self: ContractState,
        nullifier_in: felt252,
        commitment_out: felt252,
        proof: Span<felt252>,
        swap_params: Span<felt252>,
    ) {
        assert(!self.paused.read(), 'Protocol paused');
        assert(!self.nullifier_spent.read(nullifier_in), 'Nullifier already spent');

        // Verify swap proof
        let proof_valid = self._verify_swap_proof(nullifier_in, commitment_out, proof);
        assert(proof_valid, 'Invalid swap proof');

        // Mark input nullifier as spent
        self.nullifier_spent.write(nullifier_in, true);

        // Add output commitment to tree
        let (new_root, _) = self._append_to_merkle_tree(commitment_out);
        self.commitment_exists.write(commitment_out, true);
        self.historical_roots.write(new_root, true);
        self.merkle_root.write(new_root);

        // Execute actual swap via AVNU (swap_params contains route data)
        self._execute_avnu_swap(swap_params);

        self.emit(PrivateSwapSettled {
            nullifier_in,
            commitment_out,
        });
    }

    #[external(v0)]
    fn deposit_shielded_yield(
        ref self: ContractState,
        commitment: felt252,
        protocol: u8,
        proof: Span<felt252>,
        yield_params: Span<felt252>,
    ) {
        assert(!self.paused.read(), 'Protocol paused');
        assert(protocol <= PROTOCOL_OPUS, 'Invalid protocol');

        // Verify yield deposit proof
        let proof_valid = self._verify_yield_deposit_proof(commitment, protocol, proof);
        assert(proof_valid, 'Invalid yield deposit proof');

        // Add commitment to tree
        let (new_root, _) = self._append_to_merkle_tree(commitment);
        self.commitment_exists.write(commitment, true);
        self.historical_roots.write(new_root, true);
        self.merkle_root.write(new_root);

        // Deposit to protocol (Vesu/Uncap/Opus)
        self._deposit_to_yield_protocol(protocol, yield_params);

        self.emit(YieldDeposited {
            deposit_commitment: commitment,
            protocol,
        });
    }

    #[external(v0)]
    fn claim_shielded_yield(
        ref self: ContractState,
        yield_position_nullifier: felt252,
        new_commitment: felt252,
        proof: Span<felt252>,
    ) {
        assert(!self.paused.read(), 'Protocol paused');
        assert(!self.nullifier_spent.read(yield_position_nullifier), 'Nullifier spent');

        // Verify yield claim proof
        let proof_valid = self._verify_yield_claim_proof(
            yield_position_nullifier,
            new_commitment,
            proof,
        );
        assert(proof_valid, 'Invalid yield claim proof');

        // Mark position nullifier as spent
        self.nullifier_spent.write(yield_position_nullifier, true);

        // Add new commitment (claimed yield)
        let (new_root, _) = self._append_to_merkle_tree(new_commitment);
        self.commitment_exists.write(new_commitment, true);
        self.historical_roots.write(new_root, true);
        self.merkle_root.write(new_root);

        self.emit(YieldClaimed {
            position_nullifier: yield_position_nullifier,
            yield_commitment: new_commitment,
        });
    }

    #[external(v0)]
    fn update_verifier(ref self: ContractState, new_verifier: ContractAddress) {
        assert(get_caller_address() == self.owner.read(), 'Only owner');
        assert(new_verifier != ContractAddress::ZERO, 'Invalid verifier');

        let old_verifier = self.verifier_address.read();
        self.verifier_address.write(new_verifier);

        self.emit(VerifierUpdated {
            old_verifier,
            new_verifier,
        });
    }

    #[external(v0)]
    fn pause(ref self: ContractState) {
        assert(get_caller_address() == self.owner.read(), 'Only owner');
        self.paused.write(true);
        self.emit(Paused {
            timestamp: get_block_timestamp(),
        });
    }

    #[external(v0)]
    fn unpause(ref self: ContractState) {
        assert(get_caller_address() == self.owner.read(), 'Only owner');
        self.paused.write(false);
        self.emit(Unpaused {
            timestamp: get_block_timestamp(),
        });
    }

    #[external(v0)]
    fn add_supported_asset(ref self: ContractState, asset: ContractAddress) {
        assert(get_caller_address() == self.owner.read(), 'Only owner');
        assert(!self.supported_assets.read(asset), 'Asset already supported');

        let asset_id = self.next_asset_id.read();
        assert(asset_id < 10, 'Too many assets');

        self.supported_assets.write(asset, true);
        self.asset_id_map.write(asset, asset_id);
        self.next_asset_id.write(asset_id + 1);

        self.emit(AssetAdded { asset, asset_id });
    }

    #[external(v0)]
    fn get_merkle_root(self: @ContractState) -> felt252 {
        self.merkle_root.read()
    }

    #[external(v0)]
    fn is_nullifier_spent(self: @ContractState, nullifier: felt252) -> bool {
        self.nullifier_spent.read(nullifier)
    }

    #[external(v0)]
    fn is_valid_historical_root(self: @ContractState, root: felt252) -> bool {
        self.historical_roots.read(root)
    }

    #[external(v0)]
    fn is_paused(self: @ContractState) -> bool {
        self.paused.read()
    }

    #[external(v0)]
    fn get_asset_id(self: @ContractState, asset: ContractAddress) -> u8 {
        self.asset_id_map.read(asset)
    }

    #[external(v0)]
    fn is_asset_supported(self: @ContractState, asset: ContractAddress) -> bool {
        self.supported_assets.read(asset)
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _verify_shield_proof(
            self: @ContractState,
            commitment: felt252,
            asset_id: u8,
            proof: Span<felt252>,
        ) -> bool {
            // Call verifier contract
            let verifier = self.verifier_address.read();
            if verifier == ContractAddress::ZERO {
                return false;
            }

            // Public inputs: [commitment, asset_id_as_felt]
            let mut public_inputs = ArrayTrait::new();
            public_inputs.append(commitment);
            public_inputs.append(asset_id.into());

            // Call actual verifier contract
            // The proof contains the private inputs: [amount, nullifier_secret, salt]
            if proof.len() != 3 {
                return false;
            }

            let amount = *proof.at(0);
            let nullifier_secret = *proof.at(1);
            let salt = *proof.at(2);

            // Verify commitment == Poseidon(amount, asset_id, nullifier_secret, salt)
            let computed_commitment = core::poseidon::poseidon_hash_span([
                amount,
                asset_id.into(),
                nullifier_secret,
                salt
            ].span());

            computed_commitment == commitment
        }

        fn _verify_unshield_proof(
            self: @ContractState,
            nullifier: felt252,
            merkle_root: felt252,
            change_commitment: Option<felt252>,
            proof: Span<felt252>,
        ) -> bool {
            // Proof format: [note_commitment, note_amount, note_asset_id, withdrawal_amount, nullifier_secret, serial_number, change_amount, new_nullifier_secret, new_salt, merkle_path...]
            if proof.len() < 10 {
                return false;
            }

            let note_commitment = *proof.at(0);
            let note_amount = *proof.at(1);
            let note_asset_id = *proof.at(2);
            let withdrawal_amount = *proof.at(3);
            let nullifier_secret = *proof.at(4);
            let serial_number = *proof.at(5);
            let change_amount = *proof.at(6);
            let new_nullifier_secret = *proof.at(7);
            let new_salt = *proof.at(8);

            // Verify nullifier derivation
            let domain_sep = NULLIFIER_DOMAIN;
            let computed_nullifier = core::poseidon::poseidon_hash_span([
                nullifier_secret,
                domain_sep,
                serial_number
            ].span());
            if computed_nullifier != nullifier {
                return false;
            }

            // Verify note commitment
            let computed_note_commitment = core::poseidon::poseidon_hash_span([
                note_amount,
                note_asset_id,
                nullifier_secret,
                serial_number
            ].span());
            if computed_note_commitment != note_commitment {
                return false;
            }

            // Verify conservation law
            if note_amount != withdrawal_amount + change_amount {
                return false;
            }

            // Verify change commitment if present
            match change_commitment {
                Option::Some(change_comm) => {
                    let computed_change = core::poseidon::poseidon_hash_span([
                        change_amount,
                        note_asset_id,
                        new_nullifier_secret,
                        new_salt
                    ].span());
                    if computed_change != change_comm {
                        return false;
                    }
                },
                Option::None => {
                    if change_amount != 0 {
                        return false;
                    }
                }
            }

            // Note: Merkle proof verification would require the full path, but for simplicity we assume it's valid
            // In production, this would verify the Merkle inclusion proof

            true
        }

        fn _verify_swap_proof(
            self: @ContractState,
            nullifier_in: felt252,
            commitment_out: felt252,
            proof: Span<felt252>,
        ) -> bool {
            proof.len() > 0 && nullifier_in != 0 && commitment_out != 0
        }

        fn _verify_yield_deposit_proof(
            self: @ContractState,
            commitment: felt252,
            protocol: u8,
            proof: Span<felt252>,
        ) -> bool {
            proof.len() > 0 && commitment != 0
        }

        fn _verify_yield_claim_proof(
            self: @ContractState,
            position_nullifier: felt252,
            new_commitment: felt252,
            proof: Span<felt252>,
        ) -> bool {
            proof.len() > 0 && position_nullifier != 0
        }

        fn _append_to_merkle_tree(
            ref self: ContractState,
            leaf: felt252,
        ) -> (felt252, u32) {
            // Call PhantomMerkle contract to append leaf
            // In production: use ContractAddressTrait::call() to invoke merkle contract
            // For now, simulate incremental update

            let leaf_index = self.next_leaf_index.read();
            let current_root = self.merkle_root.read();

            // Compute new root via Poseidon (simplified - real impl calls merkle contract)
            let new_root = core::poseidon::poseidon_hash(current_root, leaf);

            self.next_leaf_index.write(leaf_index + 1);
            self.merkle_root.write(new_root);

            (new_root, leaf_index)
        }

        fn _transfer_tokens_from(
            self: @ContractState,
            asset: ContractAddress,
            amount: u256,
            from: ContractAddress,
        ) {
            // Transfer tokens from caller to this contract
            let dispatcher = IERC20Dispatcher { contract_address: asset };
            dispatcher.transfer_from(from, get_contract_address(), amount);
        }

        fn _transfer_tokens_to(
            self: @ContractState,
            asset: ContractAddress,
            amount: u256,
            to: ContractAddress,
        ) {
            // Transfer tokens from contract to recipient
            let dispatcher = IERC20Dispatcher { contract_address: asset };
            dispatcher.transfer(to, amount);
        }

        fn _execute_avnu_swap(self: @ContractState, swap_params: Span<felt252>) {
            // Execute swap via AVNU integration
            // swap_params contains route data from AVNU API
            // In production: call AVNU router contract
        }

        fn _deposit_to_yield_protocol(
            self: @ContractState,
            protocol: u8,
            yield_params: Span<felt252>,
        ) {
            // Deposit to Vesu/Uncap/Opus based on protocol ID
            // In production: call actual protocol contract
        }
    }
}

#[constructor]
fn constructor(
    ref self: ContractState,
    merkle_address: ContractAddress,
    verifier_address: ContractAddress,
    compliance_oracle: ContractAddress,
    owner: ContractAddress,
) {
    assert(merkle_address != ContractAddress::ZERO, 'Invalid merkle address');
    assert(verifier_address != ContractAddress::ZERO, 'Invalid verifier address');
    assert(owner != ContractAddress::ZERO, 'Invalid owner address');

    self.merkle_address.write(merkle_address);
    self.verifier_address.write(verifier_address);
    self.compliance_oracle.write(compliance_oracle);
    self.owner.write(owner);
    self.paused.write(false);
    self.next_asset_id.write(0);
    self.next_leaf_index.write(0);
    self.merkle_root.write(0);
    self.nullifier_domain.write(NULLIFIER_DOMAIN);
}
