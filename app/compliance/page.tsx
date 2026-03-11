'use client'

import { useState } from 'react'

interface Authority {
  id: string
  name: string
  scope: string
  jurisdiction: string
}

const authorities: Authority[] = [
  { id: '1', name: 'CoinbaseKYC', scope: 'Full Audit', jurisdiction: 'US (FinCEN)' },
  { id: '2', name: 'Chainalysis', scope: 'Sanctions', jurisdiction: 'Global' },
  { id: '3', name: 'Merkle Finance', scope: 'Amount Range', jurisdiction: 'EU (MiCA)' },
]

type DisclosureType = 'kyc' | 'amount' | 'sanctions' | 'full'

export default function CompliancePage() {
  const [step, setStep] = useState(1)
  const [disclosureType, setDisclosureType] = useState<DisclosureType | null>(null)
  const [threshold, setThreshold] = useState('10000')
  const [proofGenerated, setProofGenerated] = useState(false)
  const [sendingTo, setSendingTo] = useState('')

  const generateProof = () => {
    setStep(2)
    // Simulate proof generation
    setTimeout(() => {
      setProofGenerated(true)
    }, 2000)
  }

  const disclosureOptions = [
    {
      id: 'kyc' as DisclosureType,
      title: 'KYC Status Only',
      description: 'I passed KYC. I won\'t say where, when, or what tier.',
    },
    {
      id: 'amount' as DisclosureType,
      title: 'Amount Below Threshold',
      description: 'Prove my total position is below a specified amount.',
    },
    {
      id: 'sanctions' as DisclosureType,
      title: 'Sanctions Cleared',
      description: 'No sanctioned addresses in my transaction graph.',
    },
    {
      id: 'full' as DisclosureType,
      title: 'Full Audit (share FVK)',
      description: 'Here is my Full Viewing Key. You can see everything.',
      warning: true,
    },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-parchment mb-4">
            Compliance
          </h1>
          <p className="text-lg text-secondary">
            Generate selective disclosure proofs for regulators and auditors.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Regulator Directory */}
          <div>
            <h2 className="font-mono text-sm tracking-[0.2em] uppercase text-muted mb-6">
              Registered Compliance Authorities
            </h2>
            
            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="text-left font-mono text-xs text-muted uppercase tracking-wider py-3">Name</th>
                    <th className="text-left font-mono text-xs text-muted uppercase tracking-wider py-3">Scope</th>
                    <th className="text-left font-mono text-xs text-muted uppercase tracking-wider py-3">Jurisdiction</th>
                  </tr>
                </thead>
                <tbody>
                  {authorities.map((authority) => (
                    <tr key={authority.id} className="border-b border-subtle last:border-0">
                      <td className="py-4 font-display font-semibold text-parchment">{authority.name}</td>
                      <td className="py-4 text-secondary">{authority.scope}</td>
                      <td className="py-4 text-muted font-mono text-sm">{authority.jurisdiction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="mt-4 btn-outline text-sm">
              + Add custom authority address
            </button>
          </div>

          {/* Right: Disclosure Builder */}
          <div>
            <h2 className="font-mono text-sm tracking-[0.2em] uppercase text-muted mb-6">
              Disclosure Builder
            </h2>

            <div className="card">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                      step >= s ? 'bg-amber text-void' : 'bg-surface text-muted'
                    }`}>
                      {s}
                    </div>
                    {s < 3 && (
                      <div className={`w-8 h-px ${step > s ? 'bg-amber' : 'bg-subtle'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Choose what to prove */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-parchment mb-4">
                    Choose what to prove
                  </h3>
                  
                  {disclosureOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setDisclosureType(option.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        disclosureType === option.id
                          ? 'border-amber bg-amber-glow'
                          : 'border-subtle bg-surface hover:border-subtle-2'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          disclosureType === option.id ? 'border-amber' : 'border-subtle-2'
                        }`}>
                          {disclosureType === option.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-amber" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-semibold text-parchment">
                              {option.title}
                            </span>
                            {option.warning && (
                              <span className="badge badge-pending">Warning</span>
                            )}
                          </div>
                          <p className="text-sm text-secondary mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Threshold input for amount disclosure */}
                  {disclosureType === 'amount' && (
                    <div className="mt-4 p-4 bg-surface rounded-lg">
                      <label className="font-mono text-xs text-muted uppercase tracking-wider">
                        Threshold (USD)
                      </label>
                      <input
                        type="text"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        className="input mt-2"
                        placeholder="Enter amount"
                      />
                    </div>
                  )}

                  <button
                    onClick={generateProof}
                    disabled={!disclosureType}
                    className="btn-primary w-full mt-6"
                  >
                    Generate Proof →
                  </button>
                </div>
              )}

              {/* Step 2: Generating proof */}
              {step === 2 && !proofGenerated && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-amber border-t-transparent animate-spin" />
                  <h3 className="font-display font-bold text-lg text-parchment mb-2">
                    Generating compliance proof...
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    Type: {disclosureType === 'amount' ? `Amount Below Threshold ($${threshold})` : disclosureType === 'kyc' ? 'KYC Status Only' : disclosureType === 'sanctions' ? 'Sanctions Cleared' : 'Full Audit'}
                  </p>
                  
                  {/* Terminal animation */}
                  <div className="code-block text-left text-xs">
                    <div className="code-block-content">
                      <div className="text-zk-green">{'>'} Initializing ZK prover...</div>
                      <div className="text-zk-green">{'>'} Loading compliance circuit...</div>
                      <div className="text-zk-green">{'>'} Computing commitment proof...</div>
                      <div className="text-amber animate-pulse">{'>'} Generating STARK proof...</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Share the proof */}
              {step === 2 && proofGenerated && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zk-green-dim flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-zk-green">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="font-display font-bold text-xl text-parchment mb-2">
                      Proof Generated
                    </h3>
                    <p className="text-sm text-secondary">
                      This proof certifies your compliance without revealing sensitive data.
                    </p>
                  </div>

                  <div className="p-4 bg-surface rounded-xl border border-subtle">
                    <div className="font-mono text-xs text-muted uppercase tracking-wider mb-2">Proof Summary</div>
                    <p className="text-sm text-secondary">
                      {disclosureType === 'amount' 
                        ? `The holder's total shielded position is below $${threshold} USD.`
                        : disclosureType === 'kyc'
                        ? 'The holder has passed KYC verification.'
                        : disclosureType === 'sanctions'
                        ? 'No sanctioned addresses found in transaction graph.'
                        : 'Full Viewing Key shared for complete audit access.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="btn-outline text-sm">
                      Copy proof link
                    </button>
                    <button className="btn-outline text-sm">
                      Download proof.json
                    </button>
                  </div>

                  <div className="pt-4 border-t border-subtle">
                    <label className="font-mono text-xs text-muted uppercase tracking-wider mb-2 block">
                      Send to authority
                    </label>
                    <div className="flex gap-2">
                      <select 
                        value={sendingTo}
                        onChange={(e) => setSendingTo(e.target.value)}
                        className="input flex-1"
                      >
                        <option value="">Select authority...</option>
                        {authorities.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <button className="btn-primary text-sm px-4">
                        Send
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>Validity: 30 days</span>
                    <span className="text-subtle-2">·</span>
                    <span>Block #842,447</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
