/**
 * Wallet Store - Global Zustand store for PHANTOM wallet state
 * 
 * Single source of truth for wallet state across the application.
 * Prevents prop-drilling and keeps wallet state consistent.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { AccountInterface } from "starknet";

// PHANTOM-specific wallet state
export interface WalletState {
  // Raw wallet data (from starknet-react hooks)
  address: string | null;
  account: AccountInterface | null;
  chainId: bigint | null;
  isConnected: boolean;
  isConnecting: boolean;

  // Token balances (fetched separately)
  strkBalance: bigint | null;
  wbtcBalance: bigint | null;
  tbtcBalance: bigint | null;
  usdcBalance: bigint | null;

  // PHANTOM-derived keys (in-memory only - never persisted)
  phantomMasterKeyInitialized: boolean;
  incomingViewingKey: bigint | null;
  fullViewingKey: bigint | null;

  // Network state
  isWrongNetwork: boolean;
  expectedChainId: bigint;

  // Actions
  setWalletConnected: (address: string, account: AccountInterface, chainId: bigint) => void;
  setWalletDisconnected: () => void;
  setBalances: (balances: Partial<Pick<WalletState, "strkBalance" | "wbtcBalance" | "tbtcBalance" | "usdcBalance">>) => void;
  setPhantomKeys: (ivk: bigint, fvk: bigint | null) => void;
  clearPhantomKeys: () => void;
}

// Expected chain ID based on environment
const EXPECTED_CHAIN_ID = BigInt(
  process.env.NEXT_PUBLIC_STARKNET_NETWORK === "mainnet"
    ? "0x534e5f4d41494e"   // SN_MAIN
    : "0x534e5f5345504f4c4941"  // SN_SEPOLIA
);

export const useWalletStore = create<WalletState>()(
  subscribeWithSelector((set, get) => ({
    address: null,
    account: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    strkBalance: null,
    wbtcBalance: null,
    tbtcBalance: null,
    usdcBalance: null,
    phantomMasterKeyInitialized: false,
    incomingViewingKey: null,
    fullViewingKey: null,
    isWrongNetwork: false,
    expectedChainId: EXPECTED_CHAIN_ID,

    setWalletConnected: (address, account, chainId) => {
      const isWrongNetwork = chainId !== EXPECTED_CHAIN_ID;
      set({ 
        address, 
        account, 
        chainId, 
        isConnected: true, 
        isConnecting: false, 
        isWrongNetwork 
      });
    },

    setWalletDisconnected: () => {
      set({
        address: null, 
        account: null, 
        chainId: null,
        isConnected: false, 
        isConnecting: false,
        strkBalance: null, 
        wbtcBalance: null, 
        tbtcBalance: null, 
        usdcBalance: null,
        phantomMasterKeyInitialized: false,
        incomingViewingKey: null,
        fullViewingKey: null,
        isWrongNetwork: false,
      });
    },

    setBalances: (balances) => set(balances),

    setPhantomKeys: (ivk, fvk) => set({
      incomingViewingKey: ivk,
      fullViewingKey: fvk,
      phantomMasterKeyInitialized: true,
    }),

    clearPhantomKeys: () => set({
      incomingViewingKey: null,
      fullViewingKey: null,
      phantomMasterKeyInitialized: false,
    }),
  }))
);
