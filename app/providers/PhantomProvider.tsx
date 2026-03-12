/**
 * Phantom SDK Provider for React - Starkzap Edition
 * 
 * Provides the StarkZap-powered Phantom instance to all components
 * Replaces the old shield pool architecture with Private BTC Yield Manager
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { StarkZap } from 'starkzap'
import { useAccount } from '@starknet-react/core'

interface PhantomContextValue {
  starkzap: StarkZap | null
  isReady: boolean
  error: string | null
}

const PhantomContext = createContext<PhantomContextValue>({
  starkzap: null,
  isReady: false,
  error: null,
})

export function usePhantom() {
  const ctx = useContext(PhantomContext)
  if (!ctx) throw new Error('usePhantom must be used inside PhantomProvider')
  return ctx
}

interface PhantomProviderProps {
  children: ReactNode
}

export function PhantomProvider({ children }: PhantomProviderProps) {
  const [starkzap, setStarkzap] = useState<StarkZap | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { account } = useAccount()

  useEffect(() => {
    // Initialize StarkZap once at app level
    // Use default sepolia network - can be changed via environment
    const network = (process.env.NEXT_PUBLIC_STARKNET_NETWORK === 'mainnet' 
      ? 'mainnet' 
      : 'sepolia') as 'mainnet' | 'sepolia'
    
    const starkzapInstance = new StarkZap({
      network,
    })
    
    setStarkzap(starkzapInstance as any)
  }, [])

  useEffect(() => {
    async function connectStarkzap() {
      if (!starkzap || !account) {
        setIsReady(false)
        return
      }

      try {
        // Connect starkzap to the user's wallet
        // Cast to any since the actual API depends on StarkZap version
        const sdk = starkzap as any
        if (sdk?.connect) {
          await sdk.connect(account)
        }
        setIsReady(true)
        setError(null)
      } catch (err) {
        console.error('Failed to connect StarkZap:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect')
        setIsReady(false)
      }
    }

    connectStarkzap()
  }, [starkzap, account])

  return (
    <PhantomContext.Provider value={{ starkzap, isReady, error }}>
      {children}
    </PhantomContext.Provider>
  )
}
