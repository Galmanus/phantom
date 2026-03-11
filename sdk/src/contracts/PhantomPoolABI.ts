/**
 * PhantomPool ABI (simplified - full ABI would be generated from Cairo)
 */
export const PhantomPoolABI = [
  {
    type: 'function',
    name: 'shield',
    inputs: [
      { name: 'asset', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' },
      { name: 'commitment', type: 'felt252' },
      { name: 'proof', type: 'Span<felt252>' },
    ],
    outputs: [
      { name: 'new_merkle_root', type: 'felt252' },
      { name: 'leaf_index', type: 'u32' },
    ],
  },
  {
    type: 'function',
    name: 'unshield',
    inputs: [
      { name: 'nullifier', type: 'felt252' },
      { name: 'recipient', type: 'ContractAddress' },
      { name: 'asset', type: 'ContractAddress' },
      { name: 'amount', type: 'u256' },
      { name: 'merkle_root', type: 'felt252' },
      { name: 'change_commitment', type: 'Option<felt252>' },
      { name: 'proof', type: 'Span<felt252>' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'settle_private_swap',
    inputs: [
      { name: 'nullifier_in', type: 'felt252' },
      { name: 'commitment_out', type: 'felt252' },
      { name: 'proof', type: 'Span<felt252>' },
      { name: 'swap_params', type: 'Span<felt252>' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'deposit_shielded_yield',
    inputs: [
      { name: 'commitment', type: 'felt252' },
      { name: 'protocol', type: 'u8' },
      { name: 'proof', type: 'Span<felt252>' },
      { name: 'yield_params', type: 'Span<felt252>' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claim_shielded_yield',
    inputs: [
      { name: 'yield_position_nullifier', type: 'felt252' },
      { name: 'new_commitment', type: 'felt252' },
      { name: 'proof', type: 'Span<felt252>' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'get_merkle_root',
    inputs: [],
    outputs: [{ name: 'root', type: 'felt252' }],
  },
  {
    type: 'function',
    name: 'is_nullifier_spent',
    inputs: [{ name: 'nullifier', type: 'felt252' }],
    outputs: [{ name: 'spent', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'is_valid_historical_root',
    inputs: [{ name: 'root', type: 'felt252' }],
    outputs: [{ name: 'valid', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'Shielded',
    keys: ['commitment', 'asset_id'],
    data: ['leaf_index', 'new_merkle_root'],
  },
  {
    type: 'event',
    name: 'Unshielded',
    keys: ['nullifier'],
    data: ['change_commitment', 'new_merkle_root'],
  },
] as const;

/**
 * ComplianceOracle ABI
 */
export const ComplianceOracleABI = [
  {
    type: 'function',
    name: 'verify_compliance_proof',
    inputs: [
      { name: 'regulator_id', type: 'felt252' },
      { name: 'scope', type: 'u8' },
      { name: 'public_inputs', type: 'Span<felt252>' },
      { name: 'proof', type: 'Span<felt252>' },
    ],
    outputs: [{ name: 'valid', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'get_kyc_root',
    inputs: [],
    outputs: [{ name: 'root', type: 'felt252' }],
  },
  {
    type: 'function',
    name: 'get_sanctions_root',
    inputs: [],
    outputs: [{ name: 'root', type: 'felt252' }],
  },
  {
    type: 'function',
    name: 'get_reporting_threshold',
    inputs: [],
    outputs: [{ name: 'threshold', type: 'u256' }],
  },
] as const;

/**
 * IntentMatcher ABI
 */
export const IntentMatcherABI = [
  {
    type: 'function',
    name: 'submit_intent',
    inputs: [
      { name: 'commitment', type: 'felt252' },
      { name: 'expiry', type: 'u64' },
      { name: 'proof', type: 'Span<felt252>' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'settle_matched_intents',
    inputs: [
      { name: 'intent_a_nullifier', type: 'felt252' },
      { name: 'intent_b_nullifier', type: 'felt252' },
      { name: 'proof', type: 'Span<felt252>' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'is_intent_pending',
    inputs: [{ name: 'commitment', type: 'felt252' }],
    outputs: [{ name: 'pending', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'get_total_settlements',
    inputs: [],
    outputs: [{ name: 'count', type: 'u64' }],
  },
] as const;
