'use client'
import { useState } from 'react'

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [swapping, setSwapping] = useState(false)
  const [status, setStatus] = useState<'idle' | 'proof' | 'encrypted' | 'matching' | 'settled'>('idle')

  const handleSwap = () => {
    setSwapping(true)
    setStatus('proof')
    setTimeout(() => setStatus('encrypted'), 1500)
    setTimeout(() => setStatus('matching'), 3000)
    setTimeout(() => {
      setStatus('settled')
      setSwapping(false)
    }, 5000)
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Swap</h1>
        <p className="text-lg text-secondary mb-12">Trade privately. No front-running. No exposure.</p>

        <div className="card space-y-6">
          <h2 className="font-display font-bold text-xl text-parchment">Private Swap</h2>
          
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase text-muted">From (shielded)</label>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-amber">Note #0042</span>
                <span className="text-muted text-sm">0.10 wBTC · ≈ $9,847</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center text-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase text-muted">To</label>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-parchment text-lg">USDC</span>
                </div>
                <span className="font-mono text-parchment">{toAmount || '0.00'} USDC</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map(s => (
              <button key={s} onClick={() => setSlippage(s)} className={`flex-1 py-2 rounded-lg font-mono text-xs ${slippage === s ? 'bg-amber text-void' : 'bg-surface text-muted'}`}>{s}%</button>
            ))}
          </div>

          <div className="p-4 bg-surface rounded-xl border border-border space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Rate</span><span className="font-mono">1 wBTC = 97,893.20 USDC</span></div>
            <div className="flex justify-between"><span className="text-muted">Route</span><span className="font-mono">wBTC → USDC via AVNU</span></div>
            <div className="flex justify-between"><span className="text-muted">Price impact</span><span className="font-mono text-zk-green">&lt; 0.01%</span></div>
            <div className="flex justify-between"><span className="text-muted">PHANTOM fee</span><span className="font-mono">0.05%</span></div>
          </div>

          <button onClick={handleSwap} disabled={swapping} className="btn-primary w-full">
            {swapping ? 'Swapping...' : '▶ Swap Privately'}
          </button>
        </div>

        {/* Intent Status Tracker */}
        {status !== 'idle' && (
          <div className="mt-8 card">
            <h3 className="font-display font-bold text-lg text-parchment mb-6">Intent Status</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${status === 'proof' ? 'bg-amber text-void' : 'bg-zk-green text-void'}`}>
                    {status === 'proof' ? <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></div> : '✓'}
                  </div>
                  <div><p className="font-bold text-parchment">Proof generated</p><p className="text-xs text-muted">ZK proof computed locally</p></div>
                </div>
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${status === 'encrypted' ? 'bg-amber text-void' : status === 'matching' || status === 'settled' ? 'bg-zk-green text-void' : 'bg-border text-muted'}`}>
                    {status === 'encrypted' ? <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></div> : '✓'}
                  </div>
                  <div><p className="font-bold text-parchment">Intent encrypted</p><p className="text-xs text-muted">Direction hidden from observers</p></div>
                </div>
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${status === 'matching' ? 'bg-amber text-void' : status === 'settled' ? 'bg-zk-green text-void' : 'bg-border text-muted'}`}>
                    {status === 'matching' ? <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></div> : status === 'settled' ? '✓' : '○'}
                  </div>
                  <div><p className="font-bold text-parchment">Sent to dark pool</p><p className="text-xs text-muted">Matching in progress...</p></div>
                </div>
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${status === 'settled' ? 'bg-zk-green text-void' : 'bg-border text-muted'}`}>
                    {status === 'settled' ? '✓' : '○'}
                  </div>
                  <div><p className="font-bold text-parchment">Settlement confirmed</p><p className="text-xs text-muted">Atomic execution complete</p></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted mt-6 p-4 bg-surface rounded-lg">Your intent is encrypted. No one can see your trade direction until it's matched.</p>
          </div>
        )}
      </div>
    </div>
  )
}
