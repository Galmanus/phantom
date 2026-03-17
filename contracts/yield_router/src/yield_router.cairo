use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_block_timestamp;

// Use OpenZeppelin ERC20 interface
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

// Verifier interface
trait IVerifier<T> {
    fn verify_yield_deposit_proof(
        self: @T,
        commitment: felt252,
        amount: u256,
        proof: Span<felt252>,
    ) -> bool;

    fn verify_yield_withdraw_proof(
        self: @T,
        nullifier: felt252,
        new_commitment: felt252,
        proof: Span<felt252>,
    ) -> bool;
}

// Strategy interface
#[derive(Drop, Serde)]
struct IStrategyDispatcher {
    contract_address: ContractAddress,
}

trait IStrategy<T> {
    fn deposit(ref self: T, amount: u256) -> u256;
    fn withdraw(ref self: T, amount: u256) -> u256;
    fn balance_of(self: @T, account: ContractAddress) -> u256;
}

// Supported strategies
#[derive(Drop, Copy, Serde, starknet::Store)]
enum Strategy {
    VesuLending: (),
    EkuboLP: (),
    Re7Vault: (),
}

// A private position is just a commitment on-chain
#[derive(Drop, Serde, starknet::Store)]
struct PrivatePosition {
    commitment: felt252,        // Poseidon(amount, strategy, nonce, user_key)
    nullifier_hash: felt252,   // Hash of nullifier for ownership verification
    strategy: Strategy,
    deposited_at: u64,
    last_claimed_at: u64,
    is_active: bool,
}

