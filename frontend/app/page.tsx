'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, ArrowRight, Lock, Eye, Layers, Target } from 'lucide-react'

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12
    }
  }
}

export default function HomePage() {
  return (
    <main className="relative z-10">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 pt-20 pb-28 md:pt-28 md:pb-36">
        <div className="section-content w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left column — content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-8"
            >
              {/* Tag line */}
              <motion.div variants={fadeInUp} className="flex items-center gap-4">
                <div className="w-10 h-px bg-[--cyan]" />
                <span className="font-mono font-medium text-[11px] tracking-[0.2em] uppercase text-[--cyan]">
                  ZK Private Execution Layer · Starknet BTCFi
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeInUp} className="space-y-2">
                <h1 className="font-display font-extrabold text-[64px] md:text-[96px] lg:text-[112px] leading-[0.88] tracking-[-0.025em] text-[--text]">
                  YOUR BITCOIN.
                </h1>
                <h1 className="font-display font-extrabold text-[64px] md:text-[96px] lg:text-[112px] leading-[0.88] tracking-[-0.025em] gradient-text">
                  INVISIBLE.
                </h1>
              </motion.div>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="font-syne font-normal text-[17px] leading-[1.7] text-[--text-muted] max-w-[520px]"
              >
                Shield your BTC positions with zero-knowledge proofs. Swap, earn yield,
                and execute DeFi strategies without exposing your identity, amounts,
                or strategy to anyone on the network.
              </motion.p>

              {/* CTA Row */}
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link href="/shield" className="btn-primary">
                  Start Shielding
                  <ArrowRight size={16} />
                </Link>
                <Link href="/developers" className="btn-ghost">
                  Build with SDK
                </Link>
              </motion.div>

              {/* Stats bar */}
              <motion.div variants={fadeInUp} className="pt-8">
                <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-[--border] border border-[--border]">
                  <StatCard value="$0" label="Exposed On-Chain" />
                  <StatCard value="0ms" label="Front-Run Window" />
                  <StatCard value="∞" label="Privacy Guarantee" />
                </div>
              </motion.div>
            </motion.div>

            {/* Right column — Shield Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex items-center justify-center"
            >
              <ShieldVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section bg-[--surface]/50">
        <div className="section-content">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-px bg-[--violet]" />
              <span className="font-mono font-medium text-[11px] tracking-[0.2em] uppercase text-[--violet-bright]">
                Protocol
              </span>
            </div>
            <h2 className="font-display font-extrabold text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em]">
              Every operation.<br />
              <span className="gradient-text">Provably private.</span>
            </h2>
            <p className="font-syne font-normal text-[15px] leading-[1.7] text-[--text-muted] max-w-[500px] mt-6">
              Four core primitives for private Bitcoin DeFi on Starknet.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px rounded-2xl overflow-hidden bg-[--border]">
            <FeatureCard
              index="01"
              title="Shield Pool"
              description="Deposit BTC-family assets into a shielded pool where only ZK-proven commitments exist on-chain. Your balance is a cryptographic secret."
              icon={<Shield size={28} />}
              tag="Poseidon Commitment"
              tagVariant="violet"
            />
            <FeatureCard
              index="02"
              title="Private Swap"
              description="Execute asset swaps via AVNU integration. The swap happens at market rates. Amounts, direction, and identity remain provably hidden."
              icon={<Eye size={28} />}
              tag="AVNU Integration"
              tagVariant="cyan"
              iconVariant="cyan"
            />
            <FeatureCard
              index="03"
              title="Shielded Yield"
              description="Deposit shielded BTC into Vesu, Uncap, and Opus. Earn real yield. Claim it without revealing your position size to competitors."
              icon={<Layers size={28} />}
              tag="Vesu · Uncap · Opus"
              tagVariant="violet"
            />
            <FeatureCard
              index="04"
              title="Intent Dark Pool"
              description="Submit encrypted trade intents. A matching engine pairs complementary intents and settles atomically. MEV-immune by construction."
              icon={<Target size={28} />}
              tag="MEV Immune"
              tagVariant="cyan"
              iconVariant="cyan"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="section bg-[--surface] border-y border-[--border]">
        <div className="section-content">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-px bg-[--cyan]" />
              <span className="font-mono font-medium text-[11px] tracking-[0.2em] uppercase text-[--cyan]">
                How It Works
              </span>
            </div>
            <h2 className="font-display font-extrabold text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em]">
              Math, not trust.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-[--border] via-[--border-2] to-[--border]" />
            
            <StepCard
              number="01"
              title="Shield your assets"
              description="The ZK proof is generated on your device. Amount and identity never leave your browser. Only a commitment hash touches the chain."
            />
            <StepCard
              number="02"
              title="Execute privately"
              description="Swap, earn yield, or submit intents from inside the shield pool. Each operation generates a new ZK proof. Math validates correctness. Nothing else."
            />
            <StepCard
              number="03"
              title="Withdraw anywhere"
              description="Unshield to any address. The nullifier prevents double-spending. Your origin, amount, and history stay private. Permanently."
            />
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section id="compliance" className="section">
        <div className="section-content">
          <div className="card-accent bg-[--surface-2] border border-[rgba(139,92,246,0.18)] rounded-3xl p-12 md:p-14 relative overflow-hidden">
            {/* Radial gradient overlay */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[rgba(139,92,246,0.06)] to-transparent pointer-events-none" />
            
            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
              {/* Left column */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-px bg-[--violet]" />
                  <span className="font-mono font-medium text-[11px] tracking-[0.2em] uppercase text-[--violet-bright]">
                    Selective Disclosure
                  </span>
                </div>
                
                <h2 className="font-display font-extrabold text-[48px] md:text-[56px] leading-[1.0] tracking-[-0.02em]">
                  Privacy by design.<br />
                  <span className="text-[--text]">Compliance by choice.</span>
                </h2>
                
                <p className="font-syne font-normal text-[15px] leading-[1.7] text-[--text-muted] max-w-[520px]">
                  Generate auditor-specific compliance proofs that disclose exactly what regulators need. Control the scope. Control the audience. Control your data.
                </p>
                
                <Link href="/compliance" className="btn-primary inline-flex">
                  Generate Compliance Proof
                  <ArrowRight size={16} />
                </Link>
                
                <p className="font-mono font-medium text-[11px] tracking-[0.12em] text-[--text-subtle]">
                  Control exactly what each regulator sees
                </p>
              </div>

              {/* Right column — Disclosure list */}
              <div className="space-y-3">
                <DisclosureItem
                  variant="success"
                  title="Regulator sees: KYC status confirmed"
                  description="Your identity was verified. The regulator receives a proof, not your identity."
                />
                <DisclosureItem
                  variant="success"
                  title="Regulator sees: Amount below threshold"
                  description="Transaction is under the reporting threshold. The exact amount stays private."
                />
                <DisclosureItem
                  variant="success"
                  title="Regulator sees: Recipient is cleared"
                  description="Recipient is provably not on any sanctions list. Zero-knowledge non-membership."
                />
                <DisclosureItem
                  variant="danger"
                  title="Hidden: Wallet address · Exact amount · Protocol used"
                  description="Everything else is cryptographically private. The proof reveals nothing beyond scope."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Warning Section */}
      <section id="security" className="section">
        <div className="section-content">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-px bg-[--warning]" />
              <span className="font-mono font-medium text-[11px] tracking-[0.2em] uppercase text-[--warning]">
                Security Model
              </span>
            </div>
            <h2 className="font-display font-extrabold text-[48px] md:text-[56px] leading-[1.0] tracking-[-0.02em]">
              You are the custodian.
            </h2>
            <p className="font-syne font-normal text-[15px] leading-[1.7] text-[--text-muted] max-w-[520px] mt-4">
              PHANTOM is non-custodial. Your keys. Your notes. Your responsibility.
            </p>
          </div>

          <div className="max-w-3xl">
            <div className="bg-[rgba(251,191,36,0.04)] border border-[rgba(251,191,36,0.18)] rounded-2xl p-6">
              <div className="flex gap-4">
                {/* Warning icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-mono font-extrabold text-[11px] tracking-[0.12em] uppercase text-[--warning] mb-2">
                      CRITICAL: Shield Notes
                    </h3>
                    <p className="font-syne font-normal text-[14px] leading-[1.6] text-[--text-muted]">
                      Your shield notes are stored <span className="font-semibold text-[--text]">only in this browser</span> with AES-256 encryption.
                      They are the cryptographic keys to your shielded funds.
                      If you clear browser data without exporting a backup,
                      your funds <span className="font-semibold text-[--text]">cannot be recovered by anyone</span> — including PHANTOM.
                      Always export and securely store your encrypted note backups.
                    </p>
                  </div>
                  
                  <button className="btn-ghost text-sm">
                    Export Backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developers" className="section bg-[--surface] border-y border-[--border]">
        <div className="section-content">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-px bg-[--cyan]" />
                <span className="font-mono font-medium text-[11px] tracking-[0.2em] uppercase text-[--cyan]">
                  Developers
                </span>
              </div>
              
              <h2 className="font-display font-extrabold text-[48px] md:text-[56px] leading-[1.0] tracking-[-0.02em]">
                Integrate in minutes.<br />
                <span className="text-[--text]">Not months.</span>
              </h2>
              
              <p className="font-syne font-normal text-[15px] leading-[1.7] text-[--text-muted] max-w-[480px]">
                Type-safe SDK with full TypeScript support. React hooks for every operation. WASM prover runs client-side — no servers required.
              </p>
              
              <Link href="/developers" className="btn-ghost inline-flex">
                Read Documentation
                <ArrowRight size={16} />
              </Link>
              
              <ul className="space-y-3 pt-4">
                <li className="flex items-start gap-3">
                  <span className="text-[--violet-bright] mt-1">◆</span>
                  <span className="font-syne font-normal text-[13px] text-[--text-muted]">
                    Type-safe SDK with full TypeScript support
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[--violet-bright] mt-1">◆</span>
                  <span className="font-syne font-normal text-[13px] text-[--text-muted]">
                    React hooks for every operation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[--violet-bright] mt-1">◆</span>
                  <span className="font-syne font-normal text-[13px] text-[--text-muted]">
                    WASM prover runs client-side — no servers
                  </span>
                </li>
              </ul>
            </div>

            {/* Right column — Code block */}
            <div className="bg-[#080810] border border-[--border-2] rounded-2xl overflow-hidden">
              {/* Header bar */}
              <div className="bg-[--surface-3] border-b border-[--border] px-5 py-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
                  <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
                </div>
                <span className="font-mono font-normal text-[12px] text-[--text-subtle]">
                  integration.ts
                </span>
              </div>
              
              {/* Code body */}
              <div className="px-6 py-5 overflow-x-auto">
                <pre className="font-mono font-normal text-[13px] leading-[1.85]">
                  <code>
                    <span className="text-[#374151]">// npm install @phantom-btc/sdk</span>{'\n'}
                    <span className="text-[#C084FC]">import</span>{' '}
                    <span className="text-[#38BDF8]">{`{ PhantomSDK }`}</span>{' '}
                    <span className="text-[#C084FC]">from</span>{' '}
                    <span className="text-[#34D399]">'@phantom-btc/sdk'</span>{'\n\n'}
                    <span className="text-[#374151]">// Initialize — real Starknet RPC, real account</span>{'\n'}
                    <span className="text-[#C084FC]">const</span>{' '}
                    <span className="text-[#F1F5F9]">phantom</span>{' '}
                    <span className="text-[#C084FC]">=</span>{' '}
                    <span className="text-[#C084FC]">new</span>{' '}
                    <span className="text-[#F59E0B]">PhantomSDK</span>{`({`}{'\n'}
                    {'  '}rpcUrl:<span className="text-[#F1F5F9]"> STARKNET_RPC_URL</span>,{'\n'}
                    {'  '}account:<span className="text-[#F1F5F9]"> connectedAccount</span>,{'\n'}
                    {'  '}storagePassword:<span className="text-[#F1F5F9]"> userPassword</span>,{'\n'}
                    {`})`}{'\n\n'}
                    <span className="text-[#374151]">// Shield 0.5 wBTC → generates real ZK proof (~1.5s)</span>{'\n'}
                    <span className="text-[#C084FC]">const</span>{' '}
                    <span className="text-[#F1F5F9]">note</span>{' '}
                    <span className="text-[#C084FC]">=</span>{' '}
                    <span className="text-[#C084FC]">await</span>{' '}
                    <span className="text-[#38BDF8]">phantom.shield</span>{`({`}{'\n'}
                    {'  '}asset:<span className="text-[#F1F5F9]"> </span><span className="text-[#34D399]">'wBTC'</span>,{'\n'}
                    {'  '}amount:<span className="text-[#F1F5F9]"> </span><span className="text-[#FB923C]">50_000_000n</span>,{'\n'}
                    {`})`}{'\n\n'}
                    <span className="text-[#374151]">// Private swap via AVNU — real price, real execution</span>{'\n'}
                    <span className="text-[#C084FC]">const</span>{' '}
                    <span className="text-[#F1F5F9]">usdcNote</span>{' '}
                    <span className="text-[#C084FC]">=</span>{' '}
                    <span className="text-[#C084FC]">await</span>{' '}
                    <span className="text-[#38BDF8]">phantom.privateSwap</span>{`({`}{'\n'}
                    {'  '}noteIn:<span className="text-[#F1F5F9]"> note</span>,{'\n'}
                    {'  '}assetOut:<span className="text-[#F1F5F9]"> </span><span className="text-[#34D399]">'USDC'</span>,{'\n'}
                    {'  '}minAmountOut:<span className="text-[#F1F5F9]"> </span><span className="text-[#FB923C]">47_000_000_000n</span>,{'\n'}
                    {'  '}slippageTolerance:<span className="text-[#FB923C]"> 0.005</span>,{'\n'}
                    {`})`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

// Sub-components

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[--surface] p-6 text-center group">
      <div className="font-display font-extrabold text-[32px] text-[--text] mb-1 group-hover:text-[--violet-bright] transition-colors">
        {value}
      </div>
      <div className="font-mono font-medium text-[10px] tracking-[0.14em] uppercase text-[--text-subtle]">
        {label}
      </div>
    </div>
  )
}

function FeatureCard({
  index,
  title,
  description,
  icon,
  tag,
  tagVariant = 'violet',
  iconVariant = 'violet',
}: {
  index: string
  title: string
  description: string
  icon: React.ReactNode
  tag: string
  tagVariant?: 'violet' | 'cyan'
  iconVariant?: 'violet' | 'cyan'
}) {
  return (
    <div className="card-accent bg-[--surface] p-10 group">
      <div className="font-mono font-medium text-[10px] tracking-[0.14em] uppercase text-[--violet-bright] opacity-60 mb-6">
        {index} / {title.toUpperCase()}
      </div>
      
      <div className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center mb-6 ${
        iconVariant === 'cyan' ? 'bg-[--cyan-dim] border-[rgba(34,211,238,0.2)]' : 'bg-[--violet-dim] border-[rgba(139,92,246,0.2)]'
      } border text-[--${iconVariant === 'cyan' ? 'cyan' : 'violet-bright'}]`}>
        {icon}
      </div>
      
      <h3 className="font-display font-bold text-[20px] mb-3 group-hover:text-[--violet-bright] transition-colors">
        {title}
      </h3>
      
      <p className="font-syne font-normal text-[14px] leading-[1.7] text-[--text-muted]">
        {description}
      </p>
      
      <div className="mt-6">
        <span className={tagVariant === 'cyan' ? 'badge-cyan' : 'badge-violet'}>
          {tag}
        </span>
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative pt-4">
      <div className="font-display font-extrabold text-[80px] leading-none gradient-text opacity-30 mb-4">
        {number}
      </div>
      <h3 className="font-display font-bold text-[18px] mb-3">
        {title}
      </h3>
      <p className="font-syne font-normal text-[14px] leading-[1.7] text-[--text-muted]">
        {description}
      </p>
    </div>
  )
}

function DisclosureItem({
  variant,
  title,
  description,
}: {
  variant: 'success' | 'danger'
  title: string
  description: string
}) {
  return (
    <div className="bg-[--surface-3] rounded-xl p-4 border border-[--border] hover:border-[--border-2] transition-colors">
      <div className="flex gap-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          variant === 'success' 
            ? 'bg-[rgba(52,211,153,0.12)] text-[--success]' 
            : 'bg-[rgba(248,113,113,0.1)] text-[--danger]'
        }`}>
          {variant === 'success' ? '✓' : '✕'}
        </div>
        <div>
          <div className="font-syne font-semibold text-[13px] text-[--text] mb-1">
            {title}
          </div>
          <div className="font-syne font-normal text-[12px] leading-[1.6] text-[--text-muted]">
            {description}
          </div>
        </div>
      </div>
    </div>
  )
}

