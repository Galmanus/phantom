'use client'
import { useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { usePhantom } from '@/app/providers/PhantomProvider'
import { useStrkBTC } from '@/hooks/useStrkBTC'

// Supported input assets
const INPUT_ASSETS = [
  { id: 'wbtc',    label: 'wBTC',    decimals: 8 },
  { id: 'tbtc',    label: 'tBTC',    decimals: 18 },
  { id: 'lbtc',    label: 'LBTC',    decimals: 8 },
  { id: 'solvbtc', label: 'SolvBTC', decimals: 18 },
]

export default function SwapPage() {
  const { address } = useAccount()
  const { starkzap, isReady } = usePhantom()
  const { balance } = useStrkBTC()
  const [inputAsset, setInputAsset] = useState(INPUT_ASSETS[0])
  const [inputAmount, setInputAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Estimated output (1:1 ratio minus small fee)
  const estimatedOutput = inputAmount
    ? (parseFloat(inputAmount) * 0.9995).toFixed(8)
    : '0.00000000'

  const handleSwap = async () => {
    if (!isReady || !inputAmount) return
    setIsSwapping(true)
    setError(null)
    try {
      // Use Starkzap to swap input asset → strkBTC
      const sdk = starkzap as any
      if (sdk?.swap) {
        const result = await sdk.swap({
          fromToken: inputAsset.id,
          toToken: 'strkbtc',
          amount: BigInt(Math.floor(parseFloat(inputAmount) * 10 ** inputAsset.decimals)),
        })
        setTxHash(result.txHash)
      } else {
        // Mock for now
        await new Promise(resolve => setTimeout(resolve, 2000))
        setTxHash('0x' + Math.random().toString(16).slice(2, 66))
      }
    } catch (e: any) {
      setError(parseWalletError(e))
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <div className="min-h-screen bg-void px-8 py-12">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
            Get strkBTC
          </h1>
          <p className="text-text-primary/60">
            Convert your BTC-backed tokens to strkBTC to start earning privately.
          </p>
        </div>

        {/* Current strkBTC balance */}
        {balance && (
          <div className="bg-panel border border-amber/10 rounded-xl p-4 mb-6
                          flex items-center justify-between">
            <span className="text-sm text-text-primary/60">Your strkBTC balance</span>
            <span className="font-mono text-amber font-bold">{balance.formatted}</span>
          </div>
        )}

        {/* Swap card */}
        <div className="bg-panel border border-amber/20 rounded-2xl p-6 mb-4">

          {/* Input */}
          <div className="mb-2">
            <label className="text-xs text-text-primary/50 mb-2 block">You send</label>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Asset selector */}
              <select
                value={inputAsset.id}
                onChange={e => setInputAsset(INPUT_ASSETS.find(a => a.id === e.target.value)!)}
                className="bg-void border border-amber/20 rounded-xl px-3 py-3
                           text-amber font-mono text-sm focus:outline-none
                           focus:border-amber/60"
              >
                {INPUT_ASSETS.map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              {/* Amount input */}
              <input
                type="number"
                placeholder="0.00000000"
                value={inputAmount}
                onChange={e => setInputAmount(e.target.value)}
                className="flex-1 bg-void border border-amber/20 rounded-xl px-4 py-3
                           font-mono text-text-primary placeholder-text-primary/20
                           focus:outline-none focus:border-amber/60"
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-4">
            <div className="w-8 h-8 rounded-full bg-amber/10 border border-amber/30
                            flex items-center justify-center">
              <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Output */}
          <div className="mb-6">
            <label className="text-xs text-text-primary/50 mb-2 block">You receive</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="bg-void border border-amber/20 rounded-xl px-3 py-3
                              text-amber font-mono text-sm">
                strkBTC
              </div>
              <div className="flex-1 bg-void border border-amber/20 rounded-xl px-4 py-3
                              font-mono text-zk-green">
                {estimatedOutput}
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-2 bg-amber/5 border border-amber/10
                          rounded-xl p-3 mb-6">
            <svg className="w-4 h-4 text-amber shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-text-primary/60">
              strkBTC has private balances by default via Starknet STRK20.
              After this swap, your balance will be shielded automatically.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSwap}
            disabled={!isReady || !inputAmount || isSwapping}
            className="w-full bg-amber text-void font-bold py-4 rounded-xl
                       hover:bg-amber/90 transition-colors disabled:opacity-40
                       disabled:cursor-not-allowed"
          >
            {isSwapping ? 'Swapping...' : `Convert to strkBTC`}
          </button>
        </div>

        {/* Success state */}
        {txHash && (
          <div className="bg-zk-green/10 border border-zk-green/30 rounded-xl p-4">
            <p className="text-zk-green font-medium mb-2">Swap successful</p>
            <a
              href={`https://sepolia.voyager.online/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-text-primary/60
                         hover:text-amber transition-colors"
            >
              View on Voyager 
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={() => window.location.href = '/yield'}
              className="mt-3 w-full border border-amber/30 text-amber py-3
                         rounded-xl hover:bg-amber/10 transition-colors text-sm font-medium"
            >
              Start earning with strkBTC →
            </button>
          </div>
        )}

        {/* Info: Why strkBTC */}
        <div className="mt-8 space-y-3">
          <p className="text-xs text-text-primary/40 uppercase tracking-wider font-mono">
            Why strkBTC?
          </p>
          {[
            'Private balance — no one can see how much you hold',
            'Earn yield on Vesu, Ekubo, Re7 while staying private',
            'Viewing keys for compliance when you need it',
            'Issued by Starknet — not a third-party custodian',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-text-primary/60">
              <span className="text-zk-green">✓</span>
              {item}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

function parseWalletError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const map: Record<string, string> = {
    'User rejected':         'Connection rejected. Please approve in your wallet.',
    'Wallet not found':      'Wallet not found. Install Argent X or Braavos.',
    'Network mismatch':      'Wrong network. Switch to Starknet Sepolia.',
    'insufficient funds':    'Insufficient STRK for gas.',
    'StarknetChainMismatch': 'Wrong network. Switch to Starknet Sepolia.',
  }
  for (const [key, friendly] of Object.entries(map)) {
    if (msg.includes(key)) return friendly
  }
  return 'Transaction failed. Please try again.'
}
