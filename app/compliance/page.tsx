'use client'
import { useState } from 'react'

type DisclosureType = 'kyc' | 'amount' | 'sanctions' | 'full' | null
type Step = 'select' | 'generate' | 'share'

export default function CompliancePage() {
  const [step, setStep] = useState<Step>('select')
  const [disclosureType, setDisclosureType] = useState<DisclosureType>(null)
  const [threshold, setThreshold] = useState('10000')
  const [generating, setGenerating] = useState(false)

  const authorities = [
    { name: 'CoinbaseKYC', scope: 'Full Audit', jurisdiction: 'US (FinCEN)' },
    { name: 'Chainalysis', scope: 'Sanctions', jurisdiction: 'Global' },
    { name: 'Merkle Finance', scope: 'Amount Range', jurisdiction: 'EU (MiCA)' },
  ]

  const handleGenerate = () => {
    setStep('generate')
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setStep('share')
    }, 3000)
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Compliance</h1>
        <p className="text-lg text-secondary mb-12">Selective disclosure. Stay private. Prove compliance.</p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Regulator Directory */}
          <div className="lg:col-span-2 card">
            <h2 className="font-display font-bold text-lg text-parchment mb-4">Registered Compliance Authorities</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-muted font-mono text-xs uppercase">Name</th>
                    <th className="text-left py-3 text-muted font-mono text-xs uppercase">Scope</th>
                    <th className="text-left py-3 text-muted font-mono text-xs uppercase">Jurisdiction</th>
                  </tr>
                </thead>
                <tbody>
                  {authorities.map(a => (
                    <tr key={a.name} className="border-b border-border">
                      <td className="py-3 text-parchment">{a.name}</td>
                      <td className="py-3 text-muted">{a.scope}</td>
                      <td className="py-3 text-muted">{a.jurisdiction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-4 text-amber text-sm hover:underline">+ Add custom authority address</button>
          </div>

          {/* Disclosure Builder */}
          <div className="lg:col-span-3 card">
            <h2 className="font-display font-bold text-lg text-parchment mb-6">Disclosure Builder</h2>
            
            {step === 'select' && (
              <div className="space-y-4">
                <p className="text-sm text-secondary mb-4">Select the type of proof you want to generate:</p>
                
                <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${disclosureType === 'kyc' ? 'border-amber bg-amber-glow' : 'border-border bg-surface hover:border-amber-dim'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="disclosure" checked={disclosureType === 'kyc'} onChange={() => setDisclosureType('kyc')} className="mt-1" />
                    <div>
                      <div className="font-bold text-parchment">KYC Status Only</div>
                      <div className="text-sm text-muted">"I passed KYC. I won't say where, when, or what tier."</div>
                    </div>
                  </div>
                </label>

                <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${disclosureType === 'amount' ? 'border-amber bg-amber-glow' : 'border-border bg-surface hover:border-amber-dim'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="disclosure" checked={disclosureType === 'amount'} onChange={() => setDisclosureType('amount')} className="mt-1" />
                    <div className="flex-1">
                      <div className="font-bold text-parchment">Amount Below Threshold</div>
                      <div className="text-sm text-muted">Prove your total position is below:</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-muted">$</span>
                        <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="input w-32" placeholder="10000" />
                      </div>
                    </div>
                  </div>
                </label>

                <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${disclosureType === 'sanctions' ? 'border-amber bg-amber-glow' : 'border-border bg-surface hover:border-amber-dim'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="disclosure" checked={disclosureType === 'sanctions'} onChange={() => setDisclosureType('sanctions')} className="mt-1" />
                    <div>
                      <div className="font-bold text-parchment">Sanctions Cleared</div>
                      <div className="text-sm text-muted">"No sanctioned addresses in my transaction graph."</div>
                    </div>
                  </div>
                </label>

                <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${disclosureType === 'full' ? 'border-amber bg-amber-glow' : 'border-border bg-surface hover:border-amber-dim'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="disclosure" checked={disclosureType === 'full'} onChange={() => setDisclosureType('full')} className="mt-1" />
                    <div>
                      <div className="font-bold text-parchment">Full Audit (share FVK)</div>
                      <div className="text-sm text-muted">"Here is my Full Viewing Key. You can see everything."</div>
                      <div className="mt-2 text-xs text-warning">⚠ Use only with trusted regulatory authorities</div>
                    </div>
                  </div>
                </label>

                <button onClick={handleGenerate} disabled={!disclosureType} className="btn-primary w-full mt-4">Generate Proof</button>
              </div>
            )}

            {step === 'generate' && (
              <div className="py-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-glow border-2 border-amber flex items-center justify-center animate-pulse mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-amber"><path d="M12 2L20 7V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7L12 2Z" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <h3 className="font-display font-bold text-xl text-parchment mb-2">Generating Compliance Proof</h3>
                <p className="text-sm text-muted mb-4">Type: {disclosureType === 'amount' ? `Amount Below Threshold ($${threshold})` : disclosureType?.toUpperCase()}</p>
                <div className="bg-void rounded-xl p-4 font-mono text-xs text-left space-y-1">
                  <div className="text-zk-green">{'>'} Loading compliance circuit...</div>
                  <div className="text-zk-green">{'>'} Verifying Merkle membership...</div>
                  <div className="text-zk-green">{'>'} Computing threshold proof...</div>
                  <div className="text-amber animate-pulse">{'>'} Generating ZK proof...</div>
                </div>
              </div>
            )}

            {step === 'share' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-zk-green-dim flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-zk-green"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <h3 className="font-display font-bold text-xl text-parchment mb-2">✓ Proof Generated</h3>
                <p className="text-sm text-secondary mb-6">This proof certifies:</p>
                <div className="bg-surface rounded-xl p-4 text-left mb-6">
                  <p className="text-parchment">"The holder's total shielded position is below ${threshold} USD as of block #842,447"</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button className="btn-outline">Copy Proof Link</button>
                  <button className="btn-outline">Download .json</button>
                  <button className="btn-primary">Send to Authority ▼</button>
                </div>
                <p className="text-xs text-muted mt-4">Validity: 30 days · Block #842,447</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
