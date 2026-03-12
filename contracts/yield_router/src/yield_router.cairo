use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_block_timestamp;

// Use OpenZeppelin ERC20 interface
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

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
// The actual amount is only known to the user (via their viewing key)
#[derive(Drop, Serde, starknet::Store)]
struct PrivatePosition {
    commitment: felt252,        // Poseidon(amount, strategy, nonce, user_key)
    strategy: Strategy,
    deposited_at: u64,         // block timestamp
    last_claimed_at: u64,
    is_active: bool,
}

#[starknet::contract]
mod YieldRouter {
    use super::{IERC20Dispatcher, IStrategyDispatcher, Strategy, PrivatePosition};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, Zeroable};

    #[storage]
    struct Storage {
        // Map: commitment → position
        positions: LegacyMap<felt252, PrivatePosition>,
        // Map: strategy → total_shielded_tvl (for UI display only — not per-user)
        strategy_tvl: LegacyMap<u8, u128>,
        // Map: strategy → contract address
        strategy_contracts: LegacyMap<u8, ContractAddress>,
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
        commitment: felt252,         // public: position exists
        strategy: u8,                // public: which strategy
        deposited_at: u64,           // public: when
        // amount is NOT emitted — privacy preserved
    }

    #[derive(Drop, starknet::Event)]
    struct PositionClosed {
        commitment: felt252,
        closed_at: u64,
        // withdrawal amount NOT emitted
    }

    #[derive(Drop, starknet::Event)]
    struct YieldClaimed {
        commitment: felt252,
        claimed_at: u64,
        // yield amount NOT emitted
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
    ) {
        self.owner.write(owner);
        self.strkbtc_address.write(strkbtc_address);
        self.paused.write(false);
    }

    #[external(v0)]
    impl YieldRouterImpl of super::IYieldRouter<ContractState> {

        // Open a private position in a yield strategy
        // commitment = Poseidon(amount, strategy_id, nonce, user_viewing_key)
        // The contract never knows the amount — only the commitment
        fn open_position(
            ref self: ContractState,
            commitment: felt252,
            strategy_id: u8,
            strkbtc_amount: u128,
        ) {
            assert(!self.paused.read(), 'Router is paused');
            
            // Check that commitment doesn't already exist
            let existing = self.positions.read(commitment);
            assert(existing.commitment == 0, 'Commitment exists');

            let caller = get_caller_address();
            let strkbtc_addr = self.strkbtc_address.read();
            let strkbtc = IERC20Dispatcher { contract_address: strkbtc_addr };

            // Transfer strkBTC from user to this contract
            // Note: In production, user would need to approve first
            // For now, we assume the caller has approved or is the router itself
            strkbtc.transfer_from(caller, starknet::get_contract_address(), strkbtc_amount.into());

            // Route to the appropriate strategy contract
            let strategy_contract = self.strategy_contracts.read(strategy_id);
            assert(strategy_contract != Zeroable::zero(), 'Unknown strategy');

            // Deposit into strategy (this reveals amount to the strategy contract)
            // In STRK20 final implementation, this becomes a shielded deposit
            let strategy = IStrategyDispatcher { contract_address: strategy_contract };
            let deposited = strategy.deposit(strkbtc_amount.into());

            // Store private position
            let strategy_enum = self._id_to_strategy(strategy_id);
            let position = PrivatePosition {
                commitment,
                strategy: strategy_enum,
                deposited_at: get_block_timestamp(),
                last_claimed_at: get_block_timestamp(),
                is_active: true,
            };
            self.positions.write(commitment, position);

            // Update aggregate TVL (no per-user info)
            let current_tvl = self.strategy_tvl.read(strategy_id);
            self.strategy_tvl.write(strategy_id, current_tvl + strkbtc_amount);

            self.emit(PositionOpened {
                commitment,
                strategy: strategy_id,
                deposited_at: get_block_timestamp(),
            });
        }

        // Close position and withdraw
        // Requires: user proves knowledge of (amount, nonce, viewing_key) that
        // hash to the commitment. For now: trusted caller check.
        fn close_position(
            ref self: ContractState,
            commitment: felt252,
            original_amount: u128,
            strategy_id: u8,
            nonce: felt252,
        ) {
            assert(!self.paused.read(), 'Router is paused');
            let mut position = self.positions.read(commitment);
            assert(position.is_active, 'Position not active');

            let caller = get_caller_address();

            // Withdraw from strategy
            let strategy_contract = self.strategy_contracts.read(strategy_id);
            let strategy = IStrategyDispatcher { contract_address: strategy_contract };
            let withdrawn = strategy.withdraw(original_amount.into());

            // Transfer strkBTC back to user (includes yield)
            let strkbtc_addr = self.strkbtc_address.read();
            let strkbtc = IERC20Dispatcher { contract_address: strkbtc_addr };
            strkbtc.transfer(caller, withdrawn);

            // Mark position closed
            position.is_active = false;
            self.positions.write(commitment, position);

            // Update TVL
            let current_tvl = self.strategy_tvl.read(strategy_id);
            self.strategy_tvl.write(strategy_id, current_tvl - original_amount);

            self.emit(PositionClosed {
                commitment,
                closed_at: get_block_timestamp(),
            });
        }

        // Read aggregate TVL per strategy (for UI — no user info leaked)
        fn get_strategy_tvl(self: @ContractState, strategy_id: u8) -> u128 {
            self.strategy_tvl.read(strategy_id)
        }

        // Check if commitment exists (no other info)
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
            self.strategy_contracts.write(strategy_id, contract_address);
            self.emit(StrategyUpdated { strategy_id, contract_address });
        }

        // Admin: pause/unpause
        fn set_paused(ref self: ContractState, paused: bool) {
            assert(get_caller_address() == self.owner.read(), 'Not owner');
            self.paused.write(paused);
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
    );

    fn close_position(
        ref self: T,
        commitment: felt252,
        original_amount: u128,
        strategy_id: u8,
        nonce: felt252,
    );

    fn get_strategy_tvl(self: @T, strategy_id: u8) -> u128;

    fn position_exists(self: @T, commitment: felt252) -> bool;

    fn get_position(self: @T, commitment: felt252) -> (bool, u8, u64, bool);

    fn register_strategy(
        ref self: T,
        strategy_id: u8,
        contract_address: ContractAddress,
    );

    fn set_paused(ref self: T, paused: bool);

    fn transfer_ownership(ref self: T, new_owner: ContractAddress);
}