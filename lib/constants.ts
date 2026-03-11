// lib/constants.ts

export const PHANTOM_CONTRACT_ADDRESSES = {
  POOL:               process.env.NEXT_PUBLIC_PHANTOM_POOL_ADDRESS || '',
  VERIFIER:           process.env.NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS || '',
  COMPLIANCE_ORACLE:  process.env.NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS || '',
  INTENT_MATCHER:     process.env.NEXT_PUBLIC_INTENT_MATCHER_ADDRESS || '',
  MERKLE:             process.env.NEXT_PUBLIC_PHANTOM_MERKLE_ADDRESS || '',
};

// Legacy aliases
export const PHANTOM_CONTRACTS = PHANTOM_CONTRACT_ADDRESSES;

// Token addresses — Starknet Sepolia testnet
export const PHANTOM_TOKEN_ADDRESSES = {
  STRK:   process.env.NEXT_PUBLIC_STRK_ADDRESS || '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  wBTC:   process.env.NEXT_PUBLIC_WBTC_ADDRESS || '',
  tBTC:   process.env.NEXT_PUBLIC_TBTC_ADDRESS || '',
  LBTC:   process.env.NEXT_PUBLIC_LBTC_ADDRESS || '',
  SolvBTC:process.env.NEXT_PUBLIC_SOLVBTC_ADDRESS || '',
  USDC:   process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
};

export function validateEnvironment(): void {
  const required = [
    "NEXT_PUBLIC_STARKNET_RPC_URL",
    "NEXT_PUBLIC_PHANTOM_POOL_ADDRESS",
    "NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS",
  ];

  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.warn(
      `PHANTOM: Missing environment variables:
${missing.join("\n")}`
    );
  }
}