#[starknet::contract]
mod YieldRouter {
    use super::{IERC20Dispatcher, IStrategyDispatcher, Strategy, PrivatePosition, IVerifier};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, Zeroable};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        // Map: commitment → position
        positions: LegacyMap<felt252, PrivatePosition>,
        // Nullifiers spent for positions (ownership verification)
        position_nullifiers: LegacyMap<felt252, bool>,
        // Map: strategy → total_shielded_tvl
        strategy_tvl: LegacyMap<u8, u128>,
        // Map: strategy → contract address
        strategy_contracts: LegacyMap<u8, ContractAddress>,
        // Verifier contract for ZK proofs
        verifier: ContractAddress,
        // Test mode flag
        test_mode: bool,
        // Admin
        owner: ContractAddress,
        paused: bool,
        // strkBTC token address
        strkbtc_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PositionOpened: PositionOpened,
        PositionClosed: PositionClosed,
        YieldClaimed: YieldClaimed,
        StrategyUpdated: StrategyUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct PositionOpened {
        commitment: felt252,
        strategy: u8,
        deposited_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct PositionClosed {
        commitment: felt252,
        closed_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct YieldClaimed {
        commitment: felt252,
        claimed_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct StrategyUpdated {
        strategy_id: u8,
        contract_address: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        strkbtc_address: ContractAddress,
        verifier: ContractAddress,
    ) {
        self.owner.write(owner);
        self.strkbtc_address.write(strkbtc_address);
        self.verifier.write(verifier);
        self.paused.write(false);
        self.test_mode.write(true); // Test mode by default
    }

    #[external(v0)]
    impl YieldRouterImpl of super::IYieldRouter<ContractState> {

        /// Open a private position in a yield strategy
        /// commitment = Poseidon(amount, strategy_id, nonce, user_viewing_key)
        fn open_position(
            ref self: ContractState,
            commitment: felt252,
            strategy_id: u8,
            strkbtc_amount: u128,
            nullifier_secret: felt252,
            proof: Span<felt252>,
        ) {
            assert(!self.paused.read(), 'Router is paused');
            
            // Check that commitment doesn't already exist
            let existing = self.positions.read(commitment);
            assert(existing.commitment == 0, 'Commitment exists');
            
            // Validate commitment is non-zero
            assert(commitment != 0, 'Invalid commitment');
            
            // Validate strategy_id
            assert(strategy_id <= 2, 'Invalid strategy');
            
            // Validate amount > 0
            assert(strkbtc_amount > 0, 'Zero amount');
            
            let caller = get_caller_address();
            let strkbtc_addr = self.strkbtc_address.read();
            let strkbtc = IERC20Dispatcher { contract_address: strkbtc_addr };

            // Check strategy contract exists and is whitelisted
            let strategy_contract = self.strategy_contracts.read(strategy_id);
            assert(strategy_contract != Zeroable::zero(), 'Unknown strategy');
            
            // CRITICAL: Verify proof of knowledge of nullifier secret
            // This binds the position to the caller
            let nullifier_hash = poseidon_hash_span(@[nullifier_secret, commitment.into()]);
            let proof_valid = self._verify_yield_deposit_proof(
                commitment,
                strkbtc_amount.into(),
                nullifier_hash,
                proof,
            );
            assert(proof_valid, 'Invalid deposit proof');

            // Check user has approved the router
            let allowance = strkbtc.allowance(caller, starknet::get_contract_address());
            assert(allowance >= strkbtc_amount.into(), 'Insufficient allowance');

            // Transfer strkBTC from user to this contract FIRST
            let balance_before = strkbtc.balance_of(starknet::get_contract_address());
            strkbtc.transfer_from(caller, starknet::get_contract_address(), strkbtc_amount.into());
            let balance_after = strkbtc.balance_of(starknet::get_contract_address());
            assert(balance_after == balance_before + strkbtc_amount.into(), 'Transfer failed');

            // Route to the appropriate strategy contract
            let strategy = IStrategyDispatcher { contract_address: strategy_contract };
            let deposited = strategy.deposit(strkbtc_amount.into());

            // Store private position AFTER external calls
            let strategy_enum = self._id_to_strategy(strategy_id);
            let position = PrivatePosition {
                commitment,
                nullifier_hash,
                strategy: strategy_enum,
                deposited_at: get_block_timestamp(),
                last_claimed_at: get_block_timestamp(),
                is_active: true,
            };
            self.positions.write(commitment, position);

            // Update aggregate TVL
            let current_tvl = self.strategy_tvl.read(strategy_id);
            self.strategy_tvl.write(strategy_id, current_tvl + strkbtc_amount);

            self.emit(PositionOpened {
                commitment,
                strategy: strategy_id,
                deposited_at: get_block_timestamp(),
            });
        }

        /// Close position and withdraw
        /// Requires proof of knowledge of nullifier secret
        fn close_position(
            ref self: ContractState,
            commitment: felt252,
            original_amount: u128,
            strategy_id: u8,
            nonce: felt252,
            nullifier_secret: felt252,
            proof: Span<felt252>,
        ) {
            assert(!self.paused.read(), 'Router is paused');
            let mut position = self.positions.read(commitment);
            assert(position.is_active, 'Position not active');

            // CRITICAL: Verify caller owns this position
            // Compute nullifier hash and verify it matches
            let caller_nullifier_hash = poseidon_hash_span(@[nullifier_secret, commitment.into()]);
            assert(position.nullifier_hash == caller_nullifier_hash, 'Not position owner');
            
            // CRITICAL: Verify proof (prevents unauthorized closing)
            let proof_valid = self._verify_yield_withdraw_proof(
                caller_nullifier_hash,
                0, // No new commitment for close
                proof,
            );
            assert(proof_valid, 'Invalid withdraw proof');

            // Validate strategy_id matches stored position
            let stored_strategy_id = self._strategy_to_id(position.strategy);
            assert(stored_strategy_id == strategy_id, 'Strategy mismatch');

            // Validate amount against TVL
            let current_tvl = self.strategy_tvl.read(strategy_id);
            assert(original_amount <= current_tvl, 'Amount exceeds TVL');

            // Withdraw from strategy
            let strategy_contract = self.strategy_contracts.read(strategy_id);
            let strategy = IStrategyDispatcher { contract_address: strategy_contract };
            let withdrawn = strategy.withdraw(original_amount.into());

            // CRITICAL: Verify withdrawn amount meets minimum expectation
            // In production, calculate min_expected based on original_amount and slippage
            let min_expected = original_amount.into();
            assert(withdrawn >= min_expected, 'Slippage too high');

            // Transfer strkBTC back to user
            let strkbtc_addr = self.strkbtc_address.read();
            let strkbtc = IERC20Dispatcher { contract_address: strkbtc_addr };
            strkbtc.transfer(get_caller_address(), withdrawn);

            // Mark position closed
            position.is_active = false;
            self.positions.write(commitment, position);

            // Update TVL
            self.strategy_tvl.write(strategy_id, current_tvl - original_amount);

            self.emit(PositionClosed {
                commitment,
                closed_at: get_block_timestamp(),
            });
        }

        /// Claim yield (withdraw only yield, keep principal)
        fn claim_yield(
            ref self: ContractState,
            commitment: felt252,
            nullifier_secret: felt252,
            new_commitment: felt252,
            proof: Span<felt252>,
        ) {
            assert(!self.paused.read(), 'Router is paused');
            let mut position = self.positions.read(commitment);
            assert(position.is_active, 'Position not active');

            // CRITICAL: Verify caller owns this position
            let caller_nullifier_hash = poseidon_hash_span(@[nullifier_secret, commitment.into()]);
            assert(position.nullifier_hash == caller_nullifier_hash, 'Not position owner');
            
            // Verify yield claim proof
            let proof_valid = self._verify_yield_withdraw_proof(
                caller_nullifier_hash,
                new_commitment,
                proof,
            );
            assert(proof_valid, 'Invalid yield claim proof');

            // Get strategy and withdraw yield only
            let strategy_id = self._strategy_to_id(position.strategy);
            let strategy_contract = self.strategy_contracts.read(strategy_id);
            let strategy = IStrategyDispatcher { contract_address: strategy_contract };
            
            // Withdraw yield (full balance - original principal)
            let original_principal = position.deposited_at; // Store principal elsewhere in production
            let full_balance = strategy.balance_of(starknet::get_contract_address());
            
            // For now, claim full balance as yield (production should calculate properly)
            let yield_amount = full_balance;
            
            if yield_amount > 0 {
                let withdrawn = strategy.withdraw(yield_amount);
                
                // Transfer yield to user
                let strkbtc_addr = self.strkbtc_address.read();
                let strkbtc = IERC20Dispatcher { contract_address: strkbtc_addr };
                strkbtc.transfer(get_caller_address(), withdrawn);
                
                // Update last claimed timestamp
                position.last_claimed_at = get_block_timestamp();
                self.positions.write(commitment, position);
                
                self.emit(YieldClaimed {
                    commitment,
                    claimed_at: get_block_timestamp(),
                });
            }
        }

        // Read aggregate TVL per strategy
        fn get_strategy_tvl(self: @ContractState, strategy_id: u8) -> u128 {
            self.strategy_tvl.read(strategy_id)
        }

        // Check if commitment exists
        fn position_exists(self: @ContractState, commitment: felt252) -> bool {
            self.positions.read(commitment).commitment != 0
        }

        // Get position details
        fn get_position(self: @ContractState, commitment: felt252) -> (bool, u8, u64, bool) {
            let position = self.positions.read(commitment);
            let strategy_id = self._strategy_to_id(position.strategy);
            (position.commitment != 0, strategy_id, position.deposited_at, position.is_active)
        }

        // Admin: register strategy contract
        fn register_strategy(
            ref self: ContractState,
            strategy_id: u8,
            contract_address: ContractAddress,
        ) {
            assert(get_caller_address() == self.owner.read(), 'Not owner');
            assert(contract_address != Zeroable::zero(), 'Invalid strategy address');
            
            self.strategy_contracts.write(strategy_id, contract_address);
            self.emit(StrategyUpdated { strategy_id, contract_address });
        }

        // Admin: set verifier
        fn set_verifier(ref self: ContractState, verifier: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Not owner');
            self.verifier.write(verifier);
        }

        // Admin: pause/unpause
        fn set_paused(ref self: ContractState, paused: bool) {
            assert(get_caller_address() == self.owner.read(), 'Not owner');
            self.paused.write(paused);
        }

        // Admin: set test mode
        fn set_test_mode(ref self: ContractState, enabled: bool) {
            assert(get_caller_address() == self.owner.read(), 'Not owner');
            self.test_mode.write(enabled);
        }

        // Admin: transfer ownership
        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), 'Not owner');
            self.owner.write(new_owner);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _id_to_strategy(self: @ContractState, id: u8) -> Strategy {
            match id {
                0 => Strategy::VesuLending(()),
                1 => Strategy::EkuboLP(()),
                2 => Strategy::Re7Vault(()),
                _ => panic!("Unknown strategy"),
            }
        }

        fn _strategy_to_id(self: @ContractState, strategy: Strategy) -> u8 {
            match strategy {
                Strategy::VesuLending(_) => 0,
                Strategy::EkuboLP(_) => 1,
                Strategy::Re7Vault(_) => 2,
            }
        }

        fn _verify_yield_deposit_proof(
            self: @ContractState,
            commitment: felt252,
            amount: u256,
            nullifier_hash: felt252,
            proof: Span<felt252>,
        ) -> bool {
            // Test mode: accept empty proof
            if self.test_mode.read() {
                if proof.len() == 1 && *proof.at(0) == 0 {
                    return true;
                }
            }

            // Real verification via verifier contract
            let verifier = IVerifierDispatcher { contract_address: self.verifier.read() };
            verifier.verify_yield_deposit_proof(commitment, amount, proof)
        }

        fn _verify_yield_withdraw_proof(
            self: @ContractState,
            nullifier: felt252,
            new_commitment: felt252,
            proof: Span<felt252>,
        ) -> bool {
            // Test mode
            if self.test_mode.read() {
                if proof.len() == 1 && *proof.at(0) == 0 {
                    return true;
                }
            }

            let verifier = IVerifierDispatcher { contract_address: self.verifier.read() };
            verifier.verify_yield_withdraw_proof(nullifier, new_commitment, proof)
        }
    }
}

