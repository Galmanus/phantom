// hooks/usePhantomSDK.ts
// @deprecated — This hook is no longer used. All pages import from usePhantomSDKReal instead.
// Kept for reference only. Do not use in new code.
"use client";

import { useMemo } from "react";
import { useAccount, useProvider } from "@starknet-react/core";
import { PHANTOM_CONTRACTS } from "@/lib/constants";

/**
 * PHANTOM SDK Interface
 * Provides low-level access to PHANTOM contract functions via provider
 */
export interface PhantomSDK {
  // Pool address
  poolAddress: string;
  
  // Compliance oracle address
  complianceAddress: string;
  
  // Intent matcher address
  intentMatcherAddress: string;
  
  // Utility functions
  isReady: boolean;
  
  // Raw provider for custom calls
  provider: ReturnType<typeof useProvider> extends { provider: infer T } ? T : unknown;
}

/**
 * PHANTOM SDK Hook
 * Provides access to PHANTOM contract addresses and utilities
 */
export function usePhantomSDK(): PhantomSDK {
  const { address, status } = useAccount();
  const { provider } = useProvider();

  const sdk = useMemo((): PhantomSDK => {
    return {
      poolAddress: PHANTOM_CONTRACTS.POOL,
      complianceAddress: PHANTOM_CONTRACTS.COMPLIANCE_ORACLE,
      intentMatcherAddress: PHANTOM_CONTRACTS.INTENT_MATCHER,
      isReady: status === "connected" && !!address,
      provider: provider as PhantomSDK["provider"],
    };
  }, [provider, address, status]);

  return sdk;
}

/**
 * Hook to check if PHANTOM is ready to use
 */
export function usePhantomReady() {
  const { address, status } = useAccount();
  return status === "connected" && !!address;
}
