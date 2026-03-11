import Link from 'next/link'
import { ShieldVisual } from '../components/ui/ShieldVisual'
import { FeatureCard } from '../components/ui/FeatureCard'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div>
              {/* Tag Line */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-px bg-amber"></div>
                  <span className="font-mono text-sm tracking-[0.2em] uppercase text-amber">
                    BUILT ON STARKNET · ZK PRIVACY · BTCFI
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div className="mb-6">
                <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-none mb-2 text-parchment">
                  YOUR BITCOIN
                </h1>
                <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-none bg-gradient-to-r from-amber to-amber-dim bg-clip-text text-transparent">
                  BECOMES INVISIBLE.
                </h1>
              </div>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-secondary leading-relaxed max-w-md mb-8">
                The first ZK private execution layer for BTCFi.
                Shield, swap, and earn — without ever revealing
                your position, amount, or identity.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/shield" className="btn-primary">
                  ▶ Launch App
                </Link>
                <Link href="/developers" className="btn-outline">
                  Read the Docs →
                </Link>
              </div>

              {/* Trust Signal */}
              <div className="flex items-center gap-4 mt-8 text-muted">
                <span className="font-mono text-xs tracking-[0.1em] uppercase">
                  Non-custodial
                </span>
                <span className="text-subtle-2">·</span>
                <span className="font-mono text-xs tracking-[0.1em] uppercase">
                  Audited
                </span>
                <span className="text-subtle-2">·</span>
                <span className="font-mono text-xs tracking-[0.1em] uppercase">
                  Selective Disclosure
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex justify-center lg:justify-end">
              <ShieldVisual />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-surface border-y border-subtle">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '$0', label: 'Front-running on your trades' },
              { value: '~120ms', label: 'Proof time client-side' },
              { value: '100%', label: 'Non-custodial always' },
              { value: '∞', label: 'Privacy no limit' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-mono text-3xl md:text-4xl font-bold text-amber mb-2">
                  {stat.value}
                </div>
                <div className="font-mono text-xs tracking-[0.1em] uppercase text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-px bg-subtle-3"></div>
              <span className="font-mono text-sm tracking-[0.2em] uppercase text-muted">
                — WHAT PHANTOM DOES
              </span>
              <div className="w-16 h-px bg-subtle-3"></div>
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 text-parchment">
              Privacy as infrastructure.
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
              Every DeFi operation — swap, yield, transfer — executed with 
              zero-knowledge proofs. Your financial data stays private.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-px bg-subtle rounded-2xl overflow-hidden p-px">
            <div className="bg-panel">
              <FeatureCard
                index={1}
                title="Shield Pool"
                description="Deposit wBTC, tBTC, LBTC, or SolvBTC into the shield pool. Only ZK commitments appear on-chain. Your position is completely invisible."
                tag="wBTC · tBTC · LBTC"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L20 7V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                }
              />
            </div>
            <div className="bg-panel">
              <FeatureCard
                index={2}
                title="Private Swap"
                description="Execute swaps via AVNU while keeping your identity, amount, and timing hidden until the moment of settlement."
                tag="Powered by AVNU"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 7L16 12L8 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 7L8 12L16 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                isAmber
              />
            </div>
            <div className="bg-panel">
              <FeatureCard
                index={3}
                title="Shielded Yield"
                description="Deposit into Vesu, Uncap, or Opus lending protocols. Claim yield without ever revealing your position size to observers."
                tag="Vesu · Uncap · Opus"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 4.92893L16.2426 7.75736M7.75736 16.2426L4.92893 19.0784M19.0784 19.0784L16.2426 16.2426M7.75736 7.75736L4.92893 4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
            </div>
            <div className="bg-panel">
              <FeatureCard
                index={4}
                title="Intent Dark Pool"
                description="Submit encrypted intents. They're matched atomically — zero front-running possible by design."
                tag="MEV-resistant · Atomic"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1V3M12 21V23M1 12H3M21 12H23M18.364 5.636L16.95 7.05M7.05 16.95L5.636 18.364M18.364 18.364L16.95 16.95M7.05 7.05L5.636 5.636" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                isAmber
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-28 md:py-36 bg-surface border-y border-subtle">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-px bg-subtle-3"></div>
              <span className="font-mono text-sm tracking-[0.2em] uppercase text-muted">
                — HOW IT WORKS
              </span>
              <div className="w-16 h-px bg-subtle-3"></div>
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 text-parchment">
              The frosted glass safe.
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
              The blockchain is a glass vault. PHANTOM adds the frosted glass layer — 
              your assets are visible to you, hidden from everyone else.
            </p>
          </div>

          {/* Steps */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: 1,
                  title: 'Shield',
                  description: 'Deposit your BTC assets. A ZK commitment is created. Your position disappears from public view.',
                  tech: 'Poseidon2 hash · Merkle commitment',
                },
                {
                  step: 2,
                  title: 'Execute',
                  description: 'Swap, earn, or transfer privately via PHANTOM\'s encrypted execution layer.',
                  tech: 'AVNU/Vesu · Intent matching · ZK execution',
                },
                {
                  step: 3,
                  title: 'Unshield',
                  description: 'Withdraw with a fresh proof. No connection to your original deposit is visible.',
                  tech: 'Nullifier check · Snark verify · ETH settlement',
                },
              ].map((item, index) => (
                <div key={item.step} className="relative flex flex-col items-center text-center">
                  {/* Step Number */}
                  <div className="w-24 h-24 rounded-full bg-amber-glow border border-amber-dim flex items-center justify-center mb-6 relative">
                    <span className="font-display font-black text-4xl text-amber">
                      {item.step}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-amber-dim to-transparent" />
                  )}

                  {/* Title */}
                  <h3 className="font-display font-bold text-xl mb-3 leading-tight text-parchment">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-sm text-secondary leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Tech Note */}
                  <p className="font-mono text-xs text-muted">
                    {item.tech}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-px bg-subtle-3"></div>
                <span className="font-mono text-sm tracking-[0.2em] uppercase text-muted">
                  — SELECTIVE DISCLOSURE
                </span>
                <div className="w-16 h-px bg-subtle-3"></div>
              </div>
              <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 text-parchment">
                Not your father's<br/>privacy protocol.
              </h2>
              <p className="text-lg text-secondary leading-relaxed mb-8 max-w-md">
                Tornado Cash had no compliance mechanism — that's why it was sanctioned. 
                PHANTOM has selective disclosure as a first-class feature.
                You stay private from the public. Regulators get exactly what they need — nothing more.
              </p>
              <Link href="/compliance" className="btn-primary">
                Explore Compliance →
              </Link>
            </div>

            {/* Right Column - Disclosure Levels */}
            <div className="relative">
              <div className="bg-panel border border-amber-dim/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="relative space-y-4">
                  {[
                    {
                      icon: '🛡',
                      title: 'KYC Status Only',
                      desc: "Prove you passed KYC without revealing which institution, when, or what tier.",
                    },
                    {
                      icon: '🛡🛡',
                      title: 'Amount Below Threshold',
                      desc: "Prove your total position is below a regulatory threshold (e.g., $10K) without revealing the exact amount.",
                    },
                    {
                      icon: '🛡🛡🛡',
                      title: 'Sanctions Cleared',
                      desc: "Prove no sanctioned counterparties were involved. No transaction history revealed.",
                    },
                    {
                      icon: '🛡🛡🛡🛡',
                      title: 'Full Audit (Institutional)',
                      desc: "Share a Full Viewing Key with a trusted auditor. All positions visible to them. Zero-knowledge to everyone else.",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-xl bg-surface border border-subtle">
                      <div className="text-amber text-lg">{item.icon}</div>
                      <div>
                        <h4 className="font-display font-semibold text-sm text-parchment mb-1">
                          {item.title}
                        </h4>
                        <p className="font-body text-xs text-secondary leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="py-28 md:py-36 bg-surface border-y border-subtle">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-px bg-subtle-3"></div>
                <span className="font-mono text-sm tracking-[0.2em] uppercase text-muted">
                  — DEVELOPERS
                </span>
                <div className="w-16 h-px bg-subtle-3"></div>
              </div>
              <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 text-parchment">
                Ship in minutes,<br/>not months.
              </h2>
              <p className="text-lg text-secondary leading-relaxed mb-8 max-w-md">
                Build private DeFi applications with our TypeScript SDK. Generate 
                zero-knowledge proofs client-side, integrate with existing protocols.
              </p>
              <Link href="/developers" className="btn-outline mb-6">
                Read the full SDK docs →
              </Link>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber">◆</span>
                  <span className="font-body text-sm text-secondary">Type-safe SDK with full TypeScript support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber">◆</span>
                  <span className="font-body text-sm text-secondary">React hooks for every operation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber">◆</span>
                  <span className="font-body text-sm text-secondary">WASM prover runs client-side — no servers</span>
                </div>
              </div>
            </div>

            {/* Right Column - Code Block */}
            <div>
              <div className="code-block">
                {/* Header */}
                <div className="code-block-header">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="font-mono text-xs text-muted ml-2">integration.ts</span>
                </div>

                {/* Code */}
                <div className="code-block-content text-secondary">
                  <div className="text-muted mb-2">// npm install @phantom-btc/sdk</div>
                  <div className="text-muted mb-4">import {'{'} PhantomClient {'}'} from '@phantom-btc/sdk'</div>

                  <div className="text-muted mb-2">// Initialize with wallet</div>
                  <div className="mb-4">
                    <span className="text-amber">const</span> phantom = <span className="text-amber">await</span> PhantomClient.<span className="text-zk-green">fromWallet</span>(account)
                  </div>

                  <div className="text-muted mb-2">// Shield 0.1 BTC</div>
                  <div className="mb-4">
                    <span className="text-amber">const</span> note = <span className="text-amber">await</span> phantom.<span className="text-zk-green">shield</span>({'{'}
                    <br />&nbsp;&nbsp;asset: <span className="text-zk-green">'wBTC'</span>,
                    <br />&nbsp;&nbsp;amount: parseUnits(<span className="text-zk-green">'0.1'</span>, <span className="text-amber">8</span>),
                    <br />{'}'})
                  </div>

                  <div className="text-muted mb-2">// Swap privately via AVNU</div>
                  <div className="mb-4">
                    <span className="text-amber">const</span> result = <span className="text-amber">await</span> phantom.<span className="text-zk-green">privateSwap</span>({'{'}
                    <br />&nbsp;&nbsp;note,
                    <br />&nbsp;&nbsp;tokenOut: USDC,
                    <br />&nbsp;&nbsp;slippage: <span className="text-amber">0.5</span>,
                    <br />{'}'})
                  </div>

                  <div className="text-muted mb-2">// Prove compliance to regulator</div>
                  <div>
                    <span className="text-amber">const</span> proof = <span className="text-amber">await</span> phantom.<span className="text-zk-green">selectiveDisclosure</span>({'{'}
                    <br />&nbsp;&nbsp;type: <span className="text-zk-green">'amount_below_threshold'</span>,
                    <br />&nbsp;&nbsp;threshold: parseUnits(<span className="text-zk-green">'10000'</span>, <span className="text-amber">6</span>),
                    <br />{'}'})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="text-center mb-12">
            <span className="font-mono text-sm tracking-[0.2em] uppercase text-muted">
              Deeply integrated with the Starknet ecosystem
            </span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
            {['Starknet', 'AVNU', 'Vesu', 'Uncap', 'Opus', 'Argent X', 'Braavos'].map((logo) => (
              <div key={logo} className="font-display font-bold text-xl text-secondary hover:text-amber transition-colors duration-200 cursor-default">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-28 md:py-36 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial-amber pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 md:px-10 lg:px-16 text-center relative">
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 text-parchment">
            The $130M BTC sitting on Starknet
            <br />
            <span className="text-amber">has zero privacy today.</span>
            <br />
            That changes now.
          </h2>
          
          <p className="text-lg text-secondary mb-10">
            Be among the first to shield your Bitcoin.
            <br />
            No waitlist. Testnet live.
          </p>
          
          <Link href="/shield" className="btn-primary text-lg px-10 py-5">
            ▶ Launch PHANTOM
          </Link>
          
          <p className="font-mono text-xs tracking-[0.14em] uppercase text-muted mt-8">
            Non-custodial · Open source · Audited
          </p>
        </div>
      </section>
    </div>
  )
}
