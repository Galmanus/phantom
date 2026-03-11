/**
 * Wrong Network Banner - Always visible when connected to wrong chain
 */

"use client";

import { useWalletStore } from "@/store/walletStore";

export function WrongNetworkBanner() {
  const { isConnected, isWrongNetwork } = useWalletStore();

  if (!isConnected || !isWrongNetwork) return null;

  const targetNetwork =
    process.env.NEXT_PUBLIC_STARKNET_NETWORK === "mainnet"
      ? "Starknet Mainnet"
      : "Starknet Sepolia";

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-[--warning]/10 border-b border-[--warning]/30 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[--warning]">
        <span>⚠</span>
        <span className="text-sm">
          You are connected to the wrong network. Please switch to <strong>{targetNetwork}</strong> in your wallet.
        </span>
      </div>
    </div>
  );
}
