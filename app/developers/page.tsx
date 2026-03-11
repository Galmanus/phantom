'use client'

import { useState } from 'react'

type Section = 'quickstart' | 'sdk' | 'architecture' | 'contracts' | 'examples'

const sections: { id: Section; label: string }[] = [
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'sdk', label: 'SDK Reference' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'examples', label: 'Examples' },
]

export default function DevelopersPage() {
  const [activeSection, setActiveSection] = useState<Section>('quickstart')

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-parchment mb-4">
            Developers
          </h1>
          <p className="text-lg text-secondary">
            Build private DeFi applications with PHANTOM's TypeScript SDK.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 font-mono text-sm tracking-wide transition-colors ${
                    activeSection === section.id
                      ? 'text-amber bg-amber-glow rounded-lg'
                      : 'text-muted hover:text-secondary'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Quick Start */}
            {activeSection === 'quickstart' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">
                    Quick Start
                  </h2>
                  <p className="text-secondary mb-6">
                    Get up and running with PHANTOM in under 5 minutes.
                  </p>
                </div>

                <div className="code-block">
                  <div className="code-block-header">
                    <span className="font-mono text-xs text-muted">Install</span>
                  </div>
                  <div className="code-block-content text-secondary">
                    <div className="text-muted">npm install @phantom-btc/sdk</div>
                    <div className="text-muted"># or</div>
                    <div className="text-muted">pnpm add @phantom-btc/sdk</div>
                  </div>
                </div>

                <div className="code-block">
                  <div className="code-block-header">
                    <span className="font-mono text-xs text-muted">Initialize</span>
                  </div>
                  <div className="code-block-content text-secondary">
                    <div className="text-muted">// Initialize with a Starknet wallet</div>
                    <div className="mb-2">
                      <span className="text-amber">const</span> phantom = <span className="text-amber">await</span> PhantomClient.<span className="text-zk-green">fromWallet</span>(account)
                    </div>
                  </div>
                </div>

                <div className="code-block">
                  <div className="code-block-header">
                    <span className="font-mono text-xs text-muted">Shield BTC</span>
                  </div>
                  <div className="code-block-content text-secondary">
                    <div className="text-muted">// Shield 0.1 wBTC</div>
                    <div>
                      <span className="text-amber">const</span> note = <span className="text-amber">await</span> phantom.<span className="text-zk-green">shield</span>({'{'}
                      <br />&nbsp;&nbsp;asset: <span className="text-zk-green">'wBTC'</span>,
                      <br />&nbsp;&nbsp;amount: <span className="text-amber">10000000n</span>,
                      <br />{'}'})
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface rounded-xl border border-subtle">
                  <h3 className="font-display font-semibold text-parchment mb-2">
                    ⚡ Prerequisites
                  </h3>
                  <ul className="space-y-2 text-sm text-secondary">
                    <li>• Starknet wallet (Argent X or Braavos)</li>
                    <li>• wBTC or other supported asset on Starknet</li>
                    <li>• STRK for gas fees</li>
                  </ul>
                </div>
              </div>
            )}

            {/* SDK Reference */}
            {activeSection === 'sdk' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">
                    SDK Reference
                  </h2>
                  <p className="text-secondary mb-6">
                    Complete API reference for the PHANTOM SDK.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="card">
                    <h3 className="font-mono text-sm text-amber mb-2">PhantomClient</h3>
                    <h4 className="font-display font-bold text-lg text-parchment mb-3">
                      .fromWallet(account)
                    </h4>
                    <p className="text-sm text-secondary mb-4">
                      Initialize the client with a Starknet wallet account.
                    </p>
                    <div className="code-block">
                      <div className="code-block-content text-xs text-secondary">
                        <div><span className="text-amber">const</span> phantom = <span className="text-amber">await</span> PhantomClient.<span className="text-zk-green">fromWallet</span>(account)</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-mono text-sm text-amber mb-2">shield()</h3>
                    <h4 className="font-display font-bold text-lg text-parchment mb-3">
                      Shield assets into the pool
                    </h4>
                    <p className="text-sm text-secondary mb-4">
                      Deposits assets and creates a shielded note.
                    </p>
                    <div className="code-block">
                      <div className="code-block-content text-xs text-secondary">
                        <div><span className="text-amber">const</span> note = <span className="text-amber">await</span> phantom.<span className="text-zk-green">shield</span>({'{'} {'}'})</div>
                        <div className="mt-2 text-muted">// Parameters:</div>
                        <div>- asset: <span className="text-zk-green">'wBTC'</span> | <span className="text-zk-green">'tBTC'</span> | <span className="text-zk-green">'LBTC'</span></div>
                        <div>- amount: bigint (in wei)</div>
                        <div>- recipient?: string (optional)</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-mono text-sm text-amber mb-2">unshield()</h3>
                    <h4 className="font-display font-bold text-lg text-parchment mb-3">
                      Withdraw from the pool
                    </h4>
                    <p className="text-sm text-secondary mb-4">
                      Withdraws shielded assets to any address.
                    </p>
                    <div className="code-block">
                      <div className="code-block-content text-xs text-secondary">
                        <div><span className="text-amber">await</span> phantom.<span className="text-zk-green">unshield</span>({'{'} {'}'})</div>
                        <div className="mt-2 text-muted">// Parameters:</div>
                        <div>- note: ShieldedNote</div>
                        <div>- recipient: string</div>
                        <div>- amount: bigint</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-mono text-sm text-amber mb-2">privateSwap()</h3>
                    <h4 className="font-display font-bold text-lg text-parchment mb-3">
                      Swap without exposure
                    </h4>
                    <p className="text-sm text-secondary mb-4">
                      Executes a private swap via AVNU.
                    </p>
                    <div className="code-block">
                      <div className="code-block-content text-xs text-secondary">
                        <div><span className="text-amber">const</span> result = <span className="text-amber">await</span> phantom.<span className="text-zk-green">privateSwap</span>({'{'} {'}'})</div>
                        <div className="mt-2 text-muted">// Parameters:</div>
                        <div>- note: ShieldedNote</div>
                        <div>- tokenOut: string</div>
                        <div>- minAmountOut: bigint</div>
                        <div>- slippage: number (0-1)</div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-mono text-sm text-amber mb-2">selectiveDisclosure()</h3>
                    <h4 className="font-display font-bold text-lg text-parchment mb-3">
                      Generate compliance proofs
                    </h4>
                    <p className="text-sm text-secondary mb-4">
                      Creates zero-knowledge proofs for regulatory compliance.
                    </p>
                    <div className="code-block">
                      <div className="code-block-content text-xs text-secondary">
                        <div><span className="text-amber">const</span> proof = <span className="text-amber">await</span> phantom.<span className="text-zk-green">selectiveDisclosure</span>({'{'} {'}'})</div>
                        <div className="mt-2 text-muted">// Types:</div>
                        <div>- <span className="text-zk-green">'kyc_status'</span></div>
                        <div>- <span className="text-zk-green">'amount_below_threshold'</span></div>
                        <div>- <span className="text-zk-green">'sanctions_cleared'</span></div>
                        <div>- <span className="text-zk-green">'full_audit'</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Architecture */}
            {activeSection === 'architecture' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">
                    Architecture
                  </h2>
                  <p className="text-secondary mb-6">
                    PHANTOM's five-layer architecture ensures privacy at every level.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      layer: 'Layer 5',
                      name: 'Frontend',
                      description: 'React + TypeScript UI with Zustand state management',
                    },
                    {
                      layer: 'Layer 4',
                      name: 'SDK',
                      description: 'TypeScript client library with React hooks',
                    },
                    {
                      layer: 'Layer 3',
                      name: 'WASM Prover',
                      description: 'Client-side ZK proof generation using Stwo',
                    },
                    {
                      layer: 'Layer 2',
                      name: 'ZK Circuits',
                      description: 'Cairo circuits for shield, swap, yield, and compliance',
                    },
                    {
                      layer: 'Layer 1',
                      name: 'Starknet Contracts',
                      description: 'On-chain verification and asset management',
                    },
                  ].map((item, index) => (
                    <div key={item.layer} className="flex gap-4">
                      <div className="w-16 flex-shrink-0">
                        <div className="font-mono text-xs text-amber">{item.layer}</div>
                      </div>
                      <div className="flex-1 card">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-display font-bold text-parchment">
                              {item.name}
                            </h4>
                            <p className="text-sm text-secondary">{item.description}</p>
                          </div>
                          {index > 0 && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-subtle-2">
                              <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contracts */}
            {activeSection === 'contracts' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">
                    Contract Addresses
                  </h2>
                  <p className="text-secondary mb-6">
                    Smart contract addresses for Starknet mainnet and testnet.
                  </p>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-sm text-muted uppercase">Network</span>
                    <select className="input w-auto py-2">
                      <option>Sepolia (Testnet)</option>
                      <option>Mainnet</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'PHANTOM Pool', address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004fa7' },
                      { name: 'Verifier', address: '0x01435498bf07da5fec7e3442e32f27e9f4a4c4a7b8a9c0d1e2f3a4b5c6d7e8f9' },
                      { name: 'Compliance Oracle', address: '0x0234987654321098a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f' },
                      { name: 'Intent Matcher', address: '0x0349876543210987a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f' },
                    ].map((contract) => (
                      <div key={contract.name} className="p-4 bg-surface rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-semibold text-parchment">{contract.name}</span>
                          <button className="text-xs text-amber hover:underline">Copy</button>
                        </div>
                        <div className="font-mono text-xs text-muted break-all">
                          {contract.address}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Examples */}
            {activeSection === 'examples' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-parchment mb-4">
                    Examples
                  </h2>
                  <p className="text-secondary mb-6">
                    Example projects and tutorials to get you started.
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    {
                      title: 'Basic Shield/Unshield',
                      description: 'A simple example of shielding and unshielding BTC.',
                      tags: ['Beginner', 'React'],
                    },
                    {
                      title: 'Private AMM Swap',
                      description: 'Integrate with AVNU for private token swaps.',
                      tags: ['Intermediate', 'AVNU'],
                    },
                    {
                      title: 'Yield Aggregator',
                      description: 'Build a shielded yield farming strategy.',
                      tags: ['Advanced', 'DeFi'],
                    },
                    {
                      title: 'Compliance Dashboard',
                      description: 'Generate and manage compliance proofs.',
                      tags: ['Enterprise', 'RegTech'],
                    },
                  ].map((example, index) => (
                    <div key={index} className="card hover:border-amber-dim cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-display font-bold text-parchment mb-2">
                            {example.title}
                          </h4>
                          <p className="text-sm text-secondary mb-3">{example.description}</p>
                          <div className="flex gap-2">
                            {example.tags.map((tag) => (
                              <span key={tag} className="badge badge-pending text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
