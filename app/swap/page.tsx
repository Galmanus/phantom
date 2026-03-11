'use client'

import { useState } from 'react'

type SwapStep = 'idle' | 'generating' | 'matching' | 'success'

const slippageOptions = [0.1, 0.5, 1.0]

export default function SwapPage() {
  const [step, setStep] = useState<SwapStep>('idle')
  const [fromAsset, setFromAsset] = useState('wBTC')
  const [toAsset, setToAsset] = useState('USDC')
  const [fromAmount, setFromAmount] = useState('0.10')
  const [slippage, setSlippage] = useState(0.5)

  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return
    setStep('generating')
    setTimeout(() => setStep('matching'), 2000)
    setTimeout(() => setStep('success'), 5000)
  }

  const swapAssets = () => {
    const temp = fromAsset
    setFromAsset(toAsset)
    setToAsset(temp)
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-parchment mb-4">
            Private Swap
          </h1>
          <p className="text-lg text-secondary">
            Swap tokens without exposing your amount, direction, or timing to the network.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Swap Form - 55% */}
          <div className="lg:col-span-3">
            <div className="card">
              <h2 className="font-display font-bold text-xl text-parchment mb-6">
                Private Swap
              </h2>

              {/* From */}
              <div className="mb-4">
                <label className="font-mono text-xs text-muted uppercase tracking-wider mb-2 block">
                  From (shielded)
                </label>
                <div className="p-4 bg-surface rounded-xl border border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <select
                      value={fromAsset}
                      onChange={(e) => setFromAsset(e.target.value)}
                      className="input w-auto py-2 font-mono"
                    >
                      <option value="wBTC">wBTC</option>
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                      <option value="STRK">STRK</option>
                    </select>
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="input w-32 text-right font-mono text-xl"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="font-mono text-sm text-muted">
                    ≈ ${fromAmount ? (parseFloat(fromAmount) * (fromAsset === 'wBTC' ? 98472.32 : 1)).toFixed(2) : '0.00'} USD
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2 relative z-10">
                <button
                  onClick={swapAssets}
                  className="w-10 h-10 rounded-full bg-panel border-2 border-amber flex items-center justify-center hover:bg-amber-glow transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber">
                    <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* To */}
              <div className="mb-6">
                <label className="font-mono text-xs text-muted uppercase tracking-wider mb-2 block">
                  To
                </label>
                <div className="p-4 bg-surface rounded-xl border border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <select
                      value={toAsset}
                      onChange={(e) => setToAsset(e.target.value)}
                      className="input w-auto py-2 font-mono"
                    >
                      <option value="USDC">USDC</option>
                      <option value="wBTC">wBTC</option>
                      <option value="ETH">ETH</option>
                      <option value="STRK">STRK</option>
                    </select>
                    <div className="font-mono text-xl text-parchment">
                      ≈ {fromAmount ? (parseFloat(fromAmount) * (fromAsset === 'wBTC' ? 97893.20 : 1)).toLocaleString() : '0.00'} {toAsset}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slippage */}
              <div className="mb-6">
                <label className="font-mono text-xs text-muted uppercase tracking-wider mb-2 block">
                  Slippage
                </label>
                <div className="flex gap-2">
                  {slippageOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlippage(s)}
                      className={`flex-1 py-2 rounded-lg font-mono text-sm transition-colors ${
                        slippage === s
                          ? 'bg-amber text-void'
                          : 'bg-surface text-muted hover:text-secondary'
                      }`}
                    >
                      {s}%
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom"
                    className="input w-20 text-center font-mono text-sm"
                  />
                </div>
              </div>

              {/* Rate Preview */}
              <div className="p-4 bg-surface rounded-xl border border-subtle mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Rate</span>
                  <span className="font-mono text-secondary">
                    1 {fromAsset} = 97,893.20 {toAsset}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Route</span>
                  <span className="font-mono text-secondary">
                    {fromAsset} → {toAsset} via AVNU
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Price impact</span>
                  <span className="font-mono text-zk-green">Less than 0.01%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">PHANTOM fee</span>
                  <span className="font-mono text-secondary">0.05%</span>
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwap}
                disabled={step !== 'idle'}
                className="btn-primary w-full"
              >
                {step === 'idle' && '▶ Swap Privately'}
                {step === 'generating' && 'Generating Proof...'}
                {step === 'matching' && 'Matching Intent...'}
                {step === 'success' && '✓ Swap Complete'}
              </button>

              {/* Privacy Note */}
              <p className="font-mono text-xs text-muted text-center mt-4">
                Your intent is encrypted. No one can see your trade direction 
                until it is matched.
              </p>
            </div>
          </div>

          {/* Intent Status Tracker - 45% */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="font-display font-bold text-lg text-parchment mb-6">
                Intent Status
              </h3>

              {/* Timeline */}
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                    step === 'success'
                      ? 'bg-zk-green-dim text-zk-green'
                      : step === 'generating'
                      ? 'bg-amber-glow text-amber animate-pulse'
                      : 'bg-surface text-muted'
                  }`}>
                    {step === 'success' ? '✓' : '1'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-mono text-sm ${
                      step === 'success' || step === 'generating' || step === 'matching'
                        ? 'text-parchment'
                        : 'text-muted'
                    }`}>
                      Proof generated
                    </div>
                    {(step === 'success' || step === 'matching' || step === 'generating') && (
                      <div className="font-mono text-xs text-muted">
                        ✓ 2s ago
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                    step === 'success'
                      ? 'bg-zk-green-dim text-zk-green'
                      : step === 'matching'
                      ? 'bg-amber-glow text-amber animate-pulse'
                      : 'bg-surface text-muted'
                  }`}>
                    {step === 'success' ? '✓' : '2'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-mono text-sm ${
                      step === 'success' || step === 'matching'
                        ? 'text-parchment'
                        : 'text-muted'
                    }`}>
                      Intent encrypted
                    </div>
                    {(step === 'success' || step === 'matching') && (
                      <div className="font-mono text-xs text-muted">
                        ✓ 1s ago
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                    step === 'success'
                      ? 'bg-zk-green-dim text-zk-green'
                      : step === 'matching'
                      ? 'bg-amber-glow text-amber animate-pulse'
                      : 'bg-surface text-muted'
                  }`}>
                    {step === 'success' ? '✓' : '3'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-mono text-sm ${
                      step === 'success' || step === 'matching'
                        ? 'text-parchment'
                        : 'text-muted'
                    }`}>
                      Sent to dark pool
                    </div>
                    {step === 'success' && (
                      <div className="font-mono text-xs text-muted">
                        ✓ now
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                    step === 'success'
                      ? 'bg-zk-green-dim text-zk-green'
                      : 'bg-surface text-muted'
                  }`}>
                    {step === 'success' ? '✓' : '4'}
                  </div>
                  <div className="flex-1">
                    <div className={`font-mono text-sm ${
                      step === 'success'
                        ? 'text-parchment'
                        : 'text-muted'
                    }`}>
                      Settlement confirmed
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-surface rounded-xl border border-subtle">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-glow flex items-center justify-center flex-shrink-0">
                    <span className="text-amber text-xs">ℹ</span>
                  </div>
                  <div className="text-sm text-secondary">
                    <p className="font-semibold text-parchment mb-1">How it works</p>
                    <p>
                      Your swap intent is encrypted and sent to the dark pool. 
                      It is matched atomically with a counterparty. Front-running 
                      is impossible by design.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
