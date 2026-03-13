'use client'

import { useBalance } from '@starknet-react/core'
import { useAccount } from '@starknet-react/core'

export interface StrkBTCBalance {
  shielded: bigint    // private balance (not readable on-chain without IVK)
  public: bigint      // ERC-20 public balance
  total: bigint
  formatted: string
}

export function useStrkBTC() {
  const { address } = useAccount()

  const strkBtcAddress = process.env.NEXT_PUBLIC_STRKBTC_ADDRESS as `0x${string}` | undefined

  const { data, isLoading, error } = useBalance({
    address,
    token: strkBtcAddress,
    watch: true,
    enabled: !!address && !!strkBtcAddress,
  })

  if (!strkBtcAddress) {
    return {
      balance: null,
      isLoading: false,
      error: 'STRKBTC address not configured. Set NEXT_PUBLIC_STRKBTC_ADDRESS in .env.local',
    }
  }

  const publicBal = data?.value ?? 0n

  const balance: StrkBTCBalance = {
    shielded: 0n,          // shielded balance is not readable from chain
    public: publicBal,
    total: publicBal,
    formatted: formatBTC(publicBal),
  }

  return {
    balance: address ? balance : null,
    isLoading,
    error: error?.message ?? null,
  }
}

function formatBTC(sats: bigint): string {
  const btc = Number(sats) / 1e8
  if (btc === 0) return '0 BTC'
  return btc.toFixed(8).replace(/\.?0+$/, '') + ' BTC'
}

export function useStrkBTCRefresh() {
  return useStrkBTC()
}
