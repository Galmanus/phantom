// PHANTOM — Real implementation (no mocks)

"use client";

import { useEffect, useCallback } from "react";
import { useAccount, useNetwork } from "@starknet-react/core";
import { useWalletStore } from "@/store/walletStore";

export function useWalletSync() {
  const { address, account, status } = useAccount();
  const { chain } = useNetwork();
  const { setWalletConnected, setWalletDisconnected, setPhantomKeys } = useWalletStore();

  /**
   * Initialize Phantom keys when wallet connects
   * Uses real PBKDF2 key derivation via PhantomKeyManager
   */
  const initializePhantomKeys = useCallback(async (account: any, chainId: string) => {
    if (!account || !address) {
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { PhantomKeyManager } = await import('@/sdk/src/key-derivation');
      const keyManager = await PhantomKeyManager.fromWallet(account);
      
      // Store IVK in walletStore for use by compliance and NoteStore
      setPhantomKeys(keyManager.ivkHex, null);
      
      console.debug('[PHANTOM] Keys initialized successfully');
    } catch (error) {
      // Key init failure is non-fatal — user can retry by reconnecting
      console.warn('[PHANTOM] Key initialization failed (user may have rejected signing):', error);
      setPhantomKeys(null, null);
    }
  }, [address, setPhantomKeys]);

  useEffect(() => {
    if (status === "connected" && address && account && chain) {
      setWalletConnected(address, account, chain.id);
      // After wallet connection: initialize PHANTOM master key
      initializePhantomKeys(account, chain.id.toString());
    } else if (status === "disconnected") {
      setWalletDisconnected();
    }
  }, [status, address, account, chain, setWalletConnected, setWalletDisconnected, initializePhantomKeys]);
}
