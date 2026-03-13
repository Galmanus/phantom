'use client'

import React from "react"
import { sepolia, mainnet } from "@starknet-react/chains"
import {
  StarknetConfig,
  publicProvider,
  voyager,
} from "@starknet-react/core"
import { InjectedConnector } from "starknetkit/injected"
import { PhantomProvider } from "./providers/PhantomProvider"

const IS_MAINNET = process.env.NEXT_PUBLIC_STARKNET_NETWORK === "mainnet"
const SUPPORTED_CHAINS = IS_MAINNET ? [mainnet] : [sepolia]

function ProvidersInner({ children }: { children: React.ReactNode }) {
  // Create connectors manually to ensure they work
  const connectors = [
    // Argent X
    new InjectedConnector({
      options: {
        id: "argentx",
        name: "Argent X",
      },
    }),
    // Braavos
    new InjectedConnector({
      options: {
        id: "braavos",
        name: "Braavos",
      },
    }),
  ]

  return (
    <StarknetConfig
      chains={SUPPORTED_CHAINS}
      provider={publicProvider()}
      connectors={connectors}
      explorer={voyager}
      autoConnect={true}
    >
      <PhantomProvider>
        {children}
      </PhantomProvider>
    </StarknetConfig>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProvidersInner>
      {children}
    </ProvidersInner>
  )
}
