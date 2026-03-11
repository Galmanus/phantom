'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Protocol {
  id: string
  name: string
  apy: number
  tvl: string
  type: string
}

const protocols: Protocol[] = [
  { id: 'vesu', name: 'Vesu', apy: 3.2, tvl: '$12M', type: 'Lending' },
  { id: 'uncap', name: 'Uncap', apy: 4.8, tvl: '$8M', type: 'Lending' },
  { id: 'opus', name: 'Opus', apy: 5.1, tvl: '$6M', type: 'Lending' },
]

interface Position {
  id: string
  protocol: string
  asset: string
  deposited: string
  earned: string
  apy: number
}

export default function YieldPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [revealedAmounts, setRevealedAmounts] = useState<Set<string>>(new Set())

  const toggleReveal = (positionId: string) => {
    const newRevealed = new Set(revealedAmounts)
    if (newRevealed.has(positionId)) {
      newRevealed.delete(positionId)
    } else {
      newRevealed.add(positionId)
    }
    setRevealedAmounts(newRevealed)
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-parchment mb-4">
            Shielded Yield
          </h1>
          <p className="text-lg text-secondary">
            Earn yield on your shielded assets without revealing your position size.
          </p>
        </div>

        {/* Protocol Selector */}
        <div className="mb-12">
          <h2 className="font-mono text-sm tracking-[0.2em] uppercase text-muted mb-6">
            Select a Protocol
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {protocols.map((protocol) => (
              <button
                key={protocol.id}
                onClick={() => setSelectedProtocol(protocol.id)}
                className={`card text-left transition-all ${
                  selectedProtocol === protocol.id 
                    ? 'border-amber ring-2 ring-amber-glow' 
                    : 'hover:border-subtle-2'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-xl text-parchment">
                    {protocol.name}
                  </span>
                  {selectedProtocol === protocol.id && (
                    <span className="badge badge-success">Selected</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-amber">
                      {protocol.apy}%
                    </span>
                    <span className="font-mono text-xs text-muted uppercase">APY</span>
                  </div>
                  <div className="font-mono text-xs text-muted">
                    {protocol.tvl} TVL · {protocol.type}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Yield Dashboard */}
        <div className="card">
          <h2 className="font-display font-bold text-xl text-parchment mb-6">
            Your Shielded Positions
          </h2>
          
          {positions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-glow flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-amber">
                  <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 4.92893L16.2426 7.75736M7.75736 16.2426L4.92893 19.0784M19.0784 19.0784L16.2426 16.2426M7.75736 7.75736L4.92893 4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-secondary mb-2">No active positions</p>
              <p className="text-sm text-muted">
                Select a protocol above to start earning yield on your shielded assets
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <div key={position.id} className="p-4 bg-surface rounded-xl border border-subtle">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-display font-semibold text-parchment">
                        {position.protocol}
                      </span>
                      <span className="text-muted mx-2">·</span>
                      <span className="text-secondary">{position.asset} lending</span>
                    </div>
                    <span className="badge badge-success">{position.apy}% APY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="font-mono text-xs text-muted uppercase mb-1">Deposited</div>
                      <div className="font-mono text-parchment">
                        {revealedAmounts.has(position.id) ? position.deposited : '••••••'}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-xs text-muted uppercase mb-1">Earned today</div>
                      <div className="font-mono text-zk-green">
                        {revealedAmounts.has(position.id) ? position.earned : '••••••'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => toggleReveal(position.id)}
                      className="btn-outline text-xs py-2 px-4"
                    >
                      {revealedAmounts.has(position.id) ? 'Hide' : 'Reveal to me only'}
                    </button>
                    <button className="btn-primary text-xs py-2 px-4">
                      Claim Yield
                    </button>
                    <button className="text-secondary hover:text-amber text-xs py-2 px-4 transition-colors">
                      Withdraw
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-surface rounded-xl border border-subtle">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-amber-glow flex items-center justify-center flex-shrink-0">
              <span className="text-amber">ℹ</span>
            </div>
            <div>
              <h3 className="font-mono text-sm tracking-[0.12em] uppercase text-amber mb-2">
                Privacy Note
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                Your amount is revealed only to you locally using your Incoming Viewing Key. 
                Nothing is ever sent to the blockchain. The protocol sees only your shielded note, 
                not your actual position size.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
