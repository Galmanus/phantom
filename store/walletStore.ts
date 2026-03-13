// store/walletStore.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { AccountInterface } from "starknet";

export interface WalletState {
  address: string | null;
  account: AccountInterface | null;
  chainId: bigint | null;
  isConnected: boolean;
  isConnecting: boolean;

  strkBalance: bigint | null;
  wbtcBalance: bigint | null;
  tbtcBalance: bigint | null;
  usdcBalance: bigint | null;

  phantomMasterKeyInitialized: boolean;
  incomingViewingKey: string | null;
  fullViewingKey: string | null;

  isWrongNetwork: boolean;
  expectedChainId: bigint;

  // Transaction state
  transactionState: "idle" | "approving" | "generating" | "submitting" | "success" | "error";
  lastTransactionHash: string | null;

  setWalletConnected: (address: string, account: AccountInterface, chainId: bigint) => void;
  setWalletDisconnected: () => void;
  setBalances: (balances: Partial<Pick<WalletState, "strkBalance" | "wbtcBalance" | "tbtcBalance" | "usdcBalance">>) => void;
  setPhantomKeys: (ivk: string | null, fvk: string | null) => void;
  clearPhantomKeys: () => void;
  setTransactionState: (state: WalletState["transactionState"]) => void;
  setLastTransactionHash: (hash: string | null) => void;
}

const EXPECTED_CHAIN_ID = BigInt(
  process.env.NEXT_PUBLIC_STARKNET_NETWORK === "mainnet"
    ? "0x534e5f4d41494e"
    : "0x534e5f5345504f4c4941"
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
    transactionState: "idle",
    lastTransactionHash: null,

    setWalletConnected: (address, account, chainId) => {
      const isWrongNetwork = chainId !== EXPECTED_CHAIN_ID;
      set({ address, account, chainId, isConnected: true, isConnecting: false, isWrongNetwork });
    },

    setWalletDisconnected: () => {
      set({
        address: null, account: null, chainId: null,
        isConnected: false, isConnecting: false,
        strkBalance: null, wbtcBalance: null, tbtcBalance: null, usdcBalance: null,
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
      phantomMasterKeyInitialized: ivk !== null,
    }),

    clearPhantomKeys: () => set({
      incomingViewingKey: null,
      fullViewingKey: null,
      phantomMasterKeyInitialized: false,
    }),

    setTransactionState: (state) => set({ transactionState: state }),
    setLastTransactionHash: (hash) => set({ lastTransactionHash: hash }),
  }))
);
