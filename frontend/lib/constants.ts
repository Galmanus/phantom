/**
 * PHANTOM Constants - Contract addresses and token addresses
 * 
 * All values loaded from environment variables.
 * NEVER hardcode values for production.
 */

// PHANTOM Contract Addresses
export const PHANTOM_CONTRACT_ADDRESSES = {
  PHANTOM_POOL:        process.env.NEXT_PUBLIC_PHANTOM_POOL_ADDRESS!,
  PHANTOM_VERIFIER:    process.env.NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS!,
  COMPLIANCE_ORACLE:   process.env.NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS!,
  INTENT_MATCHER:      process.env.NEXT_PUBLIC_INTENT_MATCHER_ADDRESS!,
};

// Token Addresses - Starknet Sepolia testnet
// Replace with mainnet addresses in production
export const PHANTOM_TOKEN_ADDRESSES = {
  STRK:   process.env.NEXT_PUBLIC_TOKEN_STRK!,
  wBTC:   process.env.NEXT_PUBLIC_TOKEN_WBTC!,
  tBTC:   process.env.NEXT_PUBLIC_TOKEN_TBTC!,
  LBTC:   process.env.NEXT_PUBLIC_TOKEN_LBTC!,
  SolvBTC:process.env.NEXT_PUBLIC_TOKEN_SOLVBTC!,
  USDC:   process.env.NEXT_PUBLIC_TOKEN_USDC!,
};

// Network configuration
export const STARKNET_CONFIG = {
  network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || "sepolia",
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "",
};

// Validate environment variables at startup
export function validateEnvironment(): void {
  const required = [
    "NEXT_PUBLIC_STARKNET_RPC_URL",
    "NEXT_PUBLIC_STARKNET_NETWORK",
    "NEXT_PUBLIC_PHANTOM_POOL_ADDRESS",
    "NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS",
    "NEXT_PUBLIC_TOKEN_STRK",
    "NEXT_PUBLIC_TOKEN_WBTC",
    "NEXT_PUBLIC_TOKEN_USDC",
  ];

  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `PHANTOM: Missing required environment variables:\n${missing.join("\n")}`
    );
  }
}

// ERC20 ABI (minimal for approve/allowance/transfer)
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "contract_address" },
      { name: "amount", type: "u256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "external",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "contract_address" },
      { name: "spender", type: "contract_address" },
    ],
    outputs: [{ name: "remaining", type: "u256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "contract_address" }],
    outputs: [{ name: "balance", type: "u256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "recipient", type: "contract_address" },
      { name: "amount", type: "u256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "external",
  },
];

// PHANTOM Pool ABI (minimal for shield/unshield)
export const PHANTOM_POOL_ABI = [
  {
    type: "function",
    name: "shield",
    inputs: [
      { name: "asset", type: "contract_address" },
      { name: "amount", type: "u256" },
      { name: "commitment", type: "felt252" },
      { name: "proof", type: "Span<felt252>" },
    ],
    outputs: [{ name: "new_root", type: "felt252" }, { name: "leaf_index", type: "u32" }],
    stateMutability: "external",
  },
  {
    type: "function",
    name: "unshield",
    inputs: [
      { name: "nullifier", type: "felt252" },
      { name: "recipient", type: "contract_address" },
      { name: "asset", type: "contract_address" },
      { name: "amount", type: "u256" },
      { name: "merkle_root", type: "felt252" },
      { name: "change_commitment", type: "Option<felt252>" },
      { name: "proof", type: "Span<felt252>" },
    ],
    outputs: [],
    stateMutability: "external",
  },
  {
    type: "function",
    name: "get_merkle_root",
    inputs: [],
    outputs: [{ name: "root", type: "felt252" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "is_valid_historical_root",
    inputs: [{ name: "root", type: "felt252" }],
    outputs: [{ name: "is_valid", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "is_nullifier_spent",
    inputs: [{ name: "nullifier", type: "felt252" }],
    outputs: [{ name: "is_spent", type: "bool" }],
    stateMutability: "view",
  },
];
