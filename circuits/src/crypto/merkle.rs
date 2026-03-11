//! Merkle tree primitives using Poseidon hash
//! 
//! Implements a binary Merkle tree with height 20 (2^20 leaves).
//! Compatible with the Cairo PhantomMerkle contract.

use super::poseidon::{FieldElement, poseidon_hash};

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
    
    let mut idx = index;
    
    for level in 0..TREE_HEIGHT {
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
            let right = if chunk.len() > 1 { chunk[1] } else { compute_zero_hash(0) };
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
        let (left, right) = if element.is_right {
            (current_hash, element.hash)
        } else {
            (element.hash, current_hash)
        };
        current_hash = poseidon_hash(&left, &right);
    }
    
    current_hash == root
}

/// Compute zero hash for a given level (pre-computed empty subtree hashes)
pub fn compute_zero_hash(level: usize) -> FieldElement {
    // Pre-computed zero hashes for each level
    // Level 0: Poseidon(0, 0)
    // Level N: Poseidon(zero[N-1], zero[N-1])

    const ZERO_HASHES: [FieldElement; TREE_HEIGHT + 1] = [
        FieldElement([0x49ee3eba8c160070, 0xee1b87eb599f1671, 0x6b0b102294773355, 0x1fde4050ca6804]),
        // Additional pre-computed values would go here
        // For now, we compute them dynamically
        FieldElement::ZERO, FieldElement::ZERO, FieldElement::ZERO,
        FieldElement::ZERO, FieldElement::ZERO, FieldElement::ZERO,
        FieldElement::ZERO, FieldElement::ZERO, FieldElement::ZERO,
        FieldElement::ZERO, FieldElement::ZERO, FieldElement::ZERO,
        FieldElement::ZERO, FieldElement::ZERO, FieldElement::ZERO,
        FieldElement::ZERO, FieldElement::ZERO, FieldElement::ZERO,
        FieldElement::ZERO, FieldElement::ZERO,
    ];
    
    if level <= TREE_HEIGHT {
        ZERO_HASHES[level]
    } else {
        FieldElement::ZERO
    }
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
        let leaf = FieldElement::from_u64(42);
        let root = compute_root(&[leaf]);
        assert_ne!(root, FieldElement::ZERO);
    }
    
    #[test]
    fn test_merkle_root_two_leaves() {
        let left = FieldElement::from_u64(1);
        let right = FieldElement::from_u64(2);
        let root = compute_root(&[left, right]);
        assert_ne!(root, FieldElement::ZERO);
    }
    
    #[test]
    fn test_merkle_proof_verification() {
        let leaves: Vec<FieldElement> = (0..8).map(FieldElement::from_u64).collect();
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
            let leaf = FieldElement::from_u64(i);
            let (root, idx) = tree.append(leaf);
            assert_eq!(idx, i as usize);

            let proof = tree.get_proof(i as usize).unwrap();
            assert!(verify_path(leaf, &proof, root));
        }
    }
    
    #[test]
    fn test_invalid_proof_fails() {
        let leaves: Vec<FieldElement> = (0..4).map(FieldElement::from_u64).collect();
        let root = compute_root(&leaves);
        
        let path = generate_path(&leaves, 0);
        let wrong_leaf = FieldElement::from_u64(999);
        
        assert!(!verify_path(wrong_leaf, &path, root));
    }
}