function ShieldVisual() {
  return (
    <div className="relative w-[480px] h-[480px]">
      {/* Rotating rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ring 1 */}
        <div
          className="absolute w-[380px] h-[380px] border border-[rgba(139,92,246,0.18)] rounded-full"
          style={{ animation: 'orbit 30s linear infinite' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[--violet-bright] shadow-[0_0_14px_rgba(139,92,246,0.8)]" />
        </div>
        
        {/* Ring 2 */}
        <div
          className="absolute w-[300px] h-[300px] border border-[rgba(34,211,238,0.13)] rounded-full"
          style={{ animation: 'orbit 20s linear infinite reverse' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[--cyan] shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
        </div>
        
        {/* Ring 3 */}
        <div
          className="absolute w-[220px] h-[220px] border border-[rgba(139,92,246,0.09)] rounded-full"
          style={{ animation: 'orbit 15s linear infinite' }}
        />
      </div>
      
      {/* Hexagon core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-[150px] h-[150px] relative"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: 'linear-gradient(145deg, #161622, #0C0C12)',
            animation: 'core-pulse 4s ease-in-out infinite',
          }}
        >
          {/* Inner shield icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="1.5">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Floating data fragments */}
      <div className="absolute inset-0">
        {['0x8B5C', 'Poseidon', 'f246', 'ZK✓', 'STARK', '0xA78B'].map((text, i) => (
          <div
            key={i}
            className="absolute font-mono font-normal text-[10px] opacity-50"
            style={{
              color: i % 2 === 0 ? 'var(--violet-bright)' : 'var(--cyan)',
              left: `${20 + (i * 12)}%`,
              top: `${15 + (i % 3) * 25}%`,
              animation: `float ${6 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  )
}
