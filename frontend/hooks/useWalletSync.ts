/**
 * Wallet Sync Hook - Bridges starknet-react hooks into Zustand store
 * 
 * This hook syncs the wallet state from starknet-react into our global store.
 * It should be rendered once at the top of the app.
 */

"use client";

import { useEffect } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import { useWalletStore } from "@/store/walletStore";
import { PhantomKeyManager } from "@/lib/phantom-key-derivation";

export function useWalletSync() {
  const { address, account, status } = useAccount();
  const { chain } = useNetwork();
  const { setWalletConnected, setWalletDisconnected, setPhantomKeys } = useWalletStore();

  useEffect(() => {
    if (status === "connected" && address && account && chain) {
      setWalletConnected(address, account, chain.id);
      
      // Initialize PHANTOM master key after wallet connection
      initializePhantomKeys(account, chain.id.toString());
    } else if (status === "disconnected") {
      setWalletDisconnected();
    }
  }, [status, address, account, chain, setWalletConnected, setWalletDisconnected]);
}

async function initializePhantomKeys(
  account: any,
  chainId: string,
): Promise<void> {
  try {
    const keyManager = PhantomKeyManager.fromSignature(
      account.address, // Use address as seed for demo
      chainId
    );
    const ivk = keyManager.getIncomingViewingKey();
    useWalletStore.getState().setPhantomKeys(ivk, null);
  } catch (error) {
    console.warn("[PHANTOM] Key initialization skipped:", error);
  }
}
