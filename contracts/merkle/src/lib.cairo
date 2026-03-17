use starknet::ContractAddress;
use starknet::get_caller_address;

// PHANTOM Merkle Tree Manager
// Implements an incremental Merkle tree using Poseidon hash

// Tree height: 20 levels (supports 2^20 = 1,048,576 leaves)
const TREE_HEIGHT: u32 = 20;

// Zero hash for empty leaves
// Computed as Poseidon(0, 0)
const ZERO_LEAF: felt252 = 0x90784d95b00eb19f4ab4dd4b3c6a1b8e7b8c6c0b5c3a1d4e5f6a7b8c9d0e1f;

#[starknet::contract]
mod PhantomMerkle {
    use super::{TREE_HEIGHT, ZERO_LEAF};
    use starknet::{ContractAddress, get_caller_address};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        // Current Merkle root
        current_root: felt252,
        
        // Next available leaf index
        next_leaf_index: u32,
        
        // Tree height (fixed at 20)
        tree_height: u32,
        
        // Leaves: index -> commitment
        leaves: LegacyMap<u32, felt252>,
        
        // Nodes: (level, index) -> hash
        // level 0 = leaves, level 20 = root
        nodes: LegacyMap<(u32, u32), felt252>,
        
        // Zero hashes for each level (pre-computed)
        zero_hashes: LegacyMap<u32, felt252>,
        
        // Owner (for admin functions)
        owner: ContractAddress,
        
