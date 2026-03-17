'use client'

import { useState, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePhantomSDK } from '@/hooks/usePhantomSDKReal'
import { useWalletStore } from '@/store/walletStore'
import { parseWalletError } from '@/lib/wallet-errors'
import { WalletConnector } from '@/components/wallet/WalletConnector'
import { formatSatsToBTC } from '@/sdk/src/strategies'

// Supported assets for shielding
const SHIELD_ASSETS = [
  { symbol: 'WBTC', label: 'Wrapped Bitcoin', decimals: 8, addressKey: 'wBTC' },
  { symbol: 'TBTC', label: 'tBTC', decimals: 18, addressKey: 'tBTC' },
  { symbol: 'LBTC', label: 'Liquid Bitcoin', decimals: 8, addressKey: 'lBTC' },
  { symbol: 'SOLVBTC', label: 'Solv Bitcoin', decimals: 18, addressKey: 'solvBTC' },
] as const

type ShieldAsset = typeof SHIELD_ASSETS[number]['symbol']

export default function ShieldPage() {
  const { account, address } = useAccount()
  const { isReady, shield, getUnspentNotes, isLoading: sdkLoading, error: sdkError } = usePhantomSDK()
  const { setTransactionState } = useWalletStore()

  // Shield form state
  const [selectedAsset, setSelectedAsset] = useState<ShieldAsset>('WBTC')
  const [shieldAmount, setShieldAmount] = useState('')
  const [isShielding, setIsShielding] = useState(false)
  const [shieldError, setShieldError] = useState<string | null>(null)
  const [shieldSuccess, setShieldSuccess] = useState<string | null>(null)
  const [shieldedNote, setShieldedNote] = useState<string | null>(null)

  // Get token address from env
  const getTokenAddress = useCallback((symbol: ShieldAsset): string => {
    const addresses: Record<ShieldAsset, string> = {
      WBTC: process.env.NEXT_PUBLIC_TOKEN_WBTC || '',
      TBTC: process.env.NEXT_PUBLIC_TOKEN_TBTC || '',
      LBTC: process.env.NEXT_PUBLIC_TOKEN_LBTC || '',
      SOLVBTC: process.env.NEXT_PUBLIC_TOKEN_SOLVBTC || '',
    }
    return addresses[symbol]
  }, [])

  const selectedAssetInfo = SHIELD_ASSETS.find(a => a.symbol === selectedAsset)!

  // Parse amount to bigint
  const parseShieldAmount = useCallback((): bigint | null => {
    const parsed = parseFloat(shieldAmount)
    if (isNaN(parsed) || parsed <= 0) return null
    return BigInt(Math.floor(parsed * 10 ** selectedAssetInfo.decimals))
  }, [shieldAmount, selectedAssetInfo])

  // Handle shield transaction
  const handleShield = async () => {
    if (!account || !isReady || !selectedAsset) return

    const amountBigInt = parseShieldAmount()
    if (!amountBigInt) {
      setShieldError('Enter a valid amount')
      return
    }

    const tokenAddress = getTokenAddress(selectedAsset)
    if (!tokenAddress) {
      setShieldError(`Token address not configured for ${selectedAsset}. Set NEXT_PUBLIC_TOKEN_${selectedAsset}_ADDRESS in .env.local`)
      return
    }

    setIsShielding(true)
    setShieldError(null)
    setShieldSuccess(null)
    setShieldedNote(null)
    setTransactionState('generating')

    try {
      const note = await shield(
        selectedAsset,
        amountBigInt,
        (step, message) => {
          console.debug(`[Shield] ${step}: ${message}`)
          if (step === 'generating_randomness' || step === 'computing_commitment') {
            setTransactionState('generating')
          }
          if (step === 'generating_proof') {
            setTransactionState('generating')
          }
          if (step === 'submitting_transaction') {
            setTransactionState('submitting')
          }
        }
      )

      setTransactionState('success')
      setShieldSuccess(`Successfully shielded ${formatSatsToBTC(amountBigInt)} ${selectedAsset}`)
      setShieldedNote(note.commitment)
      setShieldAmount('')
    } catch (error) {
      setShieldError(parseWalletError(error))
      setTransactionState('error')
    } finally {
      setIsShielding(false)
    }
  }

  // Check if can submit
  const canShield = account && isReady && shieldAmount && parseShieldAmount() !== null && !isShielding

  return (
    <div className="min-h-screen bg-void pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/30
                            flex items-center justify-center">
              <svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-parchment">Shield BTC</h1>
              <p className="text-sm text-secondary">Deposit BTC privately via ZK proofs</p>
            </div>
          </div>
        </div>

        {/* Wallet Gate */}
        {!account && (
          <div className="bg-panel border border-subtle rounded-2xl p-8 text-center mb-6">
            <p className="text-secondary mb-4">Connect your wallet to shield BTC</p>
            <WalletConnector />
          </div>
        )}

        {account && (
          <div className="bg-panel border border-subtle rounded-2xl p-6 space-y-5">

            {/* Asset Selection */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-secondary block mb-2">
                Asset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SHIELD_ASSETS.map(asset => (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset.symbol)}
                    disabled={isShielding}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedAsset === asset.symbol
                        ? 'border-amber/50 bg-amber/5'
                        : 'border-subtle hover:border-subtle-2'
                    } disabled:opacity-50`}
                  >
                    <div className="font-mono text-sm text-parchment font-medium">
                      {asset.symbol}
                    </div>
                    <div className="text-xs text-muted">{asset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-secondary block mb-2">
                Amount
              </label>
              <div className="bg-surface border border-subtle rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.00000000"
                    value={shieldAmount}
                    onChange={e => setShieldAmount(e.target.value)}
                    disabled={isShielding}
                    className="flex-1 bg-transparent text-2xl font-mono text-parchment
                               outline-none placeholder-muted disabled:opacity-50"
                    min="0"
                    step="any"
                  />
                  <span className="text-sm font-mono text-amber">{selectedAsset}</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-void/50 border border-subtle rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-zk-green shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-muted">
                  <p className="text-parchment mb-1">Your funds are protected with:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Zero-knowledge proofs hide amount and recipient</li>
                    <li>• AES-256 encryption for local note storage</li>
                    <li>• PBKDF2-600k derived viewing keys</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Errors */}
            {shieldError && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-3">
                <p className="text-xs text-error font-mono">{shieldError}</p>
              </div>
            )}

            {/* Success */}
            {shieldSuccess && (
              <div className="bg-zk-green/10 border border-zk-green/30 rounded-xl p-3">
                <p className="text-xs text-zk-green font-mono mb-2">{shieldSuccess}</p>
                {shieldedNote && (
                  <div className="text-xs font-mono text-muted break-all">
                    Commitment: {shieldedNote.slice(0, 18)}...{shieldedNote.slice(-8)}
                  </div>
                )}
              </div>
            )}

            {/* SDK not ready */}
            {!isReady && (
              <div className="bg-amber/10 border border-amber/30 rounded-xl p-3">
                <p className="text-xs text-amber font-mono">
                  {sdkError || 'Initializing PHANTOM SDK...'}
                </p>
              </div>
            )}

            {/* Shield Button */}
            <button
              onClick={handleShield}
              disabled={!canShield}
              className="w-full py-4 rounded-xl font-mono text-sm uppercase tracking-wider
                         transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                         bg-amber text-void font-bold hover:bg-amber/90"
            >
              {isShielding ? 'Shielding...' : 'Shield Privately'}
            </button>

            <p className="text-xs text-muted text-center font-mono">
              Transaction will require 2 signatures: approve + shield
            </p>

          </div>
        )}

      </div>
    </div>
  )
}
