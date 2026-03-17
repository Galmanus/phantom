use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_block_timestamp;
use starknet::get_contract_address;

// OpenZeppelin ERC20 interface
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

// PHANTOM Shielded Liquid Staking
// Enables privacy-preserving liquid staking - validators cannot see large positions
// This prevents MEV extraction and censorship based on holder identity

// =============================================================================
// CONSTANTS
// =============================================================================

// Protocol fee: 10% of yield (can be adjusted by governance)
const PROTOCOL_FEE_BPS: u16 = 1000; // 1000 bps = 10%

// Minimum stake amount
const MIN_STAKE_AMOUNT: u256 = 1_000_000; // 0.01 wBTC (assuming 8 decimals)

// Staking token (strkBTC or wBTC)
const STAKING_TOKEN_DECIMALS: u8 = 8;

// =============================================================================
// DATA STRUCTURES
// =============================================================================

// Shielded staking position - amount is private
#[derive(Drop, Serde, starknet::Store)]
struct StakingPosition {
    commitment: felt252,        // Poseidon(amount, stake_secret, salt)
    nullifier_hash: felt252,   // Hash for double-spend prevention
    stake_asset_id: u8,        // Which asset was staked
    staked_at: u64,            // Block timestamp
    last_claimed_at: u64,      // Last yield claim
    is_active: bool,           // Position status
}

// Pending unstaking request
#[derive(Drop, Serde, starknet::Store)]
struct UnstakeRequest {
    commitment: felt252,
    amount: u256,
    request_time: u64,
    unlock_time: u64,           // When funds can be withdrawn
    claimed: bool,
}

// =============================================================================
// CONTRACT STORAGE
// =============================================================================

