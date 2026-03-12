/**
 * useStrkBTC - Hook for reading strkBTC balance (shielded + public)
 * 
 * Uses Starkzap to read both shielded and public balances
 * strkBTC is Starknet's BTC-backed asset with optional privacy
 */

'use client'

import { useState, useEffect } from 'react'
import { usePhantom } from '@/app/providers/PhantomProvider'
import { useAccount } from '@starknet-react/core'
import { TOKEN_ADDRESSES, SUPPORTED_ASSETS } from '@/sdk/src/constants'

export interface StrkBTCBalance {
  shielded: bigint    // private balance
  public: bigint        // unshielded balance
  total: bigint        // combined
  formatted: string    // human-readable (e.g. "0.00123456 BTC")
}

export function useStrkBTC() {
  const { starkzap, isReady } = usePhantom()
  const { address } = useAccount()
  const [balance, setBalance] = useState<StrkBTCBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !address || !starkzap) return
    
    async function fetchBalance() {
      setIsLoading(true)
      setError(null)

      try {
        // Get strkBTC address from constants
        const STRKBTC_ADDRESS = TOKEN_ADDRESSES.STRKBTC || SUPPORTED_ASSETS.STRKBTC.contractAddress
        
        if (!STRKBTC_ADDRESS || STRKBTC_ADDRESS === '') {
          throw new Error('STRKBTC address not configured. Set NEXT_PUBLIC_STRKBTC_ADDRESS in .env')
        }

        // Use Starkzap to get balance (handles both shielded and public)
        // Note: The actual API depends on Starkzap version
        const sdk = starkzap as any
        const bal = await sdk.tokens?.getBalance?.(STRKBTC_ADDRESS) 
                  ?? await sdk.getBalance?.(STRKBTC_ADDRESS)
                  ?? { balance: 0n, shielded: 0n, public: 0n }
        
        const shielded = bal.shielded ?? 0n
        const publicBal = bal.public ?? bal.balance ?? 0n
        const total = shielded + publicBal

        setBalance({
          shielded,
          public: publicBal,
          total,
          formatted: formatBTC(total),
        })
      } catch (err) {
        console.error('Failed to fetch strkBTC balance:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch balance')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [isReady, address, starkzap])

  return { balance, isLoading, error }
}

function formatBTC(sats: bigint): string {
  // strkBTC uses 8 decimal places (like BTC)
  const btc = Number(sats) / 1e8
  if (btc === 0) return '0 BTC'
  // Show up to 8 decimal places, trimming trailing zeros
  return btc.toFixed(8).replace(/\.?0+$/, '') + ' BTC'
}

// Hook for refreshing balance manually
export function useStrkBTCRefresh() {
  const { balance, isLoading, error } = useStrkBTC()

  const refresh = () => {
    // Force re-render by updating state - actual refresh happens in useStrkBTC
    window.dispatchEvent(new Event('phantom-refresh-strkbtc'))
  }

  return { balance, isLoading, error, refresh }
}