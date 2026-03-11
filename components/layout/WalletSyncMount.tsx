// components/layout/WalletSyncMount.tsx
"use client";
import { useWalletSync } from "@/hooks/useWalletSync";

export function WalletSyncMount() {
  useWalletSync();
  return null;
}
