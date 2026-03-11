/**
 * Token Balance Hooks - Real ERC-20 balance fetching
 * 
 * Uses starknet-react's useBalance hook.
 */

"use client";

import { useEffect } from "react";
import { useBalance, useAccount } from "@starknet-react/core";
import { useWalletStore } from "@/store/walletStore";
import { PHANTOM_TOKEN_ADDRESSES } from "@/lib/constants";

export function useTokenBalancesSync() {
  const { address } = useAccount();
  const { setBalances } = useWalletStore();

  // Fetch STRK balance
  const { data: strkData } = useBalance({
    address,
    token: PHANTOM_TOKEN_ADDRESSES.STRK,
    watch: true,
  });

  // Fetch wBTC balance
  const { data: wbtcData } = useBalance({
    address,
    token: PHANTOM_TOKEN_ADDRESSES.wBTC,
    watch: true,
  });

  // Fetch tBTC balance
  const { data: tbtcData } = useBalance({
    address,
    token: PHANTOM_TOKEN_ADDRESSES.tBTC,
    watch: true,
  });

  // Fetch USDC balance
  const { data: usdcData } = useBalance({
    address,
    token: PHANTOM_TOKEN_ADDRESSES.USDC,
    watch: true,
  });

  // Sync to Zustand store whenever values change
  useEffect(() => {
    setBalances({
      strkBalance: strkData?.value ?? null,
      wbtcBalance: wbtcData?.value ?? null,
      tbtcBalance: tbtcData?.value ?? null,
      usdcBalance: usdcData?.value ?? null,
    });
  }, [strkData, wbtcData, tbtcData, usdcData, setBalances]);
}
