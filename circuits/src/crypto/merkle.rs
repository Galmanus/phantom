//! Merkle tree primitives using Poseidon hash
//! 
//! Implements a binary Merkle tree with height 20 (2^20 leaves).
//! Compatible with the Cairo PhantomMerkle contract.

use starknet_crypto::FieldElement;
use super::poseidon::poseidon_hash;

/// Tree height (20 levels = 2^20 = 1,048,576 leaves)
pub const TREE_HEIGHT: usize = 20;

/// Merkle proof path element (sibling hash and direction)
#[derive(Debug, Clone, Copy)]
pub struct MerklePathElement {
    pub hash: FieldElement,
    pub is_right: bool, // true if sibling is on the right
}

/// Merkle proof (20 path elements)
pub type MerkleProof = [MerklePathElement; TREE_HEIGHT];

/// Compute the root of a Merkle tree from leaves
pub fn compute_root(leaves: &[FieldElement]) -> FieldElement {
    if leaves.is_empty() {
        return compute_zero_hash(0);
    }
    
    let mut current_level: Vec<FieldElement> = leaves.to_vec();
    
    // Pad to power of 2
    while current_level.len().count_ones() != 1 {
        current_level.push(compute_zero_hash(0));
    }
    
    // Build tree bottom-up
    while current_level.len() > 1 {
        let mut next_level = Vec::new();
        for chunk in current_level.chunks(2) {
            let left = chunk[0];
            let right = if chunk.len() > 1 { chunk[1] } else { compute_zero_hash(0) };
            next_level.push(poseidon_hash(&left, &right));
        }
        current_level = next_level;
    }
    
    current_level[0]
}

/// Generate Merkle proof for a leaf at given index
pub fn generate_path(leaves: &[FieldElement], index: usize) -> MerkleProof {
    assert!(index < leaves.len(), "Index out of bounds");
    assert!(leaves.len() <= 1 << TREE_HEIGHT, "Too many leaves");
    
    let mut path = std::array::from_fn(|_| MerklePathElement {
        hash: FieldElement::ZERO,
        is_right: false,
    });
    
    let mut current_level: Vec<FieldElement> = leaves.to_vec();
    
    // Pad to power of 2
    while current_level.len().count_ones() != 1 {
        current_level.push(compute_zero_hash(0));
    }
    
    // Calculate the tree depth (how many levels until root)
    let depth = (current_level.len() as f64).log2() as usize;
    
    let mut idx = index;
    
    // Build tree and generate proof only for actual depth levels
    for level in 0..depth {
        let sibling_idx = idx ^ 1;
        let is_right = idx % 2 == 1;
        
        let sibling_hash = if sibling_idx < current_level.len() {
            current_level[sibling_idx]
        } else {
            compute_zero_hash(level)
        };
        
        path[level] = MerklePathElement {
            hash: sibling_hash,
            is_right,
        };
        
        // Build next level
        let mut next_level = Vec::new();
        for chunk in current_level.chunks(2) {
            let left = chunk[0];
            let right = if chunk.len() > 1 { chunk[1] } else { compute_zero_hash(level) };
            next_level.push(poseidon_hash(&left, &right));
        }
        current_level = next_level;
        idx /= 2;
    }
    
    path
}

/// Verify Merkle inclusion proof
pub fn verify_path(
    leaf: FieldElement,
    path: &MerkleProof,
    root: FieldElement,
) -> bool {
    let mut current_hash = leaf;
    
    for element in path.iter() {
        // Skip zero/default elements (unfilled proof levels)
        if element.hash == FieldElement::ZERO && !element.is_right {
            break;
        }
        
        // If is_right is true, the current node is the RIGHT child, so sibling is on LEFT
        // If is_right is false, the current node is the LEFT child, so sibling is on RIGHT
        let (left, right) = if element.is_right {
            (element.hash, current_hash)  // sibling on left, current on right
        } else {
            (current_hash, element.hash)  // current on left, sibling on right
        };
        current_hash = poseidon_hash(&left, &right);
    }
    
    current_hash == root
}

use std::sync::OnceLock;

/// Pre-computed zero hashes for each level (lazy computed)
static ZERO_HASHES: OnceLock<[FieldElement; TREE_HEIGHT + 1]> = OnceLock::new();

/// Get the cached zero hashes, computing them on first use
fn get_zero_hashes() -> &'static [FieldElement; TREE_HEIGHT + 1] {
    ZERO_HASHES.get_or_init(|| {
        let mut hashes = [FieldElement::ZERO; TREE_HEIGHT + 1];
        // hashes[0] is the empty leaf = Poseidon(0, 0)
        // This is the correct value for an empty tree
        hashes[0] = poseidon_hash(&FieldElement::ZERO, &FieldElement::ZERO);
        for i in 1..=TREE_HEIGHT {
            hashes[i] = poseidon_hash(&hashes[i - 1], &hashes[i - 1]);
        }
        hashes
    })
}

