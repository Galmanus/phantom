'use client';

import { useState } from 'react';

export default function SwapPage() {
  const [inputAsset, setInputAsset] = useState('WBTC');
  const [outputAsset, setOutputAsset] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  const assets = ['WBTC', 'tBTC', 'LBTC', 'SolvBTC', 'STRK', 'USDC'];

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-title mb-2">Private Swap</h1>
        <p className="text-body text-textMuted mb-8">
          Execute asset swaps from inside the shield pool. No front-running. No MEV.
        </p>

        <div className="max-w-xl mx-auto p-6 bg-surface rounded-xl border border-border">
          {/* Input */}
          <div className="mb-4">
            <label className="block text-label text-textMuted mb-2">From</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary"
              />
              <select
                value={inputAsset}
                onChange={(e) => setInputAsset(e.target.value)}
                className="px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary"
              >
                {assets.map((asset) => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center my-4">
            <button className="p-2 bg-background border border-border rounded-lg hover:bg-surface transition-colors">
              ↓
            </button>
          </div>

          {/* Output */}
          <div className="mb-6">
            <label className="block text-label text-textMuted mb-2">To</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0.00"
                readOnly
                className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-textMuted"
              />
              <select
                value={outputAsset}
                onChange={(e) => setOutputAsset(e.target.value)}
                className="px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary"
              >
                {assets.map((asset) => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slippage */}
          <div className="mb-6">
            <label className="block text-label text-textMuted mb-2">Slippage Tolerance</label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    slippage === val
                      ? 'bg-primary text-white'
                      : 'bg-background text-textMuted hover:bg-surface'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Price Info */}
          <div className="p-4 bg-background rounded-lg mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-textMuted">Market Price</span>
              <span className="text-text">1 WBTC = 95,420 USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textMuted">Your Minimum</span>
              <span className="text-success">≥ 94,950 USDC</span>
            </div>
          </div>

          <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors">
            Execute Private Swap
          </button>
        </div>

        {/* Explainer */}
        <div className="mt-8 p-6 bg-surface/50 rounded-xl border border-border">
          <h3 className="text-section mb-4">How PHANTOM Dark Pool Works</h3>
          <p className="text-body text-textMuted">
            Your swap is encrypted until a counterparty with the matching trade is found.
            No front-running is possible by construction. The matching proof guarantees
            both parties receive at least their minimum. Settlement is atomic.
          </p>
        </div>
      </div>
    </main>
  );
}
