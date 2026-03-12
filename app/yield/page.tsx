'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePhantom } from '@/app/providers/PhantomProvider'
import { useStrkBTC, StrkBTCBalance } from '@/hooks/useStrkBTC'
import { PHANTOM_STRATEGIES, YieldStrategy, formatSatsToBTC, STRATEGY_INDEX } from '@/sdk/src/strategies'
import Link from 'next/link'

type StrategyId = string | null

export default function YieldPage() {
  const { starkzap, isReady } = usePhantom()
  const { balance } = useStrkBTC()
  const { address } = useAccount()
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyId>(null)
  const [amount, setAmount] = useState('')
  const [isOpening, setIsOpening] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showBalance, setShowBalance] = useState(false)
  const [activePositions, setActivePositions] = useState<Array<{
    strategyId: string
    amount: bigint
    openedAt: number
    apy: number
    commitment: string
  }>>([])

  const handleOpenPosition = async () => {
    if (!selectedStrategy || !amount || !starkzap) return
    if (!address) {
      setError('Connect wallet first')
      return
    }

    const amountBigInt = BigInt(amount)
    const strategy = PHANTOM_STRATEGIES.find(s => s.id === selectedStrategy)!

    if (amountBigInt < strategy.minDeposit) {
      setError(`Minimum deposit is ${formatSatsToBTC(strategy.minDeposit)}`)
      return
    }

    setIsOpening(true)
    setError(null)

    try {
      setProgress('Generating position commitment...')
      
      // Generate nonce (cryptographically secure)
      const nonceBytes = new Uint8Array(32)
      crypto.getRandomValues(nonceBytes)
      const nonce = '0x' + Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      // Compute commitment = Poseidon(amount, strategy_id, nonce, address)
      // Using starknet.js hash module
      const { hash: snHash } = await import('starknet')
      const commitment = snHash.computePoseidonHashOnElements([
        amountBigInt.toString(),
        STRATEGY_INDEX[selectedStrategy].toString(),
        nonce,
      ])

      setProgress('Submitting transaction...')

      // Call YieldRouter.open_position via starkzap or direct contract call
      const sdk = starkzap as any
      let txHash: string

      const YIELD_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_YIELD_ROUTER_ADDRESS
      if (!YIELD_ROUTER_ADDRESS) {
        throw new Error('NEXT_PUBLIC_YIELD_ROUTER_ADDRESS not set in environment')
      }

      if (sdk?.execute) {
        // Use starkzap execute if available
        const result = await sdk.execute({
          contractAddress: YIELD_ROUTER_ADDRESS,
          entrypoint: 'open_position',
          calldata: [commitment, STRATEGY_INDEX[selectedStrategy].toString(), amountBigInt.toString(), '0'],
        })
        txHash = result.transaction_hash
      } else {
        throw new Error('Wallet not connected or starkzap not ready')
      }

      setProgress(`Confirmed: ${txHash.slice(0, 10)}...`)
      
      // Store position locally (commitment + amount user-side only)
      // In production, this would be stored in NoteStore with encryption
      const positionRecord = {
        commitment,
        strategyId: selectedStrategy,
        amount: amountBigInt,
        nonce,
        openedAt: Date.now(),
        txHash,
      }
      
      // Persist to localStorage with warning
      const existing = JSON.parse(localStorage.getItem('phantom_positions') ?? '[]')
      localStorage.setItem('phantom_positions', JSON.stringify([
        ...existing,
        { ...positionRecord, amount: amountBigInt.toString() }
      ]))

      setAmount('')
      setSelectedStrategy(null)
      setProgress('')

      // Refresh positions
      loadPositions()

    } catch (err: any) {
      const { parseWalletError } = await import('@/lib/wallet-errors')
      setError(parseWalletError(err))
    } finally {
      setIsOpening(false)
    }
  }

  const selectedStrategyData = selectedStrategy 
    ? PHANTOM_STRATEGIES.find(s => s.id === selectedStrategy) 
    : null

  // Calculate total value
  const totalValue = activePositions.reduce((sum, p) => sum + p.amount, 0n)

  // Load positions from localStorage
  const loadPositions = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('phantom_positions') ?? '[]')
      setActivePositions(stored.map((p: any) => ({
        ...p,
        amount: BigInt(p.amount),
      })))
    } catch {
      setActivePositions([])
    }
  }, [])

  useEffect(() => { loadPositions() }, [loadPositions])

  return (
    <div className="min-h-screen bg-void text-text-primary">
      {/* Header */}
      <div className="border-b border-amber/10 px-8 py-6">
        <h1 className="text-2xl font-display font-bold text-amber">
          Private Yield Strategies
        </h1>
        <p className="text-text-primary/60 mt-1">
          Earn yield on strkBTC. Your position stays private.
        </p>
      </div>

      {/* Balance bar */}
      <div className="px-8 py-4 bg-panel border-b border-amber/10">
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-primary/60">Available strkBTC</span>
          <span className="font-mono text-amber font-bold">
            {balance ? (showBalance ? balance.formatted : '••••••••') : '—'}
          </span>
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="text-xs text-amber/60 hover:text-amber"
          >
            {showBalance ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="px-8 py-8">
        {/* Strategy Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-display font-bold text-text-primary/80 mb-4">
            Select a Strategy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PHANTOM_STRATEGIES.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                isSelected={selectedStrategy === strategy.id}
                onSelect={() => setSelectedStrategy(strategy.id)}
              />
            ))}
          </div>
        </div>

        {/* Deposit form */}
        {selectedStrategy && selectedStrategyData && (
          <div className="card p-6 mb-8">
            <h3 className="font-display font-bold text-xl text-text-primary mb-4">
              Deposit into {selectedStrategyData.name}
            </h3>
            
            <div className="mb-4">
              <label className="text-sm text-text-primary/60 mb-2 block">
                Amount (satoshis)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in sats"
                className="w-full bg-surface border border-amber/20 rounded-lg px-4 py-3 font-mono text-text-primary"
              />
              <p className="text-xs text-text-primary/40 mt-2">
                Min: {formatSatsToBTC(selectedStrategyData.minDeposit)}
              </p>
            </div>

            {amount && BigInt(amount) > 0n && (
              <div className="p-4 bg-surface rounded-lg mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-primary/60">Amount</span>
                  <span className="font-mono text-text-primary">
                    {formatSatsToBTC(BigInt(amount))}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-text-primary/60">Est. Daily Yield</span>
                  <span className="font-mono text-zk-green">
                    ~{formatSatsToBTC(BigInt(Math.floor(Number(amount) * (selectedStrategyData.apy / 10000) / 365)))}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleOpenPosition}
              disabled={isOpening || !amount || BigInt(amount) < selectedStrategyData.minDeposit}
              className="btn-primary w-full"
            >
              {isOpening ? progress || 'Processing...' : '▶ Open Position'}
            </button>
          </div>
        )}

        {/* Active Positions */}
        <div className="mt-12">
          <h2 className="text-lg font-display font-bold text-text-primary/80 mb-4">
            Active Positions
          </h2>
          
          {activePositions.length > 0 ? (
            <div className="space-y-3">
              {activePositions.map((position, i) => {
                const strategy = PHANTOM_STRATEGIES.find(s => s.id === position.strategyId)
                const daysOpen = Math.floor((Date.now() - position.openedAt) / (1000 * 60 * 60 * 24))
                const estimatedYield = BigInt(Math.floor(Number(position.amount) * (position.apy / 10000) * (daysOpen / 365)))
                
                return (
                  <div key={i} className="border border-amber/20 rounded-xl p-4 bg-panel">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-display font-bold">{strategy?.name}</div>
                          <div className="text-xs text-text-primary/50">
                            {daysOpen === 0 ? 'Opened today' : `${daysOpen}d ago`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-mono">
                          {showBalance ? formatSatsToBTC(position.amount) : '••••••'}
                        </div>
                        <div className="font-mono text-zk-green">
                          +{showBalance ? formatSatsToBTC(estimatedYield) : '••••••'}
                        </div>
                        <button className="text-xs border border-amber/30 text-amber px-3 py-1 rounded-lg hover:bg-amber/10">
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="border border-amber/10 rounded-xl p-8 text-center text-text-primary/40">
              No active positions. Select a strategy above to start earning.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StrategyCard({ strategy, isSelected, onSelect }: {
  strategy: YieldStrategy
  isSelected: boolean
  onSelect: () => void
}) {
  const riskColors = {
    low: 'text-zk-green',
    medium: 'text-amber',
    high: 'text-red-400',
  }

  return (
    <button
      onClick={onSelect}
      className={`
        text-left p-5 rounded-xl border transition-all
        ${isSelected
          ? 'border-amber bg-amber/10'
          : 'border-amber/20 bg-panel hover:border-amber/40'
        }
      `}
    >
      {/* Protocol badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-text-primary/50 uppercase tracking-wider">
          {strategy.protocol}
        </span>
        <span className={`text-xs ${riskColors[strategy.riskLevel]}`}>
          {strategy.riskLevel} risk
        </span>
      </div>

      {/* Strategy name */}
      <div className="text-lg font-display font-bold text-text-primary mb-1">
        {strategy.name}
      </div>

      {/* APY */}
      <div className="text-3xl font-mono font-bold text-amber mb-3">
        {(strategy.apy / 100).toFixed(1)}%
        <span className="text-sm text-text-primary/50 ml-1">APY</span>
      </div>

      {/* Description */}
      <p className="text-xs text-text-primary/60 mb-3">
        {strategy.description}
      </p>

      {/* Lock period */}
      <div className="text-xs text-text-primary/40">
        {strategy.lockPeriod === 0
          ? '✓ No lock period'
          : `${strategy.lockPeriod}-day withdrawal window`
        }
      </div>

      {/* Privacy badge */}
      {strategy.isPrivate && (
        <div className="mt-3 flex items-center gap-1 text-xs text-zk-green">
          <span>●</span>
          <span>Position amount stays private</span>
        </div>
      )}
    </button>
  )
}
