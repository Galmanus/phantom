import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-px bg-amber"></div>
                <span className="font-mono text-sm tracking-[0.2em] uppercase text-amber">
                  BUILT ON STARKNET · ZK PRIVACY · BTCFI
                </span>
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-none mb-4 text-parchment">
                YOUR BITCOIN
              </h1>
              <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-none text-amber mb-8">
                BECOMES INVISIBLE.
              </h1>
              <p className="text-lg text-secondary max-w-md mb-8">
                The first ZK private execution layer for BTCFi. Shield, swap, and earn — without ever revealing your position, amount, or identity.
              </p>
              <div className="flex gap-4 mb-8">
                <Link href="/shield" className="btn-primary">▶ Launch App</Link>
                <Link href="/developers" className="btn-outline">Read the Docs →</Link>
              </div>
              <div className="flex gap-4 text-muted text-sm">
                <span className="font-mono text-xs uppercase">Non-custodial</span>
                <span>·</span>
                <span className="font-mono text-xs uppercase">Audited</span>
                <span>·</span>
                <span className="font-mono text-xs uppercase">Selective Disclosure</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-full border border-amber-dim animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute inset-8 rounded-full border border-zk-green-dim animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="absolute inset-16 bg-panel rounded-full flex items-center justify-center animate-pulse" style={{boxShadow: '0 0 60px var(--amber-glow)'}}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-amber">
                    <path d="M12 2L20 7V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '$0', label: 'Front-running on your trades' },
              { value: '~120ms', label: 'Proof time client-side' },
              { value: '100%', label: 'Non-custodial always' },
              { value: '∞', label: 'Privacy no limit' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-3xl md:text-4xl font-bold text-amber mb-2">{stat.value}</div>
                <div className="font-mono text-xs tracking-[0.1em] uppercase text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-4xl md:text-5xl text-parchment mb-4">What PHANTOM does</h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">Every DeFi operation — swap, yield, transfer — executed with zero-knowledge proofs.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
            {[
              { title: 'Shield Pool', desc: 'Deposit wBTC, tBTC, LBTC into the shield pool. Only ZK commitments appear on-chain.', tags: ['wBTC', 'tBTC', 'LBTC'] },
              { title: 'Private Swap', desc: 'Execute swaps via AVNU while keeping your identity and amount hidden until settlement.', tags: ['Powered by AVNU'] },
              { title: 'Shielded Yield', desc: 'Deposit into Vesu, Uncap, or Opus. Claim yield without revealing your position size.', tags: ['Vesu', 'Uncap', 'Opus'] },
              { title: 'Intent Dark Pool', desc: 'Submit encrypted intents. They are matched atomically — zero front-running possible.', tags: ['MEV-resistant', 'Atomic'] },
            ].map((f, i) => (
              <div key={i} className="card hover:border-amber-dim transition-colors">
                <h3 className="font-display font-bold text-xl text-parchment mb-3">{f.title}</h3>
                <p className="text-sm text-secondary mb-4">{f.desc}</p>
                <div className="flex gap-2">
                  {f.tags.map((t, j) => (
                    <span key={j} className="px-2 py-1 bg-amber-glow rounded text-xs font-mono text-amber">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-4xl md:text-5xl text-parchment mb-4">The Frosted Glass Safe</h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">The blockchain is a glass vault. PHANTOM adds the frosted glass layer.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Shield', desc: 'Deposit your BTC. A ZK commitment is created. Your position disappears.', tech: 'Poseidon2 hash · Merkle commitment' },
              { step: 2, title: 'Execute', desc: 'Swap, earn, or transfer privately via PHANTOM\'s encrypted execution layer.', tech: 'AVNU · Intent matching · ZK execution' },
              { step: 3, title: 'Unshield', desc: 'Withdraw with a fresh proof. No connection to your original deposit is visible.', tech: 'Nullifier check · Snark verify' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-glow border border-amber-dim flex items-center justify-center">
                  <span className="font-display font-black text-4xl text-amber">{s.step}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-parchment mb-3">{s.title}</h3>
                <p className="text-sm text-secondary mb-4">{s.desc}</p>
                <p className="font-mono text-xs text-muted">{s.tech}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--amber-glow)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="font-display font-black text-4xl md:text-5xl text-parchment mb-4">
            The $130M BTC on Starknet<br/>
            <span className="text-amber">has zero privacy today.</span><br/>
            That changes now.
          </h2>
          <p className="text-lg text-secondary mb-10">Be among the first to shield your Bitcoin. No waitlist. Testnet live.</p>
          <Link href="/shield" className="btn-primary text-lg px-10 py-5">▶ Launch PHANTOM</Link>
          <p className="font-mono text-xs uppercase text-muted mt-8">Non-custodial · Open source · Audited</p>
        </div>
      </section>
    </div>
  )
}
