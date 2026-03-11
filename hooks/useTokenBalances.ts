// hooks/useTokenBalances.ts
"use client";

import { useBalance } from "@starknet-react/core";
import { useAccount } from "@starknet-react/core";
import { useEffect } from "react";
import { useWalletStore } from "@/store/walletStore";

// Token contract addresses
const TOKEN_ADDRESSES = {
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as const,
  wBTC: "0x142a5f4901a1e6d0d65b9f0c4c7d2f8b9c8e1d2a3f5c8d7e9f1a2b3c4d5e6f7a" as const,
  USDC: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" as const,
};

export function useTokenBalancesSync() {
  const { address } = useAccount();
  const { setBalances } = useWalletStore();

  const { data: strkData } = useBalance({
    address,
    token: TOKEN_ADDRESSES.STRK,
    watch: true,
  });

  const { data: wbtcData } = useBalance({
    address,
    token: TOKEN_ADDRESSES.wBTC,
    watch: true,
  });

  const { data: usdcData } = useBalance({
    address,
    token: TOKEN_ADDRESSES.USDC,
    watch: true,
  });

  useEffect(() => {
    setBalances({
      strkBalance: strkData?.value ?? null,
      wbtcBalance: wbtcData?.value ?? null,
      usdcBalance: usdcData?.value ?? null,
    });
  }, [strkData, wbtcData, usdcData, setBalances]);
}
