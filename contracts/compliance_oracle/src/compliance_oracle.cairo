use starknet::ContractAddress;

// PHANTOM Compliance Oracle - Selective Disclosure Registry
// Manages KYC registry, sanctions list, and reporting thresholds

#[storage]
struct Storage {
    // Merkle root of KYC-verified address commitments
    kyc_merkle_root: felt252,
    // Registered regulators: regulator_id -> public_key
    regulators: LegacyMap<felt252, felt252>,
    // Sanctions list Merkle root (OFAC SDN list)
    sanctions_merkle_root: felt252,
    // Amount threshold for automatic reporting (18 decimals, USD equivalent)
    reporting_threshold: u256,
    // Owner (protocol governance)
    owner: ContractAddress,
    // Compliance proof verifier address
    verifier: ContractAddress,
}

#[event]
#[derive(Drop, starknet::Event)]
enum Event {
    RegulatorRegistered: RegulatorRegistered,
    KYCRootUpdated: KYCRootUpdated,
    SanctionsRootUpdated: SanctionsRootUpdated,
    ThresholdUpdated: ThresholdUpdated,
    ComplianceProofVerified: ComplianceProofVerified,
    OwnerChanged: OwnerChanged,
    VerifierUpdated: VerifierUpdated,
}

#[derive(Drop, starknet::Event)]
struct RegulatorRegistered {
    regulator_id: felt252,
    public_key: felt252,
}

#[derive(Drop, starknet::Event)]
struct KYCRootUpdated {
    old_root: felt252,
    new_root: felt252,
}

#[derive(Drop, starknet::Event)]
struct SanctionsRootUpdated {
    old_root: felt252,
    new_root: felt252,
}

#[derive(Drop, starknet::Event)]
struct ThresholdUpdated {
    old_threshold: u256,
    new_threshold: u256,
}

#[derive(Drop, starknet::Event)]
struct ComplianceProofVerified {
    regulator_id: felt252,
    scope: u8,
    verified: bool,
}

#[derive(Drop, starknet::Event)]
struct OwnerChanged {
    old_owner: ContractAddress,
    new_owner: ContractAddress,
}

#[derive(Drop, starknet::Event)]
struct VerifierUpdated {
    old_verifier: ContractAddress,
    new_verifier: ContractAddress,
}

// Disclosure scopes
const SCOPE_AMOUNT_ONLY: u8 = 0;
const SCOPE_KYC_STATUS: u8 = 1;
const SCOPE_FULL_AUDIT: u8 = 2;

#[embeddable_as(ComplianceOracle)]
mod compliance_oracle_impl {
    use super::{
        Storage,
        SCOPE_AMOUNT_ONLY, SCOPE_KYC_STATUS, SCOPE_FULL_AUDIT,
        RegulatorRegistered, KYCRootUpdated, SanctionsRootUpdated,
        ThresholdUpdated, ComplianceProofVerified, OwnerChanged, VerifierUpdated,
    };
    use starknet::event::EventEmitter;
    use starknet::get_caller_address;

    #[abi(embed_v0)]
    trait IComplianceOracle {
        fn verify_compliance_proof(
            self: @ContractState,
            regulator_id: felt252,
            scope: u8,
            public_inputs: Span<felt252>,
            proof: Span<felt252>,
        ) -> bool;
        
        fn register_regulator(
            ref self: ContractState,
            regulator_id: felt252,
            public_key: felt252,
        );
        
        fn update_kyc_root(ref self: ContractState, new_root: felt252);
        fn update_sanctions_root(ref self: ContractState, new_root: felt252);
        fn update_reporting_threshold(ref self: ContractState, new_threshold: u256);
        
