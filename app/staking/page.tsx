'use client'

import Link from 'next/link'

export default function Staking() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-4xl md:text-5xl text-parchment mb-4">
            Private <span className="text-amber">Liquid Staking</span>
          </h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Stake your BTC with complete privacy. Your validator rewards stay hidden while earning yield.
          </p>
        </div>

        {/* Staking Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card text-center">
            <div className="font-mono text-3xl font-bold text-amber mb-2">4-8%</div>
            <div className="font-mono text-xs tracking-[0.1em] uppercase text-muted">APY</div>
          </div>
          <div className="card text-center">
            <div className="font-mono text-3xl font-bold text-amber mb-2">100%</div>
            <div className="font-mono text-xs tracking-[0.1em] uppercase text-muted">Private</div>
          </div>
          <div className="card text-center">
            <div className="font-mono text-3xl font-bold text-amber mb-2">7d</div>
            <div className="font-mono text-xs tracking-[0.1em] uppercase text-muted">Unbonding</div>
          </div>
        </div>

        {/* Main Staking Card */}
        <div className="card max-w-lg mx-auto">
          <h2 className="font-display font-bold text-xl text-parchment mb-6">Stake BTC Privately</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-2">Asset</label>
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
                <div className="w-10 h-10 bg-amber-glow rounded-full flex items-center justify-center">
                  <span className="text-amber font-bold">₿</span>
                </div>
                <div>
                  <div className="text-parchment font-medium">WBTC</div>
                  <div className="text-xs text-muted">Wrapped Bitcoin</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">Amount</label>
              <input 
                type="text" 
                placeholder="0.00"
                className="w-full p-3 bg-surface rounded-lg border border-border text-parchment placeholder-muted focus:border-amber focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/shield" className="btn-primary flex-1 text-center">
                Stake Now
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">APY</span>
              <span className="text-amber">4-8%</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Unbonding Period</span>
              <span className="text-parchment">7 days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Protocol Fee</span>
              <span className="text-parchment">10%</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-display font-bold text-lg text-parchment mb-3">🔒 Complete Privacy</h3>
            <p className="text-sm text-secondary">
              Your staking position and rewards are shielded with zero-knowledge proofs. No one can see how much you stake or your accumulated rewards.
            </p>
          </div>
          <div className="card">
            <h3 className="font-display font-bold text-lg text-parchment mb-3">💧 Liquid Staking</h3>
            <p className="text-sm text-secondary">
              Receive liquid staking tokens representing your staked position. Use them in DeFi while your original stake continues earning rewards.
            </p>
          </div>
          <div className="card">
            <h3 className="font-display font-bold text-lg text-parchment mb-3">⚡ Auto-Compound</h3>
            <p className="text-sm text-secondary">
              Rewards are automatically reinvested. Your stake grows exponentially over time without any action needed.
            </p>
          </div>
          <div className="card">
            <h3 className="font-display font-bold text-lg text-parchment mb-3">✅ Non-Custodial</h3>
            <p className="text-sm text-secondary">
              Your keys, your coins. MIDAS never takes custody of your assets. All operations are on-chain and verifiable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
