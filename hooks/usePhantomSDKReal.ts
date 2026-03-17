/**
 * PHANTOM SDK Hook - Real integration
 * 
 * This hook provides access to the PHANTOM SDK functionality
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'

// Import SDK directly from local path
import { PhantomSDK } from '@/sdk/src/PhantomSDK'
import type { ShieldedNote, YieldPosition, IntentReceipt, ComplianceProof } from '@/sdk/src/types'

export interface UsePhantomSDKOptions {
  /** Override RPC URL */
  rpcUrl?: string
  /** Custom storage password for note encryption */
  storagePassword?: string
}

export interface UsePhantomSDKResult {
  /** SDK instance */
  sdk: PhantomSDK | null
  /** Whether SDK is initialized */
  isReady: boolean
  /** Error if initialization failed */
  error: string | null
  /** Shield funds (deposit) - returns ShieldedNote */
  shield: (asset: string, amount: bigint, onProgress?: (step: string, message: string) => void) => Promise<ShieldedNote>
  /** Unshield funds (withdraw) - returns tx hash */
  unshield: (note: ShieldedNote, recipient: string, amount: bigint, onProgress?: (step: string, message: string) => void) => Promise<string>
  /** Get all shielded notes */
  getNotes: () => Promise<ShieldedNote[]>
  /** Get unspent shielded notes */
  getUnspentNotes: () => Promise<ShieldedNote[]>
  /** Get active yield positions */
  getActiveYieldPositions: () => Promise<YieldPosition[]>
  /** Get shielded balance for asset */
  getShieldedBalance: (assetId: number) => Promise<bigint>
  /** Execute private swap */
  privateSwap: (inputNote: ShieldedNote, outputAsset: string, minOutput: bigint) => Promise<IntentReceipt>
  /** Deposit to yield protocol */
  depositYield: (note: ShieldedNote, protocol: 'vesu' | 'uncap' | 'opus', onProgress?: (step: string, message: string) => void) => Promise<YieldPosition>
  /** Withdraw from yield */
  withdrawYield: (position: YieldPosition) => Promise<{ txHash: string }>
  /** Generate compliance proof */
  generateComplianceProof: (notes: ShieldedNote[], scope: string) => Promise<ComplianceProof>
  /** Loading state */
  isLoading: boolean
}

export function usePhantomSDK(options: UsePhantomSDKOptions = {}): UsePhantomSDKResult {
  const { rpcUrl, storagePassword } = options
  const { account, address } = useAccount()
  
  const [sdk, setSdk] = useState<PhantomSDK | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize SDK when account is available
  useEffect(() => {
    if (!account || !address) {
      setSdk(null)
      setIsReady(false)
      return
    }

    async function initSDK() {
      try {
        setError(null)
        
        const phantomConfig = {
          rpcUrl: rpcUrl || process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://starknet-sepolia.public.blastapi.io',
          account,
          storagePassword: storagePassword || 'phantom-shielded-notes',
        }

        const phantomSdk = new PhantomSDK(phantomConfig)
        await phantomSdk.initialize()
        
        setSdk(phantomSdk)
        setIsReady(true)
      } catch (err) {
        console.error('Failed to initialize Phantom SDK:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize SDK')
        setSdk(null)
        setIsReady(false)
      }
    }

    initSDK()
  }, [account, address, rpcUrl, storagePassword])

  // Shield function
  const shield = useCallback(async (
    asset: string, 
    amount: bigint,
    onProgress?: (step: string, message: string) => void
  ) => {
    if (!sdk || !isReady) {
      throw new Error('SDK not ready')
    }
    
    setIsLoading(true)
    try {
      const note = await sdk.shield({ asset, amount, onProgress })
      return note
    } finally {
      setIsLoading(false)
    }
  }, [sdk, isReady])

  // Unshield function
  const unshield = useCallback(async (
    note: ShieldedNote, 
    recipient: string, 
    amount: bigint,
    onProgress?: (step: string, message: string) => void
  ) => {
    if (!sdk || !isReady) {
      throw new Error('SDK not ready')
    }
    
    setIsLoading(true)
    try {
      const txHash = await sdk.unshield({ note, recipient, amount, onProgress })
      return txHash
    } finally {
      setIsLoading(false)
    }
  }, [sdk, isReady])

  // Get notes - using SDK method
  const getNotes = useCallback(async (): Promise<ShieldedNote[]> => {
    if (!sdk || !isReady) {
      return []
    }
    
    // Use SDK's getAllNotes method
    const notes = await sdk.getAllNotes()
    return notes
  }, [sdk, isReady])

  // Get active yield positions
  const getActiveYieldPositions = useCallback(async (): Promise<YieldPosition[]> => {
    if (!sdk || !isReady) {
      return []
    }
    return sdk.getActiveYieldPositions()
  }, [sdk, isReady])

  // Get unspent notes
  const getUnspentNotes = useCallback(async (): Promise<ShieldedNote[]> => {
    if (!sdk || !isReady) {
      return []
    }
    return sdk.getUnspentNotes()
  }, [sdk, isReady])

  // Get shielded balance
  const getShieldedBalance = useCallback(async (assetId: number): Promise<bigint> => {
    const notes = await getNotes()
    return notes
      .filter(n => n.assetId === assetId && !n.spent)
      .reduce((sum, n) => sum + n.amount, 0n)
  }, [getNotes])

  // Private swap - placeholder
  const privateSwap = useCallback(async (
    _inputNote: ShieldedNote,
    _outputAsset: string,
    _minOutput: bigint
  ): Promise<IntentReceipt> => {
    throw new Error('Private swap not yet implemented')
  }, [])

  // Deposit to yield protocol
  const depositYield = useCallback(async (
    note: ShieldedNote,
    protocol: 'vesu' | 'uncap' | 'opus',
    onProgress?: (step: string, message: string) => void
  ): Promise<YieldPosition> => {
    if (!sdk || !isReady) {
      throw new Error('SDK not ready')
    }
    
    setIsLoading(true)
    try {
      const position = await sdk.depositShieldedYield({ note, protocol, onProgress })
      return position
    } finally {
      setIsLoading(false)
    }
  }, [sdk, isReady])

  // Withdraw yield - placeholder
  const withdrawYield = useCallback(async (_position: YieldPosition): Promise<{ txHash: string }> => {
    throw new Error('Yield not yet implemented')
  }, [])

  // Generate compliance proof - placeholder
  const generateComplianceProof = useCallback(async (
    _notes: ShieldedNote[],
    _scope: string
  ): Promise<ComplianceProof> => {
    throw new Error('Compliance not yet implemented')
  }, [])

  return useMemo(() => ({
    sdk,
    isReady,
    error,
    shield,
    unshield,
    getNotes,
    getUnspentNotes,
    getActiveYieldPositions,
    getShieldedBalance,
    privateSwap,
    depositYield,
    withdrawYield,
    generateComplianceProof,
    isLoading,
  }), [
    sdk,
    isReady,
    error,
    shield,
    unshield,
    getNotes,
    getUnspentNotes,
    getActiveYieldPositions,
    getShieldedBalance,
    privateSwap,
    depositYield,
    withdrawYield,
    generateComplianceProof,
    isLoading,
  ])
}

/**
 * Hook to check if PHANTOM is ready
 */
export function usePhantomReady() {
  const { isReady } = usePhantomSDK()
  return isReady
}
