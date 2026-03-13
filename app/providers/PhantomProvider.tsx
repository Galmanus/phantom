'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount } from '@starknet-react/core'
import type { AccountInterface } from 'starknet'

interface PhantomContextValue {
  isReady: boolean
  error: string | null
  account: AccountInterface | undefined
  address: string | null
}

const PhantomContext = createContext<PhantomContextValue>({
  isReady: false,
  error: null,
  account: undefined,
  address: null,
})

export function usePhantom() {
  const ctx = useContext(PhantomContext)
  if (!ctx) throw new Error('usePhantom must be used inside PhantomProvider')
  return ctx
}

export function PhantomProvider({ children }: { children: ReactNode }) {
  const { account, address, status } = useAccount()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'connected' && account && address) {
      setIsReady(true)
      setError(null)
    } else if (status === 'disconnected') {
      setIsReady(false)
    }
  }, [status, account, address])

  return (
    <PhantomContext.Provider value={{ isReady, error, account, address: address ?? null }}>
      {children}
    </PhantomContext.Provider>
  )
}
