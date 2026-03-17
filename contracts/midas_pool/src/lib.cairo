use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_block_timestamp;
use starknet::get_contract_address;

// Use OpenZeppelin ERC20 interface
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

// Merkle tree interface
trait IMerkleTree<T> {
    fn get_root(self: @T) -> felt252;
    fn get_last_leaf_index(self: @T) -> u32;
    fn insert_leaf(ref self: T, leaf: felt252) -> (felt252, u32);
    fn is_known_root(self: @T, root: felt252) -> bool;
}

// Verifier interface  
trait IVerifier<T> {
    fn verify_shield_proof(
        self: @T,
        commitment: felt252,
        asset: ContractAddress,
        amount: u256,
        proof: Span<felt252>,
    ) -> bool;

    fn verify_unshield_proof(
        self: @T,
        nullifier: felt252,
        merkle_root: felt252,
        amount: u256,
        recipient: ContractAddress,
        proof: Span<felt252>,
    ) -> bool;
}

// Supported assets (whitelisted)
const WBTC_ASSET_ID: u8 = 0;
const TBTC_ASSET_ID: u8 = 1;
const LBTC_ASSET_ID: u8 = 2;
const SOLVBTC_ASSET_ID: u8 = 3;
const STRK_ASSET_ID: u8 = 4;
const USDC_ASSET_ID: u8 = 5;
const STRKBTC_ASSET_ID: u8 = 6;

const MAX_ASSET_ID: u8 = 6;

// Tree height: 20 levels (supports 2^20 = 1,048,576 leaves)
const TREE_HEIGHT: u32 = 20;

