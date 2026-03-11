'use client'
import { useState } from 'react'

type Section = 'quickstart' | 'sdk' | 'architecture' | 'contracts' | 'examples'

export default function DevelopersPage() {
  const [activeSection, setActiveSection] = useState<Section>('quickstart')

  const sections = [
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'sdk', label: 'SDK Reference' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'examples', label: 'Examples' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Developers</h1>
        <p className="text-lg text-secondary mb-12">Build privacy into your BTCFi applications.</p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-24 space-y-1">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id as Section)} className={`block w-full text-left px-4 py-2 rounded-lg font-mono text-sm transition-all ${activeSection === s.id ? 'bg-amber text-void' : 'text-muted hover:text-parchment hover:bg-surface'}`}>{s.label}</button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {activeSection === 'quickstart' && (
              <div className="space-y-8">
                <section>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">Quick Start</h2>
                  <p className="text-secondary mb-6">Get up and running with PHANTOM SDK in under 5 minutes.</p>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Installation</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`npm install @phantom-btc/sdk`}
                    </pre>
                  </div>

                  <div className="card mt-4">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Initialize & Shield</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm">
{`import { PhantomClient } from '@phantom-btc/sdk'

// Initialize with wallet
const phantom = await PhantomClient.fromWallet(account)

// Shield 0.1 BTC
const note = await phantom.shield({
  asset: 'wBTC',
  amount: parseUnits('0.1', 8),
})

console.log('Shielded note:', note.id)`}
                    </pre>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'sdk' && (
              <div className="space-y-8">
                <section>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">SDK Reference</h2>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">PhantomClient</h3>
                    <p className="text-sm text-secondary mb-4">Main entry point for PHANTOM SDK.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`class PhantomClient {
  static async fromWallet(account: Account): Promise<PhantomClient>
  
  async shield(params: ShieldParams): Promise<Note>
  async unshield(params: UnshieldParams): Promise<string>
  async privateSwap(params: SwapParams): Promise<SwapResult>
  async selectiveDisclosure(params: DisclosureParams): Promise<Proof>
}`}
                    </pre>
                  </div>

                  <div className="card mt-4">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">shield()</h3>
                    <p className="text-sm text-secondary mb-4">Shield assets into the PHANTOM pool.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`const note = await phantom.shield({
  asset: 'wBTC',      // Asset symbol
  amount: BigInt,     // Amount in wei
  recipient?: string  // Optional: shield to another address
})`}
                    </pre>
                  </div>

                  <div className="card mt-4">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">selectiveDisclosure()</h3>
                    <p className="text-sm text-secondary mb-4">Generate compliance proofs without revealing full details.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`const proof = await phantom.selectiveDisclosure({
  type: 'amount_below_threshold',
  threshold: parseUnits('10000', 6),
})`}
                    </pre>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'architecture' && (
              <div className="space-y-8">
                <section>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">Architecture</h2>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">5-Layer Architecture</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-xs">5</div>
                        <div>
                          <div className="font-bold text-parchment">Frontend (React + starknet.js)</div>
                          <div className="text-sm text-muted">User interface and wallet integration</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-xs">4</div>
                        <div>
                          <div className="font-bold text-parchment">SDK (TypeScript)</div>
                          <div className="text-sm text-muted">Developer API and note management</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-xs">3</div>
                        <div>
                          <div className="font-bold text-parchment">WASM Prover</div>
                          <div className="text-sm text-muted">Client-side ZK proof generation</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-xs">2</div>
                        <div>
                          <div className="font-bold text-parchment">ZK Circuits (Cairo)</div>
                          <div className="text-sm text-muted">Privacy-preserving computation</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-xs">1</div>
                        <div>
                          <div className="font-bold text-parchment">Starknet Contracts</div>
                          <div className="text-sm text-muted">On-chain state and verification</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'contracts' && (
              <div className="space-y-8">
                <section>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">Contract Addresses</h2>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Sepolia Testnet</h3>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">PHANTOM Pool</span><span className="text-parchment">0x049d...fa3b</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">Verifier</span><span className="text-parchment">0x7a2c...8d4e</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">Compliance Oracle</span><span className="text-parchment">0x3f8b...c2a1</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">Intent Matcher</span><span className="text-parchment">0x1e4a...9f7c</span></div>
                    </div>
                  </div>

                  <div className="card mt-4">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Mainnet</h3>
                    <p className="text-sm text-muted">Coming soon. Monitor our announcements for deployment.</p>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'examples' && (
              <div className="space-y-8">
                <section>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">Example Repositories</h2>
                  
                  <div className="grid gap-4">
                    <a href="#" className="card hover:border-amber transition-all">
                      <h3 className="font-bold text-parchment mb-1">Basic Shield/Unshield</h3>
                      <p className="text-sm text-muted">Simple tutorial for shielding and unshielding BTC.</p>
                    </a>
                    <a href="#" className="card hover:border-amber transition-all">
                      <h3 className="font-bold text-parchment mb-1">Private AMM Swap</h3>
                      <p className="text-sm text-muted">Integrate private swaps into your DeFi app.</p>
                    </a>
                    <a href="#" className="card hover:border-amber transition-all">
                      <h3 className="font-bold text-parchment mb-1">Compliance Dashboard</h3>
                      <p className="text-sm text-muted">Build a regulator-facing compliance interface.</p>
                    </a>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
