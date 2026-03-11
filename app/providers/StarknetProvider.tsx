// app/providers/StarknetProvider.tsx
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

const IS_MAINNET = process.env.NEXT_PUBLIC_STARKNET_NETWORK === "mainnet";
const SUPPORTED_CHAINS = IS_MAINNET ? [mainnet] : [sepolia];

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: "onlyIfNoConnectors",
    order: "random",
  });

  return (
    <StarknetConfig
      chains={SUPPORTED_CHAINS}
      provider={publicProvider()}
      connectors={connectors}
      explorer={voyager}
      autoConnect={true}
    >
      {children}
    </StarknetConfig>
  );
}
