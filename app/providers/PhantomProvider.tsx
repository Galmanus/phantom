/**
 * Phantom SDK Provider for React
 * 
 * Provides the PhantomSDK instance to all components
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount } from '@starknet-react/core'
import { PhantomSDK } from '@/sdk/src/PhantomSDK'
import type { PhantomSDKConfig } from '@/sdk/src/types'

interface PhantomContextValue {
  sdk: PhantomSDK | null
  isInitialized: boolean
  error: string | null
}

const PhantomContext = createContext<PhantomContextValue>({
  sdk: null,
  isInitialized: false,
  error: null,
})

export function usePhantomSDK() {
  return useContext(PhantomContext)
}

interface PhantomProviderProps {
  children: ReactNode
  config: PhantomSDKConfig
}

export function PhantomProvider({ children, config }: PhantomProviderProps) {
  const [sdk, setSdk] = useState<PhantomSDK | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { account } = useAccount()

  useEffect(() => {
    async function initSDK() {
      if (!account) {
        setError('No account connected')
        return
      }

      try {
        const phantomConfig: PhantomSDKConfig = {
          ...config,
          account,
        }

        const phantomSdk = new PhantomSDK(phantomConfig)
        await phantomSdk.initialize()
        
        setSdk(phantomSdk)
        setIsInitialized(true)
        setError(null)
      } catch (err) {
        console.error('Failed to initialize Phantom SDK:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize SDK')
      }
    }

    initSDK()
  }, [account, config])

  return (
    <PhantomContext.Provider value={{ sdk, isInitialized, error }}>
      {children}
    </PhantomContext.Provider>
  )
}
