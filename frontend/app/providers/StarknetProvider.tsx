"use client";

import React from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  useInjectedConnectors,
  voyager,
} from "@starknet-react/core";

// Determine which network to use based on environment
const IS_MAINNET = process.env.NEXT_PUBLIC_STARKNET_NETWORK === "mainnet";
const SUPPORTED_CHAINS = IS_MAINNET ? [mainnet] : [sepolia];

// RPC endpoint - prefer Alchemy/Infura in production
const getProvider = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL;
  if (rpcUrl) {
    return () => ({ nodeUrl: rpcUrl });
  }
  return publicProvider(); // fallback for development
};

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const { connectors } = useInjectedConnectors({
    // These appear even if the wallet is NOT installed
    recommended: [argent(), braavos()],
    // These only appear if installed
    includeRecommended: "onlyIfNoConnectors",
    // Order: installed wallets first
    order: "random",
  });

  return (
    <StarknetConfig
      chains={SUPPORTED_CHAINS}
      provider={getProvider()}
      connectors={connectors}
      explorer={voyager}
      autoConnect={true}
    >
      {children}
    </StarknetConfig>
  );
}
