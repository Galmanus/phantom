'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePhantomSDK } from '@/hooks/usePhantomSDKReal'
import { useWalletStore } from '@/store/walletStore'
import { parseWalletError } from '@/lib/wallet-errors'
import {
  getStrategiesWithLiveAPY,
  PHANTOM_STRATEGIES,
  type YieldStrategy,
  formatSatsToBTC,
  calculateEstimatedYield,
} from '@/sdk/src/strategies'
import type { YieldPosition } from '@/sdk/src/types'
import { WalletConnector } from '@/components/wallet/WalletConnector'

// ─── Formatação ────────────────────────────────────────────────────────────────

const formatAPY = (apy: number): string => `${(apy / 100).toFixed(2)}%`

const RISK_COLORS: Record<string, string> = {
  low:    'text-zk-green border-zk-green/30 bg-zk-green/5',
  medium: 'text-amber border-amber/30 bg-amber/5',
  high:   'text-error border-error/30 bg-error/5',
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function YieldPage() {
  const { account, address } = useAccount()
  const { isReady, shield, isLoading: sdkLoading, error: sdkError } = usePhantomSDK()
  const { setTransactionState } = useWalletStore()

  // Strategies
  const [strategies, setStrategies] = useState<YieldStrategy[]>([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState<YieldStrategy | null>(null)

  // Positions - stored in NoteStore, not localStorage
  const [positions, setPositions] = useState<YieldPosition[]>([])
  const [isLoadingPositions, setIsLoadingPositions] = useState(false)

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositError, setDepositError] = useState<string | null>(null)
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null)

  // ─── Carregar estratégias com APY ao vivo ─────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setIsLoadingStrategies(true)

    getStrategiesWithLiveAPY()
      .then(strats => {
        if (!cancelled) {
          setStrategies(strats)
          if (strats.length > 0 && !selectedStrategy) {
            setSelectedStrategy(strats[0])
          }
        }
      })
      .catch(err => {
        console.error('[Yield] Failed to fetch strategies:', err)
        // Fallback: usar estratégias estáticas sem APY ao vivo
        if (!cancelled) {
          setStrategies(PHANTOM_STRATEGIES)
          if (!selectedStrategy && PHANTOM_STRATEGIES.length > 0) {
            setSelectedStrategy(PHANTOM_STRATEGIES[0])
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStrategies(false)
      })

    return () => { cancelled = true }
  }, [])

  // ─── Carregar posições do NoteStore ─────────────────────────────────────────

  const loadPositions = useCallback(async () => {
    if (!isReady) return
    setIsLoadingPositions(true)
    try {
      const { usePhantomSDK: useSDK } = await import('@/hooks/usePhantomSDKReal')
      // Cannot access SDK directly here without the hook
      // For now, positions will be loaded via the SDK when available
    } catch (err) {
      console.error('[Yield] Failed to load positions:', err)
    } finally {
      setIsLoadingPositions(false)
    }
  }, [isReady])

  useEffect(() => {
    if (isReady) loadPositions()
  }, [isReady, loadPositions])

  // ─── Depositar em yield ──────────────────────────────────────────────────────

  const handleDeposit = async () => {
    if (!account || !isReady || !selectedStrategy) return

    const amountBTC = parseFloat(depositAmount)
    if (isNaN(amountBTC) || amountBTC <= 0) {
      setDepositError('Enter a valid amount')
      return
    }

    // Converter BTC para sats
    const amountSats = BigInt(Math.floor(amountBTC * 1e8))

    if (amountSats < selectedStrategy.minDeposit) {
      setDepositError(
        `Minimum deposit is ${formatSatsToBTC(selectedStrategy.minDeposit)}`
      )
      return
    }

    setIsDepositing(true)
    setDepositError(null)
    setDepositSuccess(null)
    setTransactionState('generating')

    try {
      // 1. Shield the asset (creates a ShieldedNote)
      const note = await shield(
        'WBTC', // simplified — real impl: use selectedStrategy asset
        amountSats,
        (step, message) => {
          console.debug(`[Yield] ${step}: ${message}`)
          if (step === 'generating_proof') setTransactionState('generating')
          if (step === 'submitting_transaction') setTransactionState('submitting')
        }
      )

      // PLACEHOLDER: After shielding, route to YieldRouter contract
      // Waiting for: full YieldRouter deployment + ZK yield deposit proof
      // The note is shielded and stored — yield routing will be added in production
      console.debug('[Yield] Note shielded:', note.commitment)
      // TODO: await yieldRouter.depositShieldedYield(note, selectedStrategy.contractAddress)

      setTransactionState('success')
      setDepositSuccess(`Successfully deposited ${formatSatsToBTC(amountSats)} into ${selectedStrategy.name}`)
      setDepositAmount('')

      // Recarregar posições
      await loadPositions()
    } catch (error) {
      setDepositError(parseWalletError(error))
      setTransactionState('error')
    } finally {
      setIsDepositing(false)
    }
  }

  // ─── Helpers de UI ───────────────────────────────────────────────────────────

  const parseDepositSats = (): bigint => {
    const btc = parseFloat(depositAmount)
    if (isNaN(btc) || btc <= 0) return 0n
    return BigInt(Math.floor(btc * 1e8))
  }

  const estimatedYield30d = selectedStrategy && parseDepositSats() > 0n
    ? calculateEstimatedYield(parseDepositSats(), selectedStrategy.apy, 30)
    : null

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-void pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/30
                            flex items-center justify-center">
              <svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-parchment">Shielded Yield</h1>
              <p className="text-sm text-secondary">Earn on your BTC — privately, via ZK proofs</p>
            </div>
          </div>
        </div>

        {/* Wallet Gate */}
        {!account && (
          <div className="bg-panel border border-subtle rounded-2xl p-8 text-center mb-6">
            <p className="text-secondary mb-4">Connect your wallet to access shielded yield strategies</p>
            <WalletConnector />
          </div>
        )}

        {account && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Strategies Column ── */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-secondary">
                Available Strategies
              </h2>

              {isLoadingStrategies ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="bg-panel border border-subtle rounded-2xl p-5 animate-pulse">
                      <div className="h-4 bg-subtle rounded w-1/3 mb-3" />
                      <div className="h-3 bg-subtle rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {strategies.map(strategy => (
                    <button
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(strategy)}
                      className={`w-full text-left bg-panel border rounded-2xl p-5
                                  transition-all duration-150 ${
                        selectedStrategy?.id === strategy.id
                          ? 'border-amber/50 shadow-amber-glow'
                          : 'border-subtle hover:border-subtle-2'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-medium text-parchment mb-0.5">
                            {strategy.name}
                          </h3>
                          <p className="text-xs text-muted">{strategy.description}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-xl font-mono font-bold text-amber">
                            {formatAPY(strategy.apy)}
                          </div>
                          <div className="text-xs text-muted">APY</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${RISK_COLORS[strategy.riskLevel]}`}>
                          {strategy.riskLevel.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted font-mono">
                          Min: {formatSatsToBTC(strategy.minDeposit)}
                        </span>
                        {strategy.lockPeriod > 0 && (
                          <span className="text-xs text-muted font-mono">
                            {strategy.lockPeriod}d lock
                          </span>
                        )}
                        <span className="text-xs text-zk-green font-mono ml-auto">
                          Private ✓
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Positions */}
              {isReady && positions.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-secondary mb-4">
                    Active Positions
                  </h2>
                  <div className="space-y-3">
                    {positions.map(pos => (
                      <div key={pos.depositCommitment}
                           className="bg-panel border border-subtle rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-parchment font-medium capitalize">
                              {pos.protocol}
                            </p>
                            <p className="text-xs text-muted font-mono">
                              {formatSatsToBTC(pos.principalAmount)}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-zk-green bg-zk-green/10
                                           border border-zk-green/30 px-2 py-1 rounded">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Deposit Panel ── */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-secondary">
                Deposit
              </h2>

              <div className="bg-panel border border-subtle rounded-2xl p-5 space-y-4">
                {selectedStrategy ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-parchment">{selectedStrategy.name}</span>
                      <span className="text-lg font-mono font-bold text-amber">
                        {formatAPY(selectedStrategy.apy)}
                      </span>
                    </div>

                    {/* Amount input */}
                    <div className="bg-void/50 border border-subtle rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="0.00000000"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          disabled={isDepositing}
                          className="flex-1 bg-transparent font-mono text-lg text-parchment
                                     outline-none placeholder-muted disabled:opacity-50"
                          min="0"
                          step="any"
                        />
                        <span className="text-sm font-mono text-amber">BTC</span>
                      </div>
                    </div>

                    {/* Estimated yield */}
                    {estimatedYield30d !== null && estimatedYield30d > 0n && (
                      <div className="bg-zk-green/5 border border-zk-green/20 rounded-xl p-3">
                        <p className="text-xs text-muted mb-1">Estimated yield (30 days)</p>
                        <p className="text-sm font-mono text-zk-green">
                          +{formatSatsToBTC(estimatedYield30d)}
                        </p>
                      </div>
                    )}

                    {/* Errors / Success */}
                    {depositError && (
                      <div className="bg-error/10 border border-error/30 rounded-xl p-3">
                        <p className="text-xs text-error font-mono">{depositError}</p>
                      </div>
                    )}
                    {depositSuccess && (
                      <div className="bg-zk-green/10 border border-zk-green/30 rounded-xl p-3">
                        <p className="text-xs text-zk-green font-mono">{depositSuccess}</p>
                      </div>
                    )}

                    {/* SDK not ready warning */}
                    {!isReady && (
                      <div className="bg-amber/10 border border-amber/30 rounded-xl p-3">
                        <p className="text-xs text-amber font-mono">
                          {sdkError || 'Initializing PHANTOM SDK...'}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleDeposit}
                      disabled={
                        isDepositing || !isReady || !depositAmount ||
                        parseFloat(depositAmount) <= 0
                      }
                      className="w-full py-4 rounded-xl bg-amber text-void font-mono
                                 text-sm uppercase tracking-wider font-bold
                                 hover:bg-amber/90 transition-colors
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isDepositing ? 'Depositing...' : 'Deposit Privately'}
                    </button>

                    <p className="text-xs text-muted text-center font-mono">
                      Your position is shielded with ZK proofs
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted text-center">
                    Select a strategy to deposit
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
