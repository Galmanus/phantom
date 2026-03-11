/**
 * Wallet Sync Mount - Mounts the wallet sync hook globally
 * 
 * This component exists ONLY to mount the wallet sync hook globally.
 * It renders nothing visible.
 */

"use client";

import { useWalletSync } from "@/hooks/useWalletSync";
import { useTokenBalancesSync } from "@/hooks/useTokenBalances";

export function WalletSyncMount() {
  useWalletSync();
  useTokenBalancesSync();
  return null;
}