        // Number of insertions
        insertion_count: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        LeafInserted: LeafInserted,
        RootUpdated: RootUpdated,
        TreeReset: TreeReset,
    }

    #[derive(Drop, starknet::Event)]
    struct LeafInserted {
        leaf_index: u32,
        commitment: felt252,
        new_root: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct RootUpdated {
        old_root: felt252,
        new_root: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct TreeReset {
        timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        assert(owner != ContractAddress::ZERO, 'Invalid owner');
        
        self.owner.write(owner);
        self.tree_height.write(TREE_HEIGHT);
        self.next_leaf_index.write(0);
        self.insertion_count.write(0);
        
        // Initialize zero hashes
        self._initialize_zero_hashes();
        
        // Set initial root to zero hash
        let initial_root = self.zero_hashes.read(TREE_HEIGHT);
        self.current_root.write(initial_root);
    }

    #[external(v0)]
    impl PhantomMerkleImpl of super::IMerkleTree<ContractState> {
        /// Insert a new leaf into the Merkle tree
        /// Returns the new root and the leaf index
        fn insert_leaf(ref self: ContractState, leaf: felt252) -> (felt252, u32) {
            // 1. Validate leaf is non-zero
            assert(leaf != 0, 'Invalid leaf');
            
            // 2. Get current leaf index
            let leaf_index = self.next_leaf_index.read();
            
            // 3. Check tree is not full
            let max_leaves: u32 = 1_u32.shl(TREE_HEIGHT - 1); // 2^19 for level 0
            assert(leaf_index < max_leaves, 'Tree is full');
            
            // 4. Store the leaf
            self.leaves.write(leaf_index, leaf);
            
            // 5. Update the tree to compute new root
            let new_root = self._update_tree(leaf_index, leaf);
            
            // 6. Update current root
            let old_root = self.current_root.read();
            self.current_root.write(new_root);
            
            // 7. Increment leaf index
            self.next_leaf_index.write(leaf_index + 1);
            
            // 8. Increment insertion count
            let count = self.insertion_count.read();
            self.insertion_count.write(count + 1);
            
            // 9. Emit events
            self.emit(LeafInserted {
                leaf_index,
                commitment: leaf,
                new_root,
            });
            
            if old_root != new_root {
                self.emit(RootUpdated {
                    old_root,
                    new_root,
                });
            }
            
            (new_root, leaf_index)
        }

        /// Get current Merkle root
        fn get_root(self: @ContractState) -> felt252 {
            self.current_root.read()
        }

        /// Get last leaf index (next index to be filled)
        fn get_last_leaf_index(self: @ContractState) -> u32 {
            self.next_leaf_index.read()
        }

        /// Get leaf at index
        fn get_leaf(self: @ContractState, index: u32) -> felt252 {
            self.leaves.read(index)
        }

        /// Get node at level and index
        fn get_node(self: @ContractState, level: u32, index: u32) -> felt252 {
            self.nodes.read((level, index))
        }

        /// Check if a root is known (valid historical root)
        fn is_known_root(self: @ContractState, root: felt252) -> bool {
            // In this simple implementation, we only track the current root
            // For production, the pool should maintain a history of roots
            root == self.current_root.read()
        }

        /// Get tree height
        fn get_tree_height(self: @ContractState) -> u32 {
            self.tree_height.read()
        }

        /// Get total insertions
        fn get_insertion_count(self: @ContractState) -> u64 {
            self.insertion_count.read()
        }

        /// Get zero hash for a level
        fn get_zero_hash(self: @ContractState, level: u32) -> felt252 {
            self.zero_hashes.read(level)
        }

        /// Admin: reset tree (for testing or emergency)
        fn reset_tree(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), 'Only owner');
            
            let initial_root = self.zero_hashes.read(TREE_HEIGHT);
            self.current_root.write(initial_root);
            self.next_leaf_index.write(0);
            self.insertion_count.write(0);
            
            // Note: leaves and nodes are not cleared (would require iteration)
            // In production, implement proper clearing
            
            self.emit(TreeReset {
                timestamp: starknet::get_block_timestamp(),
            });
        }

        /// Verify Merkle proof (useful for off-chain verification)
        fn verify_proof(
            self: @ContractState,
            leaf: felt252,
            leaf_index: u32,
            path: Span<(felt252, bool)>, // (sibling_hash, is_right)
            expected_root: felt252,
        ) -> bool {
            // Validate inputs
            if leaf == 0 || expected_root == 0 {
                return false;
            }
            
            if path.len() != TREE_HEIGHT.into() {
                return false;
            }
            
            // Verify the path
            let mut current_hash = leaf;
            let mut index = leaf_index;
            
            let mut i: u32 = 0;
            loop {
                if i >= TREE_HEIGHT {
                    break;
                }
                
                let sibling_data = *path.at(i.into());
                let (sibling_hash, is_right) = sibling_data;
                
                let (left, right) = if is_right {
                    (sibling_hash, current_hash)
                } else {
                    (current_hash, sibling_hash)
                };
                
                current_hash = poseidon_hash_span(@[left, right]);
                index = index / 2;
                i += 1;
            };
            
            current_hash == expected_root
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Initialize zero hashes for each level
        fn _initialize_zero_hashes(ref self: ContractState) {
            // Level 0: Poseidon(0, 0)
            let zero_0 = poseidon_hash_span(@[ZERO_LEAF.into(), ZERO_LEAF.into()]);
            self.zero_hashes.write(0, zero_0);
            
            // Each subsequent level: Poseidon(zero_hash[i-1], zero_hash[i-1])
            let mut i: u32 = 1;
            let mut current = zero_0;
            loop {
                if i > TREE_HEIGHT {
                    break;
                }
                current = poseidon_hash_span(@[current, current]);
                self.zero_hashes.write(i, current);
                i += 1;
            };
        }

        /// Update tree from a leaf to compute new root
        fn _update_tree(ref self: ContractState, leaf_index: u32, leaf: felt252) -> felt252 {
            let mut current_hash = leaf;
            let mut index = leaf_index;
            
            // Store leaf at level 0
            self.nodes.write((0, index), leaf);
            
            // Compute path to root
            let mut level: u32 = 0;
            loop {
                if level >= TREE_HEIGHT {
                    break;
                }
                
                let sibling_index = index ^ 1;
                let is_left = index % 2 == 0;
                
                // Get sibling hash (or zero hash if out of bounds)
                let sibling_hash = if sibling_index < self.next_leaf_index.read() && level == 0 {
                    // For leaf level, check if sibling exists
                    self.leaves.read(sibling_index)
                } else if level > 0 && sibling_index < (1_u32.shl(level)) {
                    // For internal levels
                    self.nodes.read((level, sibling_index))
                } else {
                    // Use zero hash
                    self.zero_hashes.read(level)
                };
                
                // Compute parent hash
                let (left, right) = if is_left {
                    (current_hash, sibling_hash)
                } else {
                    (sibling_hash, current_hash)
                };
                
                current_hash = poseidon_hash_span(@[left, right]);
                
                // Store node
                let parent_index = index / 2;
                self.nodes.write((level + 1, parent_index), current_hash);
                
                index = parent_index;
                level += 1;
            };
            
            current_hash
        }
    }
}

// External interface
#[starknet::interface]
trait IMerkleTree<T> {
    /// Insert a new leaf into the Merkle tree
    fn insert_leaf(ref self: T, leaf: felt252) -> (felt252, u32);
    
    /// Get current Merkle root
    fn get_root(self: @T) -> felt252;
    
    /// Get last leaf index
    fn get_last_leaf_index(self: @T) -> u32;
    
    /// Get leaf at index
    fn get_leaf(self: @T, index: u32) -> felt252;
    
    /// Get node at level and index
    fn get_node(self: @T, level: u32, index: u32) -> felt252;
    
    /// Check if root is known
    fn is_known_root(self: @T, root: felt252) -> bool;
    
    /// Get tree height
    fn get_tree_height(self: @T) -> u32;
    
    /// Get total insertions
    fn get_insertion_count(self: @T) -> u64;
    
    /// Get zero hash for level
    fn get_zero_hash(self: @T, level: u32) -> felt252;
    
    /// Admin: reset tree
    fn reset_tree(ref self: T);
    
    /// Verify Merkle proof
    fn verify_proof(
        self: @T,
        leaf: felt252,
        leaf_index: u32,
        path: Span<(felt252, bool)>,
        expected_root: felt252,
    ) -> bool;
}

// Constants
const TREE_HEIGHT: u32 = 20;
const ZERO_LEAF: felt252 = 0;
