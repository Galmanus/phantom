// components/wallet/WrongNetworkBanner.tsx
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
    <div className="fixed top-16 left-0 right-0 z-40 bg-error/90 text-white px-4 py-3 text-center text-sm">
      <span className="mr-2">⚠</span>
      <span>
        You are connected to the wrong network.
        Please switch to <strong>{targetNetwork}</strong> in your wallet.
      </span>
    </div>
  );
}