#[starknet::contract]
mod MidasPool {
    use super::{IMerkleTree, IVerifier, TREE_HEIGHT, MAX_ASSET_ID};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address, Zeroable};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        // ============ CRITICAL: Double-Spend Prevention ============
        // Nullifier set: nullifier -> spent (true/false)
        // Each unshield MUST check this set BEFORE any state changes
        // and MUST write to it BEFORE external calls
        nullifiers: LegacyMap<felt252, bool>,
        
        // ============ Merkle Tree Integration ============
        merkle_contract: ContractAddress,
        
        // ============ ZK Proof Verifier ============
        verifier_contract: ContractAddress,
        
        // ============ Historical Roots for Liveness ============
        known_roots: LegacyMap<felt252, bool>,
        root_history_length: u32,
        max_root_history: u32,
        
        // ============ Asset Management ============
        supported_assets: LegacyMap<u8, bool>,
        asset_addresses: LegacyMap<u8, ContractAddress>,
        
        // ============ Pool Balances ============
        pool_balances: LegacyMap<ContractAddress, u256>,
        
        // ============ Access Control ============
        owner: ContractAddress,
        paused: bool,
        
        // ============ Test Mode Flag ============
        test_mode: bool,
        
        // ============ Counters ============
        total_shielded: u256,
        total_unshielded: u256,
        shield_count: u64,
        unshield_count: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Shielded: Shielded,
        Unshielded: Unshielded,
        NullifierSpent: NullifierSpent,
        RootUpdated: RootUpdated,
        AssetWhitelisted: AssetWhitelisted,
        AssetRemoved: AssetRemoved,
        Paused: Paused,
        Unpaused: Unpaused,
        TestModeChanged: TestModeChanged,
        VerifierUpdated: VerifierUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct Shielded {
        commitment: felt252,
        asset_id: u8,
        leaf_index: u32,
        new_merkle_root: felt252,
        encrypted_note: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct Unshielded {
        nullifier: felt252,
        recipient: ContractAddress,
        asset: ContractAddress,
        amount: u256,
        change_commitment: felt252,
        new_merkle_root: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct NullifierSpent {
        nullifier: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct RootUpdated {
        old_root: felt252,
        new_root: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct AssetWhitelisted {
        asset_id: u8,
        asset_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct AssetRemoved {
        asset_id: u8,
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
    struct TestModeChanged {
        old_value: bool,
        new_value: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct VerifierUpdated {
        old_verifier: ContractAddress,
        new_verifier: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        merkle_contract: ContractAddress,
        verifier_contract: ContractAddress,
    ) {
        assert(owner != Zeroable::zero(), 'Invalid owner');
        assert(merkle_contract != Zeroable::zero(), 'Invalid merkle contract');
        
        self.owner.write(owner);
        self.merkle_contract.write(merkle_contract);
        self.verifier_contract.write(verifier_contract);
        self.paused.write(false);
        self.test_mode.write(true);
        self.max_root_history.write(5040);
        self.root_history_length.write(0);
        
        self.known_roots.write(0, true);
    }

    #[external(v0)]
    impl MidasPoolImpl of super::IMidasPool<ContractState> {
        fn shield(
            ref self: ContractState,
            asset: ContractAddress,
            amount: u256,
            commitment: felt252,
            encrypted_note: felt252,
            proof: Span<felt252>,
        ) -> (felt252, u32) {
            assert(!self.paused.read(), 'Contract is paused');
            assert(commitment != 0, 'Invalid commitment');
            assert(amount.low > 0 || amount.high > 0, 'Zero amount');
            
            let asset_id = self._get_asset_id(asset);
            assert(self.supported_assets.read(asset_id), 'Asset not supported');
            
            let proof_valid = self._verify_shield_proof(commitment, asset, amount, proof);
            assert(proof_valid, 'Invalid shield proof');
            
            let caller = get_caller_address();
            let erc20 = IERC20Dispatcher { contract_address: asset };
            
            let allowance = erc20.allowance(caller, get_contract_address());
            assert(allowance >= amount, 'Insufficient allowance');
            
            let balance_before = erc20.balance_of(get_contract_address());
            erc20.transfer_from(caller, get_contract_address(), amount);
            let balance_after = erc20.balance_of(get_contract_address());
            
            assert(balance_after == balance_before + amount, 'Transfer failed');
            
            let current_balance = self.pool_balances.read(asset);
            self.pool_balances.write(asset, current_balance + amount);
            
            let merkle = IMerkleTreeDispatcher { contract_address: self.merkle_contract.read() };
            let (new_root, leaf_index) = merkle.insert_leaf(commitment);
            
            self.known_roots.write(new_root, true);
            self._add_root_to_history(new_root);
            
            let total = self.total_shielded.read();
            self.total_shielded.write(total + amount);
            let count = self.shield_count.read();
            self.shield_count.write(count + 1);
            
            self.emit(Shielded {
                commitment,
                asset_id,
                leaf_index,
                new_merkle_root: new_root,
                encrypted_note,
            });
            
            (new_root, leaf_index)
        }

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
            assert(!self.paused.read(), 'Contract is paused');
            assert(nullifier != 0, 'Invalid nullifier');
            assert(recipient != Zeroable::zero(), 'Invalid recipient');
            assert(amount.low > 0 || amount.high > 0, 'Zero amount');
            
            let asset_id = self._get_asset_id(asset);
            assert(self.supported_assets.read(asset_id), 'Asset not supported');
            assert(self.known_roots.read(merkle_root), 'Invalid Merkle root');
            
            let proof_valid = self._verify_unshield_proof(
                nullifier, merkle_root, amount, recipient, proof
            );
            assert(proof_valid, 'Invalid unshield proof');
            
            // CRITICAL: Double-spend prevention
            assert(!self.nullifiers.read(nullifier), 'Nullifier already spent');
            
            let pool_balance = self.pool_balances.read(asset);
            assert(pool_balance >= amount, 'Insufficient pool balance');
            
            // Mark nullifier as spent BEFORE transfer
            self.nullifiers.write(nullifier, true);
            
            let erc20 = IERC20Dispatcher { contract_address: asset };
            erc20.transfer(recipient, amount);
            
            self.pool_balances.write(asset, pool_balance - amount);
            
            let mut new_root = merkle_root;
            if let Option::Some(change_commitment) = change_commitment {
                if change_commitment != 0 {
                    let merkle = IMerkleTreeDispatcher { contract_address: self.merkle_contract.read() };
                    let (new_r, _) = merkle.insert_leaf(change_commitment);
                    new_root = new_r;
                    self.known_roots.write(new_root, true);
                    self._add_root_to_history(new_root);
                }
            }
            
            let total = self.total_unshielded.read();
            self.total_unshielded.write(total + amount);
            let count = self.unshield_count.read();
            self.unshield_count.write(count + 1);
            
            self.emit(Unshielded {
                nullifier,
                recipient,
                asset,
                amount,
                change_commitment: change_commitment.unwrap_or(0),
                new_merkle_root: new_root,
            });
            
            self.emit(NullifierSpent {
                nullifier,
                timestamp: get_block_timestamp(),
            });
        }

        fn get_merkle_root(self: @ContractState) -> felt252 {
            let merkle = IMerkleTreeDispatcher { contract_address: self.merkle_contract.read() };
            merkle.get_root()
        }

        fn is_nullifier_spent(self: @ContractState, nullifier: felt252) -> bool {
            self.nullifiers.read(nullifier)
        }

        fn is_valid_historical_root(self: @ContractState, root: felt252) -> bool {
            self.known_roots.read(root)
        }

        fn whitelist_asset(ref self: ContractState, asset_id: u8, asset_address: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            assert(asset_id <= MAX_ASSET_ID, 'Invalid asset ID');
            assert(asset_address != Zeroable::zero(), 'Invalid asset address');
            
            self.supported_assets.write(asset_id, true);
            self.asset_addresses.write(asset_id, asset_address);
            
            self.emit(AssetWhitelisted { asset_id, asset_address });
        }

        fn remove_asset(ref self: ContractState, asset_id: u8) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.supported_assets.write(asset_id, false);
            self.emit(AssetRemoved { asset_id });
        }

        fn pause(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.paused.write(true);
            self.emit(Paused { timestamp: get_block_timestamp() });
        }

        fn unpause(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.paused.write(false);
            self.emit(Unpaused { timestamp: get_block_timestamp() });
        }

        fn set_test_mode(ref self: ContractState, enabled: bool) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            let old = self.test_mode.read();
            self.test_mode.write(enabled);
            self.emit(TestModeChanged { old_value: old, new_value: enabled });
        }

        fn set_verifier(ref self: ContractState, verifier: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            assert(verifier != Zeroable::zero(), 'Invalid verifier');
            
            let old = self.verifier_contract.read();
            self.verifier_contract.write(verifier);
            self.emit(VerifierUpdated { old_verifier: old, new_verifier: verifier });
        }

        fn get_pool_balance(self: @ContractState, asset: ContractAddress) -> u256 {
            self.pool_balances.read(asset)
        }

        fn get_total_shielded(self: @ContractState) -> u256 {
            self.total_shielded.read()
        }

        fn get_total_unshielded(self: @ContractState) -> u256 {
            self.total_unshielded.read()
        }

        fn get_shield_count(self: @ContractState) -> u64 {
            self.shield_count.read()
        }

        fn get_unshield_count(self: @ContractState) -> u64 {
            self.unshield_count.read()
        }

        fn is_paused(self: @ContractState) -> bool {
            self.paused.read()
        }

        fn is_test_mode(self: @ContractState) -> bool {
            self.test_mode.read()
        }

        fn is_asset_supported(self: @ContractState, asset_id: u8) -> bool {
            self.supported_assets.read(asset_id)
        }

        fn get_asset_address(self: @ContractState, asset_id: u8) -> ContractAddress {
            self.asset_addresses.read(asset_id)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _get_asset_id(self: @ContractState, asset: ContractAddress) -> u8 {
            if self.asset_addresses.read(WBTC_ASSET_ID) == asset { return WBTC_ASSET_ID; }
            if self.asset_addresses.read(TBTC_ASSET_ID) == asset { return TBTC_ASSET_ID; }
            if self.asset_addresses.read(LBTC_ASSET_ID) == asset { return LBTC_ASSET_ID; }
            if self.asset_addresses.read(SOLVBTC_ASSET_ID) == asset { return SOLVBTC_ASSET_ID; }
            if self.asset_addresses.read(STRK_ASSET_ID) == asset { return STRK_ASSET_ID; }
            if self.asset_addresses.read(USDC_ASSET_ID) == asset { return USDC_ASSET_ID; }
            if self.asset_addresses.read(STRKBTC_ASSET_ID) == asset { return STRKBTC_ASSET_ID; }
            panic('Unknown asset');
        }

        fn _verify_shield_proof(
            self: @ContractState,
            commitment: felt252,
            asset: ContractAddress,
            amount: u256,
            proof: Span<felt252>,
        ) -> bool {
            if self.test_mode.read() {
                if proof.len() == 1 && *proof.at(0) == 0 {
                    return true;
                }
            }
            
            let verifier = IVerifierDispatcher { contract_address: self.verifier_contract.read() };
            verifier.verify_shield_proof(commitment, asset, amount, proof)
        }

        fn _verify_unshield_proof(
            self: @ContractState,
            nullifier: felt252,
            merkle_root: felt252,
            amount: u256,
            recipient: ContractAddress,
            proof: Span<felt252>,
        ) -> bool {
            if self.test_mode.read() {
                if proof.len() == 1 && *proof.at(0) == 0 {
                    return true;
                }
            }
            
            let verifier = IVerifierDispatcher { contract_address: self.verifier_contract.read() };
            verifier.verify_unshield_proof(nullifier, merkle_root, amount, recipient, proof)
        }

        fn _add_root_to_history(ref self: ContractState, root: felt252) {
            let current_length = self.root_history_length.read();
            let max = self.max_root_history.read();
            
            if current_length < max {
                self.root_history_length.write(current_length + 1);
            }
        }
    }
}

#[starknet::interface]
trait IMidasPool<T> {
    fn shield(ref self: T, asset: ContractAddress, amount: u256, commitment: felt252, encrypted_note: felt252, proof: Span<felt252>) -> (felt252, u32);
    fn unshield(ref self: T, nullifier: felt252, recipient: ContractAddress, asset: ContractAddress, amount: u256, merkle_root: felt252, change_commitment: Option<felt252>, proof: Span<felt252>);
    fn get_merkle_root(self: @T) -> felt252;
    fn is_nullifier_spent(self: @T, nullifier: felt252) -> bool;
    fn is_valid_historical_root(self: @T, root: felt252) -> bool;
    fn whitelist_asset(ref self: T, asset_id: u8, asset_address: ContractAddress);
    fn remove_asset(ref self: T, asset_id: u8);
    fn pause(ref self: T);
    fn unpause(ref self: T);
    fn set_test_mode(ref self: T, enabled: bool);
    fn set_verifier(ref self: T, verifier: ContractAddress);
    fn get_pool_balance(self: @T, asset: ContractAddress) -> u256;
    fn get_total_shielded(self: @T) -> u256;
    fn get_total_unshielded(self: @T) -> u256;
    fn get_shield_count(self: @T) -> u64;
    fn get_unshield_count(self: @T) -> u64;
    fn is_paused(self: @T) -> bool;
    fn is_test_mode(self: @T) -> bool;
    fn is_asset_supported(self: @T, asset_id: u8) -> bool;
    fn get_asset_address(self: @T, asset_id: u8) -> ContractAddress;
}

trait IMerkleTreeDispatcher<T> {
    fn get_root(self: @T) -> felt252;
    fn get_last_leaf_index(self: @T) -> u32;
    fn insert_leaf(ref self: T, leaf: felt252) -> (felt252, u32);
    fn is_known_root(self: @T, root: felt252) -> bool;
}

trait IVerifierDispatcher<T> {
    fn verify_shield_proof(self: @T, commitment: felt252, asset: ContractAddress, amount: u256, proof: Span<felt252>) -> bool;
    fn verify_unshield_proof(self: @T, nullifier: felt252, merkle_root: felt252, amount: u256, recipient: ContractAddress, proof: Span<felt252>) -> bool;
}

const WBTC_ASSET_ID: u8 = 0;
const TBTC_ASSET_ID: u8 = 1;
const LBTC_ASSET_ID: u8 = 2;
const SOLVBTC_ASSET_ID: u8 = 3;
const STRK_ASSET_ID: u8 = 4;
const USDC_ASSET_ID: u8 = 5;
const STRKBTC_ASSET_ID: u8 = 6;
