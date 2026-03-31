use starknet::ContractAddress;

// ============================================================
// NEON Compliance — ZK Privacy-Preserving Compliance Bridge
// ============================================================
// Bridges NEON Covenant ZK proofs into the MIDAS compliance
// system. Users prove age, jurisdiction, and accreditation
// via Poseidon commitments without revealing personal data.
// ============================================================

// Compliance levels (bitmask-compatible)
const COMPLIANCE_NONE: u8 = 0;
const COMPLIANCE_BASIC: u8 = 1;      // age >= 18
const COMPLIANCE_STANDARD: u8 = 2;   // age + jurisdiction not sanctioned
const COMPLIANCE_ENHANCED: u8 = 3;   // age + jurisdiction + investor accreditation

// Merkle proof max depth (matches NEON verifier tree)
const MAX_MERKLE_DEPTH: u32 = 20;

#[starknet::interface]
trait INeonCompliance<T> {
    /// Verify a user's compliance via ZK proof against a registered Merkle root.
    /// Returns true if the proof is valid and the user is now marked compliant.
    fn verify_compliance(
        ref self: T,
        user: ContractAddress,
        commitment: felt252,
        merkle_proof: Span<felt252>,
        compliance_level: u8,
    ) -> bool;

    /// Register a new compliance Merkle root (owner only).
    /// `root` — Poseidon Merkle root of compliant commitments.
    /// `expiration` — Unix timestamp after which this root is no longer valid.
    /// `compliance_level` — Which level this root certifies (BASIC/STANDARD/ENHANCED).
    fn register_compliance_root(
        ref self: T,
        root: felt252,
        expiration: u64,
        compliance_level: u8,
    );

    /// Check if a user holds a valid (non-expired) compliance at the given level.
    fn is_compliant(self: @T, user: ContractAddress, level: u8) -> bool;

    /// Get the expiration timestamp for a user's compliance.
    fn get_compliance_expiration(self: @T, user: ContractAddress) -> u64;

    /// Get the compliance level for a user.
    fn get_compliance_level(self: @T, user: ContractAddress) -> u8;

    /// Get the compliance commitment for a user.
    fn get_compliance_commitment(self: @T, user: ContractAddress) -> felt252;

    /// Check if a root is registered and for which level.
    fn get_root_level(self: @T, root: felt252) -> u8;

    /// Check if a root is registered and not expired.
    fn is_root_valid(self: @T, root: felt252) -> bool;

    /// Transfer ownership.
    fn transfer_ownership(ref self: T, new_owner: ContractAddress);
}