/// Compute zero hash for a given level (pre-computed empty subtree hashes)
pub fn compute_zero_hash(level: usize) -> FieldElement {
    if level > TREE_HEIGHT {
        return FieldElement::ZERO;
    }
    get_zero_hashes()[level]
}

/// Build a Merkle tree with all nodes stored for efficient proof generation
#[derive(Debug, Clone)]
pub struct MerkleTree {
    /// All nodes stored by level (level 0 = leaves)
    nodes: Vec<Vec<FieldElement>>,
    /// Current root
    root: FieldElement,
    /// Number of leaves
    leaf_count: usize,
}

impl MerkleTree {
    /// Create a new empty Merkle tree
    pub fn new() -> Self {
        let mut nodes = Vec::with_capacity(TREE_HEIGHT + 1);
        for _ in 0..=TREE_HEIGHT {
            nodes.push(Vec::new());
        }
        
        MerkleTree {
            nodes,
            root: compute_zero_hash(0),
            leaf_count: 0,
        }
    }
    
    /// Append a leaf to the tree
    pub fn append(&mut self, leaf: FieldElement) -> (FieldElement, usize) {
        let leaf_index = self.leaf_count;
        self.leaf_count += 1;
        
        // Add leaf to level 0
        if self.nodes[0].len() <= leaf_index {
            self.nodes[0].push(leaf);
        } else {
            self.nodes[0][leaf_index] = leaf;
        }
        
        // Update internal nodes
        let mut current_hash = leaf;
        let mut idx = leaf_index;
        
        for level in 0..TREE_HEIGHT {
            let sibling_idx = idx ^ 1;
            let is_left = idx % 2 == 0;
            
            // Ensure level has enough capacity
            let parent_idx = idx / 2;
            while self.nodes[level + 1].len() <= parent_idx {
                self.nodes[level + 1].push(FieldElement::ZERO);
            }
            
            let sibling_hash = if sibling_idx < self.nodes[level].len() {
                self.nodes[level][sibling_idx]
            } else {
                compute_zero_hash(level)
            };
            
            current_hash = if is_left {
                poseidon_hash(&current_hash, &sibling_hash)
            } else {
                poseidon_hash(&sibling_hash, &current_hash)
            };
            
            self.nodes[level + 1][parent_idx] = current_hash;
            idx = parent_idx;
        }
        
        self.root = current_hash;
        (current_hash, leaf_index)
    }
    
    /// Get the current root
    pub fn root(&self) -> FieldElement {
        self.root
    }
    
    /// Generate proof for a leaf
    pub fn get_proof(&self, leaf_index: usize) -> Option<MerkleProof> {
        if leaf_index >= self.leaf_count {
            return None;
        }
        
        let mut path = std::array::from_fn(|_| MerklePathElement {
            hash: FieldElement::ZERO,
            is_right: false,
        });
        
        let mut idx = leaf_index;
        
        for level in 0..TREE_HEIGHT {
            let sibling_idx = idx ^ 1;
            let is_right = idx % 2 == 1;
            
            let sibling_hash = if sibling_idx < self.nodes[level].len() {
                self.nodes[level][sibling_idx]
            } else {
                compute_zero_hash(level)
            };
            
            path[level] = MerklePathElement {
                hash: sibling_hash,
                is_right,
            };
            
            idx /= 2;
        }
        
        Some(path)
    }
    
    /// Get number of leaves
    pub fn leaf_count(&self) -> usize {
        self.leaf_count
    }
}

impl Default for MerkleTree {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_merkle_root_single_leaf() {
        let leaf = FieldElement::from(42u64);
        let root = compute_root(&[leaf]);
        assert_ne!(root, FieldElement::ZERO);
    }
    
    #[test]
    fn test_merkle_root_two_leaves() {
        let left = FieldElement::from(1u64);
        let right = FieldElement::from(2u64);
        let root = compute_root(&[left, right]);
        assert_ne!(root, FieldElement::ZERO);
    }
    
    #[test]
    fn test_merkle_proof_verification() {
        let leaves: Vec<FieldElement> = (0usize..8).map(|i| FieldElement::from(i as u64)).collect();
        let root = compute_root(&leaves);
        
        for (i, &leaf) in leaves.iter().enumerate() {
            let path = generate_path(&leaves, i);
            assert!(verify_path(leaf, &path, root), "Proof failed for leaf {}", i);
        }
    }
    
    #[test]
    fn test_merkle_tree_incremental() {
        let mut tree = MerkleTree::new();

        for i in 0u64..10 {
            let leaf = FieldElement::from(i);
            let (root, idx) = tree.append(leaf);
            assert_eq!(idx, i as usize);

            let proof = tree.get_proof(i as usize).unwrap();
            assert!(verify_path(leaf, &proof, root));
        }
    }
    
    #[test]
    fn test_invalid_proof_fails() {
        let leaves: Vec<FieldElement> = (0usize..4).map(|i| FieldElement::from(i as u64)).collect();
        let root = compute_root(&leaves);
        
        let path = generate_path(&leaves, 0);
        let wrong_leaf = FieldElement::from(999u64);
        
        assert!(!verify_path(wrong_leaf, &path, root));
    }
}
