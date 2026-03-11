'use client'
import { useState } from 'react'

type Protocol = 'vesu' | 'uncap' | 'opus' | null

export default function YieldPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(null)
  const [showBalance, setShowBalance] = useState(false)
  const [depositing, setDepositing] = useState(false)

  const protocols = [
    { id: 'vesu', name: 'Vesu', apy: '3.2%', tvl: '$12M', type: 'Lending', selected: selectedProtocol === 'vesu' },
    { id: 'uncap', name: 'Uncap', apy: '4.8%', tvl: '$8M', type: 'Lending', selected: selectedProtocol === 'uncap' },
    { id: 'opus', name: 'Opus', apy: '5.1%', tvl: '$6M', type: 'Lending', selected: selectedProtocol === 'opus' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Yield</h1>
        <p className="text-lg text-secondary mb-12">Earn yield without broadcasting your position.</p>

        {/* Protocol Selector */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {protocols.map(p => (
            <button key={p.id} onClick={() => setSelectedProtocol(p.id as Protocol)} className={`card p-6 text-left transition-all ${p.selected ? 'border-amber' : 'hover:border-amber-dim'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="font-display font-bold text-2xl text-parchment">{p.name}</span>
                {p.selected && <span className="text-amber">✓</span>}
              </div>
              <div className="text-3xl font-mono text-amber mb-1">{p.apy}</div>
              <div className="text-sm text-muted mb-4">APY · {p.tvl} TVL</div>
              <div className="text-xs text-muted font-mono uppercase">{p.type}</div>
            </button>
          ))}
        </div>

        {/* Yield Dashboard */}
        <div className="card">
          <h2 className="font-display font-bold text-xl text-parchment mb-6">Your Shielded Positions</h2>
          
          {selectedProtocol ? (
            <div className="space-y-6">
              <div className="p-4 bg-surface rounded-xl border border-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-parchment font-bold">{selectedProtocol.toUpperCase()}</span>
                    <span className="text-muted ml-2">· wBTC lending</span>
                  </div>
                  <span className="text-zk-green font-mono">5.1% APY</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-xs text-muted mb-1">Deposited</div>
                    <div className="font-mono text-xl text-parchment">
                      {showBalance ? '0.2341 wBTC' : '••••••'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted mb-1">Earned today</div>
                    <div className="font-mono text-xl text-parchment">
                      {showBalance ? '0.000031 wBTC' : '••••••'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowBalance(!showBalance)} className="btn-outline flex-1">
                    {showBalance ? 'Hide' : 'Reveal to me only'}
                  </button>
                  <button className="btn-primary flex-1">Claim Yield</button>
                  <button className="btn-outline">Withdraw</button>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setDepositing(true)} disabled={depositing} className="btn-primary">
                  {depositing ? 'Depositing...' : '▶ Deposit to Earn'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-surface flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-muted"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2"/></svg>
              </div>
              <p className="text-secondary mb-2">No active positions</p>
              <p className="text-sm text-muted">Select a protocol above to start earning.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