#[starknet::contract]
mod NeonCompliance {
    use super::{
        INeonCompliance,
        COMPLIANCE_NONE, COMPLIANCE_BASIC, COMPLIANCE_STANDARD, COMPLIANCE_ENHANCED,
        MAX_MERKLE_DEPTH,
    };
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp, Zeroable,
    };
    use core::poseidon::poseidon_hash_span;

    // ============ Storage ============

    #[storage]
    struct Storage {
        // Owner (governance / multisig)
        owner: ContractAddress,

        // user -> Poseidon commitment (privacy-preserving identity binding)
        compliance_commitments: LegacyMap<ContractAddress, felt252>,

        // user -> compliance level (0=none, 1=basic, 2=standard, 3=enhanced)
        compliance_levels: LegacyMap<ContractAddress, u8>,

        // user -> expiration timestamp (unix)
        compliance_expirations: LegacyMap<ContractAddress, u64>,

        // Registered Merkle roots: root -> compliance_level it certifies
        // 0 means not registered
        registered_roots: LegacyMap<felt252, u8>,

        // root -> expiration timestamp
        root_expirations: LegacyMap<felt252, u64>,

        // Total users verified per level (metrics)
        total_verified_basic: u64,
        total_verified_standard: u64,
        total_verified_enhanced: u64,
    }

    // ============ Events ============

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ComplianceVerified: ComplianceVerified,
        ComplianceRootRegistered: ComplianceRootRegistered,
        ComplianceExpired: ComplianceExpired,
        ComplianceLevelUpgraded: ComplianceLevelUpgraded,
        OwnerChanged: OwnerChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct ComplianceVerified {
        user: ContractAddress,
        commitment: felt252,
        compliance_level: u8,
        expiration: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct ComplianceRootRegistered {
        root: felt252,
        expiration: u64,
        compliance_level: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct ComplianceExpired {
        user: ContractAddress,
        old_level: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct ComplianceLevelUpgraded {
        user: ContractAddress,
        old_level: u8,
        new_level: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct OwnerChanged {
        old_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    // ============ Constructor ============

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        assert(owner != Zeroable::zero(), 'Invalid owner');
        self.owner.write(owner);
    }

    // ============ External Implementation ============

    #[abi(embed_v0)]
    impl NeonComplianceImpl of INeonCompliance<ContractState> {
        fn verify_compliance(
            ref self: ContractState,
            user: ContractAddress,
            commitment: felt252,
            merkle_proof: Span<felt252>,
            compliance_level: u8,
        ) -> bool {
            // --- Validate inputs ---
            assert(user != Zeroable::zero(), 'Invalid user address');
            assert(commitment != 0, 'Invalid commitment');
            assert(compliance_level >= COMPLIANCE_BASIC, 'Level must be >= BASIC');
            assert(compliance_level <= COMPLIANCE_ENHANCED, 'Level must be <= ENHANCED');
            assert(merkle_proof.len() >= 2, 'Proof too short');
            assert(merkle_proof.len() <= MAX_MERKLE_DEPTH.into() + 1, 'Proof too long');

            // --- Extract the root from the proof ---
            // The last element of merkle_proof is the claimed root.
            // The preceding elements are sibling hashes along the path.
            let proof_len = merkle_proof.len();
            let claimed_root = *merkle_proof.at(proof_len - 1);

            // --- Check root is registered for the requested level ---
            let root_level = self.registered_roots.read(claimed_root);
            assert(root_level != COMPLIANCE_NONE, 'Root not registered');
            assert(root_level >= compliance_level, 'Root level insufficient');

            // --- Check root is not expired ---
            let root_expiration = self.root_expirations.read(claimed_root);
            let now = get_block_timestamp();
            assert(root_expiration > now, 'Root expired');

            // --- Verify Merkle inclusion proof ---
            // Reconstruct root from commitment + sibling path using Poseidon
            let proof_valid = self._verify_merkle_proof(
                commitment, merkle_proof
            );
            assert(proof_valid, 'Invalid Merkle proof');

            // --- Check if this is an upgrade ---
            let old_level = self.compliance_levels.read(user);
            if old_level != COMPLIANCE_NONE && old_level < compliance_level {
                self.emit(ComplianceLevelUpgraded {
                    user,
                    old_level,
                    new_level: compliance_level,
                });
            }

            // --- Store compliance state ---
            self.compliance_commitments.write(user, commitment);
            self.compliance_levels.write(user, compliance_level);
            self.compliance_expirations.write(user, root_expiration);

            // --- Update counters ---
            if compliance_level == COMPLIANCE_BASIC {
                let c = self.total_verified_basic.read();
                self.total_verified_basic.write(c + 1);
            } else if compliance_level == COMPLIANCE_STANDARD {
                let c = self.total_verified_standard.read();
                self.total_verified_standard.write(c + 1);
            } else if compliance_level == COMPLIANCE_ENHANCED {
                let c = self.total_verified_enhanced.read();
                self.total_verified_enhanced.write(c + 1);
            }

            // --- Emit ---
            self.emit(ComplianceVerified {
                user,
                commitment,
                compliance_level,
                expiration: root_expiration,
            });

            true
        }

        fn register_compliance_root(
            ref self: ContractState,
            root: felt252,
            expiration: u64,
            compliance_level: u8,
        ) {
            // Owner only
            assert(get_caller_address() == self.owner.read(), 'Only owner');

            // Validate
            assert(root != 0, 'Invalid root');
            assert(compliance_level >= COMPLIANCE_BASIC, 'Level must be >= BASIC');
            assert(compliance_level <= COMPLIANCE_ENHANCED, 'Level must be <= ENHANCED');

            let now = get_block_timestamp();
            assert(expiration > now, 'Expiration must be future');

            // Store
            self.registered_roots.write(root, compliance_level);
            self.root_expirations.write(root, expiration);

            self.emit(ComplianceRootRegistered {
                root,
                expiration,
                compliance_level,
            });
        }

        fn is_compliant(self: @ContractState, user: ContractAddress, level: u8) -> bool {
            let user_level = self.compliance_levels.read(user);
            if user_level < level {
                return false;
            }

            // Check expiration
            let expiration = self.compliance_expirations.read(user);
            let now = get_block_timestamp();
            if expiration <= now {
                return false;
            }

            true
        }

        fn get_compliance_expiration(self: @ContractState, user: ContractAddress) -> u64 {
            self.compliance_expirations.read(user)
        }

        fn get_compliance_level(self: @ContractState, user: ContractAddress) -> u8 {
            // Return 0 (NONE) if expired
            let level = self.compliance_levels.read(user);
            if level == COMPLIANCE_NONE {
                return COMPLIANCE_NONE;
            }
            let expiration = self.compliance_expirations.read(user);
            let now = get_block_timestamp();
            if expiration <= now {
                return COMPLIANCE_NONE;
            }
            level
        }

        fn get_compliance_commitment(self: @ContractState, user: ContractAddress) -> felt252 {
            self.compliance_commitments.read(user)
        }

        fn get_root_level(self: @ContractState, root: felt252) -> u8 {
            self.registered_roots.read(root)
        }

        fn is_root_valid(self: @ContractState, root: felt252) -> bool {
            let level = self.registered_roots.read(root);
            if level == COMPLIANCE_NONE {
                return false;
            }
            let expiration = self.root_expirations.read(root);
            let now = get_block_timestamp();
            expiration > now
        }

        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            assert(new_owner != Zeroable::zero(), 'Invalid owner address');
            let old_owner = self.owner.read();
            assert(get_caller_address() == old_owner, 'Only owner');

            self.owner.write(new_owner);
            self.emit(OwnerChanged { old_owner, new_owner });
        }
    }

    // ============ Internal Functions ============

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Verify a Poseidon Merkle inclusion proof.
        ///
        /// `merkle_proof` layout:
        ///   [sibling_0, sibling_1, ..., sibling_{n-2}, claimed_root]
        ///
        /// The leaf is the commitment itself.
        /// At each level, we hash (current, sibling) or (sibling, current)
        /// depending on whether the current hash is "left" or "right".
        /// Convention: if current < sibling, current is left; otherwise right.
        /// The final computed root must equal claimed_root (last element).
        fn _verify_merkle_proof(
            self: @ContractState,
            commitment: felt252,
            merkle_proof: Span<felt252>,
        ) -> bool {
            let proof_len = merkle_proof.len();
            if proof_len < 2 {
                return false;
            }

            let claimed_root = *merkle_proof.at(proof_len - 1);
            let sibling_count = proof_len - 1;

            // Start with the leaf = hash of commitment (consistent with NEON)
            let mut current = poseidon_hash_span(array![commitment].span());

            let mut i: u32 = 0;
            loop {
                if i >= sibling_count {
                    break;
                }
                let sibling = *merkle_proof.at(i);

                // Canonical ordering: smaller value on the left
                if current.into() < sibling.into() {
                    current = poseidon_hash_span(array![current, sibling].span());
                } else {
                    current = poseidon_hash_span(array![sibling, current].span());
                }

                i += 1;
            };

            current == claimed_root
        }
    }
}