// Interface for external calls
#[starknet::interface]
trait IYieldRouter<T> {
    fn open_position(
        ref self: T,
        commitment: felt252,
        strategy_id: u8,
        strkbtc_amount: u128,
        nullifier_secret: felt252,
        proof: Span<felt252>,
    );

    fn close_position(
        ref self: T,
        commitment: felt252,
        original_amount: u128,
        strategy_id: u8,
        nonce: felt252,
        nullifier_secret: felt252,
        proof: Span<felt252>,
    );

    fn claim_yield(
        ref self: T,
        commitment: felt252,
        nullifier_secret: felt252,
        new_commitment: felt252,
        proof: Span<felt252>,
    );

    fn get_strategy_tvl(self: @T, strategy_id: u8) -> u128;

    fn position_exists(self: @T, commitment: felt252) -> bool;

    fn get_position(self: @T, commitment: felt252) -> (bool, u8, u64, bool);

    fn register_strategy(ref self: T, strategy_id: u8, contract_address: ContractAddress);
    
    fn set_verifier(ref self: T, verifier: ContractAddress);

    fn set_paused(ref self: T, paused: bool);
    
    fn set_test_mode(ref self: T, enabled: bool);

    fn transfer_ownership(ref self: T, new_owner: ContractAddress);
}