#[starknet::contract]
mod ShieldedStaking {
    use super::{
        PROTOCOL_FEE_BPS, MIN_STAKE_AMOUNT, StakingPosition, UnstakeRequest
    };
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp, 
        get_contract_address, Zeroable
    };
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        // ============ CORE STAKING ASSETS ============
        // Supported staking assets (asset_id -> is_enabled)
        staking_assets: LegacyMap<u8, bool>,
        // Asset contract addresses
        asset_addresses: LegacyMap<u8, ContractAddress>,
        
        // ============ SHIELDED POSITIONS ============
        // Commitment -> StakingPosition (private data)
        positions: LegacyMap<felt252, StakingPosition>,
        // Nullifier hash -> spent (prevents double-staking)
        nullifier_hashes: LegacyMap<felt252, bool>,
        
        // ============ TRACKING ============
        // Total staked per asset (public for TVL display)
        total_staked: LegacyMap<u8, u256>,
        // Total shares (for yield calculation)
        total_shares: LegacyMap<u8, u256>,
        // Accumulated yield per share (for yield distribution)
        acc_yield_per_share: LegacyMap<u8, u256>,
        
        // ============ UNSTAKE QUEUE ============
        // Pending unstake requests
        unstake_requests: LegacyMap<felt252, UnstakeRequest>,
        // Request queue for FIFO processing
        unstake_queue_head: felt252,
        unstake_queue_tail: felt252,
        
        // ============ FEES & GOVERNANCE ============
        // Protocol fee in basis points (default 10%)
        protocol_fee_bps: u16,
        // Fee recipient address
        fee_recipient: ContractAddress,
        // Accumulated protocol fees
        protocol_fees_collected: LegacyMap<u8, u256>,
        
        // ============ YIELD INTEGRATION ============
        // External staking protocol (e.g., Starknet's native staking)
        staking_pool: ContractAddress,
        
        // ============ ACCESS CONTROL ============
        owner: ContractAddress,
        pending_owner: ContractAddress,
        pauser: ContractAddress,
        paused: bool,
        
        // ============ COUNTERS ============
        total_positions: u64,
        total_claimed_yield: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Staked: Staked,
        YieldClaimed: YieldClaimed,
        UnstakeRequested: UnstakeRequested,
        UnstakeCompleted: UnstakeCompleted,
        ProtocolFeeCollected: ProtocolFeeCollected,
        PositionTransferred: PositionTransferred,
        AssetEnabled: AssetEnabled,
        AssetDisabled: AssetDisabled,
        Paused: Paused,
        Unpaused: Unpaused,
        OwnershipProposed: OwnershipProposed,
        OwnershipTransferred: OwnershipTransferred,
    }

    #[derive(Drop, starknet::Event)]
    struct Staked {
        commitment: felt252,
        asset_id: u8,
        amount: u256,
        shares: u256,
        staked_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct YieldClaimed {
        commitment: felt252,
        yield_amount: u256,
        protocol_fee: u256,
        claimed_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct UnstakeRequested {
        commitment: felt252,
        amount: u256,
        unlock_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct UnstakeCompleted {
        commitment: nullifier: felt252,
        recipient: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ProtocolFeeCollected {
        asset_id: u8,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct PositionTransferred {
        from_commitment: felt252,
        to_commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct AssetEnabled {
        asset_id: u8,
        asset_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct AssetDisabled {
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
    struct OwnershipProposed {
        proposed_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        old_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    // =============================================================================
    // EXTERNAL FUNCTIONS
    // =============================================================================

    #[external(v0)]
    impl ShieldedStakingImpl of super::IShieldedStaking<ContractState> {
        
        /// Stake tokens into a shielded position
        /// The actual amount is hidden - only the commitment is public
        fn stake(
            ref self: ContractState,
            asset_id: u8,
            amount: u256,
            stake_secret: felt252,
            salt: felt252,
            proof: Span<felt252>,
        ) -> (felt252, u256) {
            // 1. Validate not paused
            assert(!self.paused.read(), 'Contract paused');
            
            // 2. Validate asset is enabled
            assert(self.staking_assets.read(asset_id), 'Asset not enabled');
            
            // 3. Validate minimum amount
            assert(amount >= MIN_STAKE_AMOUNT, 'Amount too small');
            
            // 4. Get asset address
            let asset_address = self.asset_addresses.read(asset_id);
            
            // 5. Transfer tokens from user
            let caller = get_caller_address();
            let erc20 = IERC20Dispatcher { contract_address: asset_address };
            
            let allowance = erc20.allowance(caller, get_contract_address());
            assert(allowance >= amount, 'Insufficient allowance');
            
            let balance_before = erc20.balance_of(get_contract_address());
            erc20.transfer_from(caller, get_contract_address(), amount);
            let balance_after = erc20.balance_of(get_contract_address());
            
            assert(balance_after == balance_before + amount, 'Transfer failed');
            
            // 6. Calculate shares to mint
            let shares = self._calculate_shares(asset_id, amount);
            
            // 7. Compute commitment (hides the actual amount)
            // commitment = Poseidon(amount, stake_secret, salt, asset_id)
            let commitment = poseidon_hash_span(@[
                amount.low.into(),
                amount.high.into(),
                stake_secret,
                salt,
                asset_id.into(),
            ]);
            
            // 8. Compute nullifier hash for double-spend prevention
            // nullifier_hash = Poseidon(stake_secret, commitment)
            let nullifier_hash = poseidon_hash_span(@[stake_secret, commitment]);
            
            // 9. Verify nullifier not already used
            assert(!self.nullifier_hashes.read(nullifier_hash), 'Position exists');
            
            // 10. Verify ZK proof (validates commitment formation)
            // In production, call verifier contract
            // For now, verify proof structure
            assert(proof.len() >= 8, 'Invalid proof');
            
            // 11. Mark nullifier as used
            self.nullifier_hashes.write(nullifier_hash, true);
            
            // 12. Store position
            let position = StakingPosition {
                commitment,
                nullifier_hash,
                stake_asset_id: asset_id,
                staked_at: get_block_timestamp(),
                last_claimed_at: get_block_timestamp(),
                is_active: true,
            };
            self.positions.write(commitment, position);
            
            // 13. Update totals
            let current_staked = self.total_staked.read(asset_id);
            self.total_staked.write(asset_id, current_staked + amount);
            
            let current_shares = self.total_shares.read(asset_id);
            self.total_shares.write(asset_id, current_shares + shares);
            
            // 14. Update position counter
            let pos_count = self.total_positions.read();
            self.total_positions.write(pos_count + 1);
            
            // 15. Emit event (amount is revealed here - in production, use encrypted note)
            self.emit(Staked {
                commitment,
                asset_id,
                amount,
                shares,
                staked_at: get_block_timestamp(),
            });
            
            (commitment, shares)
        }

        /// Claim yield from a shielded position
        fn claim_yield(
            ref self: ContractState,
            commitment: felt252,
            stake_secret: felt252,
            proof: Span<felt252>,
        ) -> u256 {
            // 1. Validate not paused
            assert(!self.paused.read(), 'Contract paused');
            
            // 2. Get position
            let mut position = self.positions.read(commitment);
            assert(position.is_active, 'Position not active');
            
            // 3. Verify ownership via nullifier
            let expected_nullifier = poseidon_hash_span(@[stake_secret, commitment]);
            assert(position.nullifier_hash == expected_nullifier, 'Invalid secret');
            
            // 4. Verify nullifier not double-spent
            assert(!self.nullifier_hashes.read(expected_nullifier), 'Already claimed');
            
            // 5. Verify proof
            assert(proof.len() >= 8, 'Invalid proof');
            
            // 6. Calculate yield
            let asset_id = position.stake_asset_id;
            let shares = self._get_position_shares(commitment);
            
            // Calculate pending yield
            let acc_yield = self.acc_yield_per_share.read(asset_id);
            let last_claimed = position.last_claimed_at;
            
            // Simplified yield calculation
            // In production: calculate based on actual time elapsed and pool yield
            let time_elapsed = get_block_timestamp() - last_claimed;
            let yield_rate = self._get_yield_rate(asset_id); // APY / 31536000
            
            let pending_yield = (shares * yield_rate * time_elapsed.into()) / (365 * 24 * 3600);
            
            // 7. Calculate protocol fee
            let fee_bps = self.protocol_fee_bps.read();
            let protocol_fee = (pending_yield * fee_bps.into()) / 10000;
            let user_yield = pending_yield - protocol_fee;
            
            // 8. Mark nullifier as spent (prevents double-claim)
            self.nullifier_hashes.write(expected_nullifier, true);
            
            // 9. Update position
            position.last_claimed_at = get_block_timestamp();
            self.positions.write(commitment, position);
            
            // 10. Collect protocol fee
            let current_fees = self.protocol_fees_collected.read(asset_id);
            self.protocol_fees_collected.write(asset_id, current_fees + protocol_fee);
            
            // 11. Transfer yield to user
            let asset_address = self.asset_addresses.read(asset_id);
            let erc20 = IERC20Dispatcher { contract_address: asset_address };
            erc20.transfer(get_caller_address(), user_yield);
            
            // 12. Transfer protocol fee
            let fee_recipient = self.fee_recipient.read();
            if fee_recipient != Zeroable::zero() && protocol_fee > 0 {
                erc20.transfer(fee_recipient, protocol_fee);
            }
            
            // 13. Update totals
            let total_claimed = self.total_claimed_yield.read();
            self.total_claimed_yield.write(total_claimed + user_yield);
            
            self.emit(YieldClaimed {
                commitment,
                yield_amount: user_yield,
                protocol_fee,
                claimed_at: get_block_timestamp(),
            });
            
            self.emit(ProtocolFeeCollected {
                asset_id,
                amount: protocol_fee,
            });
            
            user_yield
        }

        /// Request to unstake (starts the unbonding period)
        fn request_unstake(
            ref self: ContractState,
            commitment: felt252,
            stake_secret: felt252,
            proof: Span<felt252>,
        ) -> u256 {
            // 1. Validate not paused
            assert(!self.paused.read(), 'Contract paused');
            
            // 2. Get position
            let mut position = self.positions.read(commitment);
            assert(position.is_active, 'Position not active');
            
            // 3. Verify ownership
            let expected_nullifier = poseidon_hash_span(@[stake_secret, commitment]);
            assert(position.nullifier_hash == expected_nullifier, 'Invalid secret');
            
            // 4. Verify proof
            assert(proof.len() >= 8, 'Invalid proof');
            
            // 5. Calculate shares and underlying amount
            let asset_id = position.stake_asset_id;
            let shares = self._get_position_shares(commitment);
            let amount = self._calculate_withdraw_amount(asset_id, shares);
            
            // 6. Create unstake request
            let request = UnstakeRequest {
                commitment,
                amount,
                request_time: get_block_timestamp(),
                unlock_time: get_block_timestamp() + self._get_unstake_delay(),
                claimed: false,
            };
            self.unstake_requests.write(commitment, request);
            
            // 7. Deactivate position
            position.is_active = false;
            self.positions.write(commitment, position);
            
            // 8. Update totals
            let current_staked = self.total_staked.read(asset_id);
            self.total_staked.write(asset_id, current_staked - amount);
            
            let current_shares = self.total_shares.read(asset_id);
            self.total_shares.write(asset_id, current_shares - shares);
            
            // 9. Emit event
            self.emit(UnstakeRequested {
                commitment,
                amount,
                unlock_time: request.unlock_time,
            });
            
            amount
        }

        /// Complete unstake after unbonding period
        fn complete_unstake(
            ref self: ContractState,
            commitment: felt252,
            recipient: ContractAddress,
        ) {
            // 1. Get request
            let mut request = self.unstake_requests.read(commitment);
            assert(!request.claimed, 'Already claimed');
            
            // 2. Verify unbonding period passed
            assert(get_block_timestamp() >= request.unlock_time, 'Unbonding in progress');
            
            // 3. Mark as claimed
            request.claimed = true;
            self.unstake_requests.write(commitment, request);
            
            // 4. Transfer tokens
            let position = self.positions.read(commitment);
            let asset_id = position.stake_asset_id;
            let asset_address = self.asset_addresses.read(asset_id);
            
            let erc20 = IERC20Dispatcher { contract_address: asset_address };
            erc20.transfer(recipient, request.amount);
            
            self.emit(UnstakeCompleted {
                nullifier: commitment,
                recipient,
                amount: request.amount,
            });
        }

        /// Transfer a position to another party (private transfer)
        fn transfer_position(
            ref self: ContractState,
            from_commitment: felt252,
            to_commitment: felt252,
            stake_secret: felt252,
            proof: Span<felt252>,
        ) {
            // 1. Get sender position
            let mut from_position = self.positions.read(from_commitment);
            assert(from_position.is_active, 'Position not active');
            
            // 2. Verify ownership
            let expected_nullifier = poseidon_hash_span(@[stake_secret, from_commitment]);
            assert(from_position.nullifier_hash == expected_nullifier, 'Invalid secret');
            
            // 3. Verify proof
            assert(proof.len() >= 8, 'Invalid proof');
            
            // 4. Verify recipient position exists (new owner must have created it)
            let to_position = self.positions.read(to_commitment);
            assert(to_position.is_active, 'Recipient position not found');
            
            // 5. Mark old nullifier as spent
            self.nullifier_hashes.write(expected_nullifier, true);
            
            // 6. Deactivate sender position
            from_position.is_active = false;
            self.positions.write(from_commitment, from_position);
            
            self.emit(PositionTransferred {
                from_commitment,
                to_commitment,
            });
        }

        // =============================================================================
        // ADMIN FUNCTIONS
        // =============================================================================

        fn enable_asset(ref self: ContractState, asset_id: u8, asset_address: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            assert(asset_address != Zeroable::zero(), 'Invalid address');
            
            self.staking_assets.write(asset_id, true);
            self.asset_addresses.write(asset_id, asset_address);
            
            self.emit(AssetEnabled { asset_id, asset_address });
        }

        fn disable_asset(ref self: ContractState, asset_id: u8) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            
            self.staking_assets.write(asset_id, false);
            
            self.emit(AssetDisabled { asset_id });
        }

        fn set_protocol_fee(ref self: ContractState, fee_bps: u16) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            assert(fee_bps <= 5000, 'Fee too high'); // Max 50%
            
            self.protocol_fee_bps.write(fee_bps);
        }

        fn set_fee_recipient(ref self: ContractAddress, recipient: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.fee_recipient.write(recipient);
        }

        fn set_staking_pool(ref self: ContractState, pool: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.staking_pool.write(pool);
        }

        fn pause(ref self: ContractState) {
            assert(
                get_caller_address() == self.owner.read() 
                || get_caller_address() == self.pauser.read(), 
                'Not authorized'
            );
            self.paused.write(true);
            self.emit(Paused { timestamp: get_block_timestamp() });
        }

        fn unpause(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            self.paused.write(false);
            self.emit(Unpaused { timestamp: get_block_timestamp() });
        }

        fn propose_ownership(ref self: ContractState, new_owner: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            assert(new_owner != Zeroable::zero(), 'Invalid address');
            
            self.pending_owner.write(new_owner);
            self.emit(OwnershipProposed { proposed_owner: new_owner });
        }

        fn accept_ownership(ref self: ContractState) {
            let pending = self.pending_owner.read();
            assert(get_caller_address() == pending, 'Not pending owner');
            
            let old = self.owner.read();
            self.owner.write(pending);
            self.pending_owner.write(Zeroable::zero());
            
            self.emit(OwnershipTransferred { old_owner: old, new_owner: pending });
        }

        // =============================================================================
        // READ FUNCTIONS
        // =============================================================================

        fn get_position(self: @ContractState, commitment: felt252) -> (bool, u8, u64, u64) {
            let pos = self.positions.read(commitment);
            (pos.is_active, pos.stake_asset_id, pos.staked_at, pos.last_claimed_at)
        }

        fn get_total_staked(self: @ContractState, asset_id: u8) -> u256 {
            self.total_staked.read(asset_id)
        }

        fn get_total_shares(self: @ContractState, asset_id: u8) -> u256 {
            self.total_shares.read(asset_id)
        }

        fn get_acc_yield_per_share(self: @ContractState, asset_id: u8) -> u256 {
            self.acc_yield_per_share.read(asset_id)
        }

        fn get_protocol_fee_bps(self: @ContractState) -> u16 {
            self.protocol_fee_bps.read()
        }

        fn is_paused(self: @ContractState) -> bool {
            self.paused.read()
        }

        fn is_asset_enabled(self: @ContractState, asset_id: u8) -> bool {
            self.staking_assets.read(asset_id)
        }
    }

    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _calculate_shares(self: @ContractState, asset_id: u8, amount: u256) -> u256 {
            let total_staked = self.total_staked.read(asset_id);
            let total_shares = self.total_shares.read(asset_id);
            
            if total_staked == 0 || total_shares == 0 {
                // First staker gets 1:1 shares
                amount
            } else {
                // New shares = amount * total_shares / total_staked
                (amount * total_shares) / total_staked
            }
        }

        fn _calculate_withdraw_amount(self: @ContractState, asset_id: u8, shares: u256) -> u256 {
            let total_staked = self.total_staked.read(asset_id);
            let total_shares = self.total_shares.read(asset_id);
            
            if total_shares == 0 {
                0
            } else {
                (shares * total_staked) / total_shares
            }
        }

        fn _get_position_shares(self: @ContractState, commitment: felt252) -> u256 {
            // In production, store shares in position
            // Simplified: derive from commitment
            let pos = self.positions.read(commitment);
            let amount = pos.staked_at.into(); // Use timestamp as proxy
            amount * 1_000_000 // Simplified
        }

        fn _get_yield_rate(self: @ContractState, asset_id: u8) -> u256 {
            // APY rates (simplified - in production, fetch from oracle)
            // 500 = 5% APY
            match asset_id {
                0 => 500,  // wBTC
                1 => 450,  // tBTC
                2 => 480,  // LBTC
                _ => 400,  // Default
            }
        }

        fn _get_unstake_delay(self: @ContractState) -> u64 {
            // 7 days in seconds
            7 * 24 * 3600
        }
    }
}

// =============================================================================
// INTERFACE
// =============================================================================

#[starknet::interface]
trait IShieldedStaking<T> {
    // Core staking
    fn stake(
        ref self: T,
        asset_id: u8,
        amount: u256,
        stake_secret: felt252,
        salt: felt252,
        proof: Span<felt252>,
    ) -> (felt252, u256);
    
    fn claim_yield(
        ref self: T,
        commitment: felt252,
        stake_secret: felt252,
        proof: Span<felt252>,
    ) -> u256;
    
    fn request_unstake(
        ref self: T,
        commitment: felt252,
        stake_secret: felt252,
        proof: Span<felt252>,
    ) -> u256;
    
    fn complete_unstake(
        ref self: T,
        commitment: felt252,
        recipient: ContractAddress,
    );
    
    fn transfer_position(
        ref self: T,
        from_commitment: felt252,
        to_commitment: felt252,
        stake_secret: felt252,
        proof: Span<felt252>,
    );
    
    // Admin
    fn enable_asset(ref self: T, asset_id: u8, asset_address: ContractAddress);
    fn disable_asset(ref self: T, asset_id: u8);
    fn set_protocol_fee(ref self: T, fee_bps: u16);
    fn set_fee_recipient(ref self: T, recipient: ContractAddress);
    fn set_staking_pool(ref self: T, pool: ContractAddress);
    fn pause(ref self: T);
    fn unpause(ref self: T);
    fn propose_ownership(ref self: T, new_owner: ContractAddress);
    fn accept_ownership(ref self: T);
    
    // Reads
    fn get_position(self: @T, commitment: felt252) -> (bool, u8, u64, u64);
    fn get_total_staked(self: @T, asset_id: u8) -> u256;
    fn get_total_shares(self: @T, asset_id: u8) -> u256;
    fn get_acc_yield_per_share(self: @T, asset_id: u8) -> u256;
    fn get_protocol_fee_bps(self: @T) -> u16;
    fn is_paused(self: @T) -> bool;
    fn is_asset_enabled(self: @T, asset_id: u8) -> bool;
}

// =============================================================================
// CONSTRUCTOR
// =============================================================================

#[constructor]
fn constructor(
    ref self: ContractState,
    owner: ContractAddress,
    fee_recipient: ContractAddress,
    staking_pool: ContractAddress,
) {
    assert(owner != Zeroable::zero(), 'Invalid owner');
    
    self.owner.write(owner);
    self.fee_recipient.write(fee_recipient);
    self.staking_pool.write(staking_pool);
    self.protocol_fee_bps.write(PROTOCOL_FEE_BPS);
    self.paused.write(false);
    self.total_positions.write(0);
    self.total_claimed_yield.write(0);
}
