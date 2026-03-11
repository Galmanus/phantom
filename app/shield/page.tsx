'use client'
import { useState } from 'react'

type Step = 'idle' | 'approving' | 'generating' | 'submitting' | 'success'

export default function ShieldPage() {
  const [step, setStep] = useState<Step>('idle')
  const [amount, setAmount] = useState('')
  const [asset, setAsset] = useState('wBTC')

  const handleShield = () => {
    if (!amount) return
    setStep('approving')
    setTimeout(() => setStep('generating'), 2000)
    setTimeout(() => setStep('submitting'), 5000)
    setTimeout(() => setStep('success'), 8000)
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Shield</h1>
        <p className="text-lg text-secondary mb-12">Make your Bitcoin invisible.</p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-3 card">
            {step === 'idle' && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-parchment">Shield Your Bitcoin</h2>
                <div>
                  <label className="font-mono text-xs uppercase text-muted mb-2 block">Asset</label>
                  <select value={asset} onChange={e => setAsset(e.target.value)} className="input">
                    <option>wBTC</option>
                    <option>tBTC</option>
                    <option>LBTC</option>
                    <option>SolvBTC</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-muted mb-2 block">Amount</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input text-2xl font-mono" placeholder="0.00" />
                  <div className="flex justify-between mt-2 text-sm">
                    <button className="text-amber font-mono text-xs uppercase">MAX</button>
                    <span className="text-muted">≈ ${amount ? (parseFloat(amount) * 98472).toFixed(2) : '0.00'} USD</span>
                  </div>
                </div>
                <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted">Network fee</span><span className="font-mono">~0.001 STRK</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted">Shield fee</span><span className="font-mono">0.05%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted">Proof time</span><span className="font-mono text-amber">~120ms</span></div>
                </div>
                <button onClick={handleShield} disabled={!amount} className="btn-primary w-full">▶ Shield {amount || '0'} {asset}</button>
                <p className="font-mono text-xs text-muted text-center">Your note is stored locally with AES-256 encryption.</p>
              </div>
            )}
            {step === 'approving' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto border-4 border-amber border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="font-display font-bold text-xl text-parchment mb-2">Awaiting wallet approval...</h3>
                <p className="text-sm text-secondary">Approve PHANTOM to spend your {asset}.</p>
              </div>
            )}
            {step === 'generating' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-amber-glow border-2 border-amber flex items-center justify-center animate-pulse" style={{boxShadow: '0 0 60px var(--amber-glow)'}}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-amber">
                      <path d="M12 2L20 7V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-parchment text-center">Generating ZK Proof</h3>
                <div className="bg-void rounded-xl p-4 font-mono text-xs space-y-1">
                  <div className="text-zk-green">{'>'} Initializing Stwo prover...</div>
                  <div className="text-zk-green">{'>'} Loading circuit constraints...</div>
                  <div className="text-zk-green">{'>'} Building Merkle witness...</div>
                  <div className="text-zk-green">{'>'} Computing Poseidon2 hash...</div>
                  <div className="text-amber animate-pulse">{'>'} Generating STARK proof...</div>
                </div>
              </div>
            )}
            {step === 'submitting' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto border-4 border-amber border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="font-display font-bold text-xl text-parchment mb-2">Submitting to Starknet...</h3>
                <p className="font-mono text-sm text-amber">Tx: 0x4f3a...c91b</p>
                <p className="text-sm text-muted mt-2">Block ~#842,341 · Estimated: 8s</p>
              </div>
            )}
            {step === 'success' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-full bg-zk-green-dim flex items-center justify-center mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-zk-green"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <h3 className="font-display font-bold text-2xl text-parchment mb-2">✓ Bitcoin Shielded</h3>
                <p className="text-secondary mb-4">{amount} {asset} successfully hidden.</p>
                <p className="font-mono text-sm text-amber mb-6">Note #{Date.now().toString().slice(-4)}</p>
                <div className="flex gap-4">
                  <button onClick={() => setStep('idle')} className="btn-primary flex-1">Shield More</button>
                  <button className="btn-outline flex-1">View Notes</button>
                </div>
              </div>
            )}
          </div>

          {/* Notes Panel */}
          <div className="lg:col-span-2 card">
            <h3 className="font-display font-bold text-lg text-parchment mb-4">My Shielded Notes</h3>
            <p className="font-mono text-xs text-muted mb-6">Total shielded: 0.2341 wBTC · ≈ $23,041</p>
            <div className="flex gap-2 mb-6">
              {['all', 'confirmed', 'pending', 'spent'].map(f => (
                <button key={f} className={`px-3 py-1 rounded-lg font-mono text-xs uppercase ${f === 'all' ? 'bg-amber text-void' : 'bg-surface text-muted'}`}>{f}</button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-surface rounded-xl border border-border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-amber text-xl">₿</span>
                    <div>
                      <div className="font-mono text-parchment">0.10 wBTC</div>
                      <div className="font-mono text-xs text-muted">Note #0042 · 2 hours ago</div>
                    </div>
                  </div>
                  <span className="badge bg-zk-green-dim text-zk-green text-xs px-2 py-1 rounded">CONFIRMED</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn-outline text-xs py-2 px-3 flex-1">Use in Swap</button>
                  <button className="btn-primary text-xs py-2 px-3 flex-1">Unshield</button>
                </div>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-amber-dim/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-amber text-xl">₿</span>
                    <div>
                      <div className="font-mono text-parchment">0.1341 wBTC</div>
                      <div className="font-mono text-xs text-muted">Note #0038 · 30 min ago</div>
                    </div>
                  </div>
                  <span className="badge bg-amber-dim/30 text-amber text-xs px-2 py-1 rounded">PENDING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
