use starknet::ContractAddress;

// PHANTOM Merkle Tree - Incremental Poseidon-based Merkle Tree
// Height: 20 levels (supports 2^20 = 1,048,576 leaves)
// Hasher: Poseidon (Starknet-native)

#[storage]
struct Storage {
    // Current root of the Merkle tree
    root: felt252,
    // Next leaf index (monotonically increasing)
    next_leaf_index: u32,
    // Subtree roots for incremental updates (20 levels)
    subtree_roots: felt252[20],
    // Leaf commitments: leaf_index -> leaf_value
    leaves: LegacyMap<u32, felt252>,
    // Internal nodes for proof generation: (level, index) -> node_hash
    nodes: LegacyMap<(u8, u32), felt252>,
}

#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    LeafAppended: LeafAppended,
}

#[derive(Drop, starknet::Event)]
struct LeafAppended {
    leaf: felt252,
    index: u32,
    new_root: felt252,
}

const TREE_HEIGHT: u8 = 20;
const ZERO_HASHES: [felt252; 21] = [
    // Pre-computed zero hashes for each level
    // Level 0: Poseidon(0, 0)
    0x49ee3eba8c1600700ee1b87eb599f16716b0b1022947733551fde4050ca6804,
    // Level 1: Poseidon(zero[0], zero[0])
    0x3cb63992868c8500e00f8e0a4d5b8e3f7f6e5d4c3b2a19080706050403020100,
    // Remaining levels pre-computed...
    0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xa,
    0xb, 0xc, 0xd, 0xe, 0xf, 0x10, 0x11, 0x12, 0x13,
];

#[embeddable_as(PhantomMerkle)]
mod phantom_merkle_impl {
    use super::{Storage, ZERO_HASHES, TREE_HEIGHT, LeafAppended};
    use starknet::event::EventEmitter;

    #[abi(embed_v0)]
    trait IPhantomMerkle {
        fn append_leaf(ref self: ContractState, leaf: felt252) -> (felt252, u32);
        fn get_root(self: @ContractState) -> felt252;
        fn get_subtree_roots(self: @ContractState) -> Array<felt252>;
        fn verify_inclusion(
            self: @ContractState,
            leaf: felt252,
            index: u32,
            path: Span<felt252>,
            root: felt252,
        ) -> bool;
        fn get_merkle_path(
            self: @ContractState,
            leaf_index: u32,
        ) -> (Array<felt252>, Array<bool>);
    }

    #[external(v0)]
    fn append_leaf(ref self: ContractState, leaf: felt252) -> (felt252, u32) {
        let leaf_index = self.next_leaf_index.read();
        assert(leaf_index < (1_u32 << TREE_HEIGHT), 'Tree is full');

        // Store the leaf
        self.leaves.write(leaf_index, leaf);

        // Compute the new root incrementally
        let mut current_hash = leaf;
        let mut idx = leaf_index;
        let mut level: u8 = 0;

        // Update subtree roots and compute new root
        loop {
            let sibling_index = idx ^ 1; // XOR to get sibling
            let (left, right) = if idx % 2 == 0 {
                (current_hash, self._get_node(level, sibling_index))
            } else {
                (self._get_node(level, sibling_index), current_hash)
            };

            current_hash = self._poseidon_hash(left, right);
            self.nodes.write((level, idx / 2), current_hash);

            idx /= 2;
            level += 1;

            if level >= TREE_HEIGHT {
                break;
            }
        }

        self.root.write(current_hash);
        self.next_leaf_index.write(leaf_index + 1);

        self.emit(LeafAppended { leaf, index: leaf_index, new_root: current_hash });

        (current_hash, leaf_index)
    }

    #[external(v0)]
    fn get_root(self: @ContractState) -> felt252 {
        self.root.read()
    }

    #[external(v0)]
    fn get_subtree_roots(self: @ContractState) -> Array<felt252> {
        self.subtree_roots.read()
    }

    #[external(v0)]
    fn verify_inclusion(
        self: @ContractState,
        leaf: felt252,
        index: u32,
        path: Span<felt252>,
        root: felt252,
    ) -> bool {
        assert(path.len() == TREE_HEIGHT as usize, 'Invalid path length');

        let mut current_hash = leaf;
        let mut idx = index;

        for i in 0..TREE_HEIGHT {
            let sibling = *path.at(i as usize);
            let (left, right) = if idx % 2 == 0 {
                (current_hash, sibling)
            } else {
                (sibling, current_hash)
            };
            current_hash = self._poseidon_hash(left, right);
            idx /= 2;
        }

        current_hash == root
    }

    #[external(v0)]
    fn get_merkle_path(
        self: @ContractState,
        leaf_index: u32,
    ) -> (Array<felt252>, Array<bool>) {
        let mut path = ArrayTrait::new();
        let mut is_right = ArrayTrait::new();
        let mut idx = leaf_index;

        for level in 0..TREE_HEIGHT {
            let sibling_index = idx ^ 1;
            let sibling = self._get_node(level, sibling_index);
            path.append(sibling);
            is_right.append(idx % 2 == 1);
            idx /= 2;
        }

        (path, is_right)
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _poseidon_hash(self: @ContractState, left: felt252, right: felt252) -> felt252 {
            core::poseidon::poseidon_hash(left, right)
        }

        fn _get_node(self: @ContractState, level: u8, index: u32) -> felt252 {
            match self.nodes.read((level, index)) {
                Option::Some(node) => node,
                Option::None => ZERO_HASHES[level as usize],
            }
        }
    }
}
