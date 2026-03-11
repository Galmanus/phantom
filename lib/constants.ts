// lib/constants.ts

export const PHANTOM_CONTRACT_ADDRESSES = {
  POOL:               process.env.NEXT_PUBLIC_PHANTOM_POOL_ADDRESS!,
  VERIFIER:           process.env.NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS!,
  COMPLIANCE_ORACLE:  process.env.NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS!,
  INTENT_MATCHER:     process.env.NEXT_PUBLIC_INTENT_MATCHER_ADDRESS!,
};

// Legacy aliases
export const PHANTOM_CONTRACTS = PHANTOM_CONTRACT_ADDRESSES;

// Token addresses — Starknet Sepolia testnet
export const PHANTOM_TOKEN_ADDRESSES = {
  STRK:   process.env.NEXT_PUBLIC_TOKEN_STRK!,
  wBTC:   process.env.NEXT_PUBLIC_TOKEN_WBTC!,
  tBTC:   process.env.NEXT_PUBLIC_TOKEN_TBTC!,
  LBTC:   process.env.NEXT_PUBLIC_TOKEN_LBTC!,
  SolvBTC:process.env.NEXT_PUBLIC_TOKEN_SOLVBTC!,
  USDC:   process.env.NEXT_PUBLIC_TOKEN_USDC!,
};

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
