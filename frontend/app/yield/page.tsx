'use client';

import { useState } from 'react';

export default function YieldPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<'vesu' | 'uncap' | 'opus'>('vesu');

  const protocols = [
    {
      id: 'vesu' as const,
      name: 'Vesu',
      apy: 3.2,
      tvl: '$12.5M',
      description: 'Lending protocol',
    },
    {
      id: 'uncap' as const,
      name: 'Uncap',
      apy: 4.5,
      tvl: '$8.2M',
      description: 'Yield optimizer',
    },
    {
      id: 'opus' as const,
      name: 'Opus',
      apy: 2.8,
      tvl: '$15.1M',
      description: 'CDP protocol',
    },
  ];

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-title mb-2">Shielded Yield</h1>
        <p className="text-body text-textMuted mb-8">
          Earn real yield on your shielded assets. No position size revealed.
        </p>

        {/* Protocol Selector */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {protocols.map((protocol) => (
            <button
              key={protocol.id}
              onClick={() => setSelectedProtocol(protocol.id)}
              className={`p-6 rounded-xl border transition-colors text-left ${
                selectedProtocol === protocol.id
                  ? 'bg-surface border-primary'
                  : 'bg-surface/50 border-border hover:border-primary/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-section">{protocol.name}</h3>
                <span className="text-2xl font-bold text-primary">{protocol.apy}%</span>
              </div>
              <p className="text-body text-textMuted mb-2">{protocol.description}</p>
              <p className="text-label text-textMuted">TVL: {protocol.tvl}</p>
            </button>
          ))}
        </div>

        {/* Deposit Form */}
        <div className="max-w-xl mx-auto p-6 bg-surface rounded-xl border border-border">
          <h2 className="text-section mb-6">Deposit to {protocols.find(p => p.id === selectedProtocol)?.name}</h2>

          <div className="mb-6">
            <label className="block text-label text-textMuted mb-2">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary"
            />
          </div>

          <div className="p-4 bg-background rounded-lg mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-textMuted">Est. Daily Yield</span>
              <span className="text-success">0.00043 wBTC</span>
            </div>
          </div>

          <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors">
            Deposit
          </button>
        </div>

        {/* Active Positions */}
        <div className="mt-8">
          <h2 className="text-section mb-4">Your Positions</h2>
          <div className="p-6 bg-surface rounded-xl border border-border">
            <p className="text-textMuted text-center py-8">No active positions</p>
          </div>
        </div>
      </div>
    </main>
  );
}