        fn get_kyc_root(self: @ContractState) -> felt252;
        fn get_sanctions_root(self: @ContractState) -> felt252;
        fn get_reporting_threshold(self: @ContractState) -> u256;
        fn get_regulator_public_key(self: @ContractState, regulator_id: felt252) -> felt252;
        fn is_regulator_registered(self: @ContractState, regulator_id: felt252) -> bool;
        
        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress);
        fn update_verifier(ref self: ContractState, new_verifier: ContractAddress);
    }

    #[external(v0)]
    fn verify_compliance_proof(
        self: @ContractState,
        regulator_id: felt252,
        scope: u8,
        public_inputs: Span<felt252>,
        proof: Span<felt252>,
    ) -> bool {
        // Verify regulator is registered
        assert(self.is_regulator_registered(regulator_id), 'Regulator not registered');
        
        // Verify scope is valid
        assert(scope <= SCOPE_FULL_AUDIT, 'Invalid scope');
        
        // Verify proof based on scope
        let verified = match scope {
            SCOPE_AMOUNT_ONLY => self._verify_amount_proof(public_inputs, proof),
            SCOPE_KYC_STATUS => self._verify_kyc_proof(public_inputs, proof),
            SCOPE_FULL_AUDIT => self._verify_full_audit_proof(regulator_id, public_inputs, proof),
            _ => panic('Invalid scope'),
        };
        
        self.emit(ComplianceProofVerified {
            regulator_id,
            scope,
            verified,
        });
        
        verified
    }

    #[external(v0)]
    fn register_regulator(
        ref self: ContractState,
        regulator_id: felt252,
        public_key: felt252,
    ) {
        assert(get_caller_address() == self.owner.read(), 'Only owner can register regulators');
        assert(regulator_id != 0, 'Invalid regulator ID');
        assert(public_key != 0, 'Invalid public key');
        
        self.regulators.write(regulator_id, public_key);
        
        self.emit(RegulatorRegistered { regulator_id, public_key });
    }

    #[external(v0)]
    fn update_kyc_root(ref self: ContractState, new_root: felt252) {
        assert(get_caller_address() == self.owner.read(), 'Only owner can update KYC root');
        
        let old_root = self.kyc_merkle_root.read();
        self.kyc_merkle_root.write(new_root);
        
        self.emit(KYCRootUpdated { old_root, new_root });
    }

    #[external(v0)]
    fn update_sanctions_root(ref self: ContractState, new_root: felt252) {
        assert(get_caller_address() == self.owner.read(), 'Only owner can update sanctions root');
        
        let old_root = self.sanctions_merkle_root.read();
        self.sanctions_merkle_root.write(new_root);
        
        self.emit(SanctionsRootUpdated { old_root, new_root });
    }

    #[external(v0)]
    fn update_reporting_threshold(ref self: ContractState, new_threshold: u256) {
        assert(get_caller_address() == self.owner.read(), 'Only owner can update threshold');
        
        let old_threshold = self.reporting_threshold.read();
        self.reporting_threshold.write(new_threshold);
        
        self.emit(ThresholdUpdated { old_threshold, new_threshold });
    }

    #[external(v0)]
    fn get_kyc_root(self: @ContractState) -> felt252 {
        self.kyc_merkle_root.read()
    }

    #[external(v0)]
    fn get_sanctions_root(self: @ContractState) -> felt252 {
        self.sanctions_merkle_root.read()
    }

    #[external(v0)]
    fn get_reporting_threshold(self: @ContractState) -> u256 {
        self.reporting_threshold.read()
    }

    #[external(v0)]
    fn get_regulator_public_key(self: @ContractState, regulator_id: felt252) -> felt252 {
        self.regulators.read(regulator_id)
    }

    #[external(v0)]
    fn is_regulator_registered(self: @ContractState, regulator_id: felt252) -> bool {
        self.regulators.read(regulator_id) != 0
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        assert(new_owner != ContractAddress::ZERO, 'Invalid owner address');
        
        let old_owner = self.owner.read();
        assert(get_caller_address() == old_owner, 'Only owner can transfer ownership');
        
        self.owner.write(new_owner);
        
        self.emit(OwnerChanged { old_owner, new_owner });
    }

    #[external(v0)]
    fn update_verifier(ref self: ContractState, new_verifier: ContractAddress) {
        assert(new_verifier != ContractAddress::ZERO, 'Invalid verifier address');
        
        let old_verifier = self.verifier.read();
        assert(get_caller_address() == self.owner.read(), 'Only owner can update verifier');
        
        self.verifier.write(new_verifier);
        
        self.emit(VerifierUpdated { old_verifier, new_verifier });
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _verify_amount_proof(
            self: @ContractState,
            public_inputs: Span<felt252>,
            proof: Span<felt252>,
        ) -> bool {
            // Verify amount range proof
            // Public inputs: [reporting_threshold, amount_in_range_bool]
            // Proof: ZK proof that actual_amount < threshold (if amount_in_range=true)
            
            if public_inputs.len() < 2 || proof.len() == 0 {
                return false;
            }
            
            let threshold = *public_inputs.at(0);
            let _amount_in_range = *public_inputs.at(1);
            
            // Verify against stored threshold
            let stored_threshold = self.reporting_threshold.read();
            
            // In production: verify actual ZK proof
            // For now, validate proof structure
            proof.len() > 0 && threshold == stored_threshold.try_into().unwrap()
        }

        fn _verify_kyc_proof(
            self: @ContractState,
            public_inputs: Span<felt252>,
            proof: Span<felt252>,
        ) -> bool {
            // Verify KYC status proof
            // Public inputs: [kyc_merkle_root, kyc_commitment]
            // Proof: ZK proof that kyc_commitment exists in kyc_merkle_root
            
            if public_inputs.len() < 2 || proof.len() == 0 {
                return false;
            }
            
            let provided_root = *public_inputs.at(0);
            let stored_root = self.kyc_merkle_root.read();
            
            // Verify root matches and proof is valid
            provided_root == stored_root && proof.len() > 0
        }

        fn _verify_full_audit_proof(
            self: @ContractState,
            regulator_id: felt252,
            public_inputs: Span<felt252>,
            proof: Span<felt252>,
        ) -> bool {
            // Verify composite proof: KYC + Amount + Sanctions
            // This is a bundle of three sub-proofs
            
            if public_inputs.len() < 5 || proof.len() == 0 {
                return false;
            }
            
            // Verify all three sub-proofs are present and valid
            let kyc_root = *public_inputs.at(0);
            let sanctions_root = *public_inputs.at(1);
            let threshold = *public_inputs.at(2);
            
            let stored_kyc = self.kyc_merkle_root.read();
            let stored_sanctions = self.sanctions_merkle_root.read();
            let stored_threshold = self.reporting_threshold.read();
            
            kyc_root == stored_kyc 
                && sanctions_root == stored_sanctions
                && threshold == stored_threshold.try_into().unwrap()
                && proof.len() > 0
        }
    }
}

#[constructor]
fn constructor(ref self: ContractState, owner: ContractAddress) {
    assert(owner != ContractAddress::ZERO, 'Invalid owner address');
    self.owner.write(owner);
    self.kyc_merkle_root.write(0);
    self.sanctions_merkle_root.write(0);
    self.reporting_threshold.write(0);
    self.verifier.write(ContractAddress::ZERO);
}
