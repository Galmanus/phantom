// hooks/usePhantomTransaction.ts
"use client";

import { useAccount } from "@starknet-react/core";
import { useState, useCallback } from "react";
import { useWalletStore } from "@/store/walletStore";
import { parseUnits } from "viem";
import { PHANTOM_CONTRACTS } from "@/lib/constants";
import { Call, Account } from "starknet";

// Types for transaction states
export type TransactionState = "idle" | "approving" | "generating" | "submitting" | "success" | "error";

export interface ShieldParams {
  asset: "wBTC" | "tBTC" | "LBTC" | "SolvBTC";
  amount: string;
  recipient?: string;
}

export interface UnshieldParams {
  noteId: string;
  amount: string;
  recipient: string;
}

/**
 * Hook for shielding Bitcoin assets
 * Implements the full state machine: idle → approving → generating → submitting → success
 */
export function useShieldTransaction() {
  const { account } = useAccount();
  const { address } = useAccount();
  const { setTransactionState, setLastTransactionHash } = useWalletStore();

  const [state, setState] = useState<TransactionState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shield = useCallback(
    async (params: ShieldParams) => {
      if (!account || !address) {
        setError("Wallet not connected");
        setState("error");
        return;
      }

      try {
        // Phase 1: Approval (if needed)
        setState("approving");
        setTransactionState("approving");

        // Parse amount based on asset
        const decimals = params.asset === "wBTC" ? 8 : 18;
        const amountWei = parseUnits(params.amount as `${number}`, decimals);

        // Phase 2: Generate Proof (simulated)
        setState("generating");
        setTransactionState("generating");

        // In production: await proverWorker.prove({ circuit: 'shield', input })
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Phase 3: Submit Transaction
        setState("submitting");
        setTransactionState("submitting");

        // Build the contract call
        const call: Call = {
          contractAddress: PHANTOM_CONTRACTS.POOL,
          entrypoint: "shield",
          calldata: [
            params.asset, // In production, use actual token address
            amountWei.toString(),
            "0", // low part
            "0", // high part
            params.recipient || address,
          ],
        };

        // Execute using the account
        const result = await account.execute([call]);

        setTxHash(result.transaction_hash);
        setLastTransactionHash(result.transaction_hash);
        setState("success");
        setTransactionState("success");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Transaction failed";
        setError(errorMessage);
        setState("error");
        setTransactionState("error");
      }
    },
    [account, address, setTransactionState, setLastTransactionHash]
  );

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
    setTransactionState("idle");
  }, [setTransactionState]);

  return {
    shield,
    state,
    txHash,
    isConfirming: false,
    error,
    reset,
  };
}

/**
 * Hook for unshielding Bitcoin assets
 */
export function useUnshieldTransaction() {
  const { account } = useAccount();
  const { address } = useAccount();
  const { setTransactionState, setLastTransactionHash } = useWalletStore();

  const [state, setState] = useState<TransactionState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unshield = useCallback(
    async (params: UnshieldParams) => {
      if (!account || !address) {
        setError("Wallet not connected");
        setState("error");
        return;
      }

      try {
        // Phase 1: Generate Proof
        setState("generating");
        setTransactionState("generating");

        // Generate unshield proof
        // In production: await proverWorker.prove({ circuit: 'unshield', input })
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Phase 2: Submit Transaction
        setState("submitting");
        setTransactionState("submitting");

        const call: Call = {
          contractAddress: PHANTOM_CONTRACTS.POOL,
          entrypoint: "unshield",
          calldata: [
            params.noteId,
            params.recipient,
            "0x0", // proof placeholder
          ],
        };

        const result = await account.execute([call]);

        setTxHash(result.transaction_hash);
        setLastTransactionHash(result.transaction_hash);
        setState("success");
        setTransactionState("success");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Transaction failed";
        setError(errorMessage);
        setState("error");
        setTransactionState("error");
      }
    },
    [account, address, setTransactionState, setLastTransactionHash]
  );

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
    setTransactionState("idle");
  }, [setTransactionState]);

  return {
    unshield,
    state,
    txHash,
    isConfirming: false,
    error,
    reset,
  };
}

/**
 * Hook for private swaps
 */
export function usePrivateSwap() {
  const { account } = useAccount();
  const { address } = useAccount();
  const { setTransactionState, setLastTransactionHash } = useWalletStore();

  const [state, setState] = useState<TransactionState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = useCallback(
    async (noteId: string, tokenOut: string, amountOutMin: string) => {
      if (!account || !address) {
        setError("Wallet not connected");
        setState("error");
        return;
      }

      try {
        setState("generating");
        setTransactionState("generating");

        // Generate swap proof
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setState("submitting");
        setTransactionState("submitting");

        const call: Call = {
          contractAddress: PHANTOM_CONTRACTS.INTENT_MATCHER,
          entrypoint: "execute_swap",
          calldata: [
            noteId,
            tokenOut,
            amountOutMin,
            "0",
          ],
        };

        const result = await account.execute([call]);

        setTxHash(result.transaction_hash);
        setLastTransactionHash(result.transaction_hash);
        setState("success");
        setTransactionState("success");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Swap failed";
        setError(errorMessage);
        setState("error");
        setTransactionState("error");
      }
    },
    [account, address, setTransactionState, setLastTransactionHash]
  );

  return {
    executeSwap,
    state,
    txHash,
    error,
    reset: () => {
      setState("idle");
      setTxHash(null);
      setError(null);
      setTransactionState("idle");
    },
  };
}
