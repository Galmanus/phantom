'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import { useStrkBTC, StrkBTCBalance } from '@/hooks/useStrkBTC'
import { PHANTOM_STRATEGIES, YieldStrategy, formatSatsToBTC, STRATEGY_INDEX } from '@/sdk/src/strategies'
import { PhantomSDK } from '@/sdk/src/PhantomSDK'
import Link from 'next/link'

type StrategyId = string | null

export default function YieldPage() {
  const { balance } = useStrkBTC()
  const { account, address } = useAccount()
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
    if (!selectedStrategy || !amount || !account) return

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e8)) // Convert to sats
    const strategy = PHANTOM_STRATEGIES.find(s => s.id === selectedStrategy)!

    if (amountBigInt < strategy.minDeposit) {
      setError(`Minimum deposit is ${formatSatsToBTC(strategy.minDeposit)}`)
      return
    }

    setIsOpening(true)
    setError(null)

    try {
      const sdk = new PhantomSDK({
        rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL!,
        account,
        storagePassword: 'phantom-yield-notes',
      })
      await sdk.initialize()

      setProgress('Creating shield commitment...')

      // Shield first, then route to yield
      const note = await sdk.shield({
        asset: 'STRKBTC',
        amount: amountBigInt,
        onProgress: (step, msg) => setProgress(msg),
      })

      setProgress('Routing to yield protocol...')

      // Call YieldRouter contract
      const yieldRouterAddress = process.env.NEXT_PUBLIC_YIELD_ROUTER_ADDRESS
      if (!yieldRouterAddress) {
        throw new Error('YIELD_ROUTER_ADDRESS not configured in .env.local')
      }

      const strategyIndex = STRATEGY_INDEX[selectedStrategy] ?? 0
      const result = await account.execute([{
        contractAddress: yieldRouterAddress,
        entrypoint: 'open_position',
        calldata: [
          note.commitment,
          strategyIndex.toString(),
          (note.amount & 0xffffffffffffffffffffffffffffffffn).toString(),
          (note.amount >> 128n).toString(),
        ],
      }])

      setProgress('Confirming transaction...')
      const provider = sdk['provider']
      await provider.waitForTransaction(result.transaction_hash)

      setProgress(`Position opened! Tx: ${result.transaction_hash.slice(0, 10)}...`)
      sdk.destroy()

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
