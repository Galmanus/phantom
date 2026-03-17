'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePhantomSDK } from '@/hooks/usePhantomSDKReal'
import { useWalletStore } from '@/store/walletStore'
import { parseWalletError } from '@/lib/wallet-errors'
import { WalletConnector } from '@/components/wallet/WalletConnector'
import { formatSatsToBTC } from '@/sdk/src/strategies'
import { AssetId, type ShieldedNote } from '@/sdk/src/types'

const ASSET_LABELS: Record<number, string> = {
  [AssetId.WBTC]: 'WBTC',
  [AssetId.TBTC]: 'tBTC',
  [AssetId.LBTC]: 'LBTC',
  [AssetId.SOLVBTC]: 'SolvBTC',
  [AssetId.STRK]: 'STRK',
  [AssetId.USDC]: 'USDC',
  [AssetId.STRKBTC]: 'STRKBTC',
}

export default function UnshieldPage() {
  const { account, address } = useAccount()
  const { isReady, unshield, getUnspentNotes, isLoading: sdkLoading, error: sdkError } = usePhantomSDK()
  const { setTransactionState } = useWalletStore()

  // Notes state
  const [notes, setNotes] = useState<ShieldedNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [selectedNote, setSelectedNote] = useState<ShieldedNote | null>(null)

  // Unshield form state
  const [recipient, setRecipient] = useState('')
  const [unshieldAmount, setUnshieldAmount] = useState('')
  const [isUnshielding, setIsUnshielding] = useState(false)
  const [unshieldError, setUnshieldError] = useState<string | null>(null)
  const [unshieldSuccess, setUnshieldSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Load unspent notes
  const loadNotes = useCallback(async () => {
    if (!isReady) return
    setIsLoadingNotes(true)
    try {
      const unspentNotes = await getUnspentNotes()
      setNotes(unspentNotes)
    } catch (err) {
      console.error('[Unshield] Failed to load notes:', err)
    } finally {
      setIsLoadingNotes(false)
    }
  }, [isReady, getUnspentNotes])

  useEffect(() => {
    if (isReady) {
      loadNotes()
    }
  }, [isReady, loadNotes])

  // Set default recipient
  useEffect(() => {
    if (address) {
      setRecipient(address)
    }
  }, [address])

  // Parse amount
  const parseUnshieldAmount = useCallback((): bigint | null => {
    const parsed = parseFloat(unshieldAmount)
    if (isNaN(parsed) || parsed <= 0) return null
    return BigInt(Math.floor(parsed * 1e8)) // Assume 8 decimals for display
  }, [unshieldAmount])

  // Handle unshield
  const handleUnshield = async () => {
    if (!account || !isReady || !selectedNote) return

    const amountBigInt = parseUnshieldAmount()
    if (!amountBigInt) {
      setUnshieldError('Enter a valid amount')
      return
    }

    if (!recipient || !recipient.startsWith('0x')) {
      setUnshieldError('Enter a valid Starknet address')
      return
    }

    if (amountBigInt > selectedNote.amount) {
      setUnshieldError('Amount exceeds note balance')
      return
    }

    setIsUnshielding(true)
    setUnshieldError(null)
    setUnshieldSuccess(null)
    setTransactionState('generating')

    try {
      const hash = await unshield(
        selectedNote,
        recipient,
        amountBigInt,
        (step, message) => {
          console.debug(`[Unshield] ${step}: ${message}`)
          if (step === 'fetching_merkle_data' || step === 'computing_nullifier') {
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
      setTxHash(hash)
      setUnshieldSuccess(`Successfully unshielded ${formatSatsToBTC(amountBigInt)} to ${recipient.slice(0, 8)}...`)
      setUnshieldAmount('')
      
      // Refresh notes
      await loadNotes()
      setSelectedNote(null)
    } catch (error) {
      setUnshieldError(parseWalletError(error))
      setTransactionState('error')
    } finally {
      setIsUnshielding(false)
    }
  }

  const canUnshield = account && isReady && selectedNote && recipient && unshieldAmount && parseUnshieldAmount() !== null && !isUnshielding

  // Format note for display
  const formatNote = (note: ShieldedNote) => {
    const assetLabel = ASSET_LABELS[note.assetId] || `Asset ${note.assetId}`
    return `${formatSatsToBTC(note.amount)} ${assetLabel}`
  }

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
                      d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-parchment">Unshield BTC</h1>
              <p className="text-sm text-secondary">Withdraw from privacy pool to wallet</p>
            </div>
          </div>
        </div>

        {/* Wallet Gate */}
        {!account && (
          <div className="bg-panel border border-subtle rounded-2xl p-8 text-center mb-6">
            <p className="text-secondary mb-4">Connect your wallet to unshield BTC</p>
            <WalletConnector />
          </div>
        )}

        {account && (
          <div className="space-y-5">

            {/* Select Note */}
            <div className="bg-panel border border-subtle rounded-2xl p-5">
              <h2 className="text-xs font-mono uppercase tracking-wider text-secondary mb-3">
                Select Shielded Note
              </h2>
              
              {isLoadingNotes ? (
                <div className="text-center py-4">
                  <span className="text-muted animate-pulse">Loading notes...</span>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted text-sm mb-2">No shielded notes found</p>
                  <p className="text-xs text-muted">Shield some BTC first to see it here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map(note => (
                    <button
                      key={note.commitment}
                      onClick={() => setSelectedNote(note)}
                      disabled={isUnshielding}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        selectedNote?.commitment === note.commitment
                          ? 'border-amber/50 bg-amber/5'
                          : 'border-subtle hover:border-subtle-2'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm text-parchment font-medium">
                            {formatNote(note)}
                          </div>
                          <div className="text-xs text-muted font-mono truncate max-w-[200px]">
                            {note.commitment.slice(0, 14)}...{note.commitment.slice(-6)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                            note.status === 'confirmed' 
                              ? 'bg-zk-green/10 text-zk-green'
                              : note.status === 'pending'
                              ? 'bg-amber/10 text-amber'
                              : 'bg-subtle text-muted'
                          }`}>
                            {note.status || 'confirmed'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Unshield Form */}
            {selectedNote && (
              <div className="bg-panel border border-subtle rounded-2xl p-5 space-y-4">
                <h2 className="text-xs font-mono uppercase tracking-wider text-secondary">
                  Unshield Details
                </h2>

                {/* Recipient */}
                <div>
                  <label className="text-xs text-muted block mb-1">Recipient Address</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    disabled={isUnshielding}
                    placeholder="0x..."
                    className="w-full bg-surface border border-subtle rounded-xl px-3 py-2
                               font-mono text-sm text-parchment outline-none
                               focus:border-amber/50 disabled:opacity-50"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-muted block mb-1">
                    Amount (max: {formatSatsToBTC(selectedNote.amount)})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00000000"
                      value={unshieldAmount}
                      onChange={e => setUnshieldAmount(e.target.value)}
                      disabled={isUnshielding}
                      className="w-full bg-surface border border-subtle rounded-xl px-3 py-2 pr-16
                                 font-mono text-lg text-parchment outline-none
                                 focus:border-amber/50 disabled:opacity-50"
                      min="0"
                      step="any"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-amber">
                      BTC
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnshieldAmount(formatSatsToBTC(selectedNote.amount))}
                    disabled={isUnshielding}
                    className="text-xs text-amber hover:underline mt-1 disabled:opacity-50"
                  >
                    Send maximum
                  </button>
                </div>

                {/* Info */}
                <div className="bg-void/50 border border-subtle rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-muted">
                      Unshielding reveals the amount and recipient on-chain. For full privacy, consider keeping funds shielded.
                    </p>
                  </div>
                </div>

                {/* Errors */}
                {unshieldError && (
                  <div className="bg-error/10 border border-error/30 rounded-xl p-3">
                    <p className="text-xs text-error font-mono">{unshieldError}</p>
                  </div>
                )}

                {/* Success */}
                {unshieldSuccess && (
                  <div className="bg-zk-green/10 border border-zk-green/30 rounded-xl p-3">
                    <p className="text-xs text-zk-green font-mono mb-1">{unshieldSuccess}</p>
                    {txHash && (
                      <a
                        href={`https://sepolia.starkscan.co/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zk-green underline"
                      >
                        View on explorer ↗
                      </a>
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

                {/* Unshield Button */}
                <button
                  onClick={handleUnshield}
                  disabled={!canUnshield}
                  className="w-full py-4 rounded-xl font-mono text-sm uppercase tracking-wider
                             transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                             bg-amber text-void font-bold hover:bg-amber/90"
                >
                  {isUnshielding ? 'Unshielding...' : 'Unshield Privately'}
                </button>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
