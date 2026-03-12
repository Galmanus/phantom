'use client'
import { useState } from 'react'
import { usePhantom } from '@/app/providers/PhantomProvider'
import { useAccount } from '@starknet-react/core'

type DisclosureScope = 'full' | 'range' | 'existence'

interface ViewingKeyConfig {
  scope: DisclosureScope
  expiresAt: number | null
  recipientLabel: string
  includeYield: boolean
}

export default function CompliancePage() {
  const { address } = useAccount()
  const { isReady } = usePhantom()
  const [config, setConfig] = useState<ViewingKeyConfig>({
    scope: 'full',
    expiresAt: null,
    recipientLabel: '',
    includeYield: false,
  })
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!isReady) return
    setIsGenerating(true)
    try {
      const key = await generateViewingKey(config, address!)
      setGeneratedKey(key)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generatedKey) return
    navigator.clipboard.writeText(generatedKey)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-void px-8 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-6 h-6 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h1 className="text-3xl font-display font-bold text-text-primary">
              Compliance & Disclosure
            </h1>
          </div>
          <p className="text-text-primary/60 leading-relaxed">
            Generate a viewing key to prove your transaction history to
            regulators, auditors, or exchanges — without revealing your
            full wallet or future activity.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-panel border border-amber/10 rounded-xl p-5 mb-8">
          <p className="text-xs font-mono text-amber uppercase tracking-wider mb-4">
            How viewing keys work
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'You generate',
                desc: 'A cryptographic key derived from your wallet. Never exposing your private key.',
              },
              {
                step: '02',
                title: 'You share',
                desc: 'Only with who you choose. The key is scoped — full history, range, or existence only.',
              },
              {
                step: '03',
                title: 'They verify',
                desc: 'The recipient can verify your transactions on-chain. Cannot access future activity.',
              },
            ].map(item => (
              <div key={item.step}>
                <div className="text-2xl font-mono text-amber/30 font-bold mb-2">
                  {item.step}
                </div>
                <div className="font-medium text-text-primary mb-1">{item.title}</div>
                <div className="text-xs text-text-primary/50">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-panel border border-amber/20 rounded-2xl p-6 mb-6">
          <p className="text-sm font-medium text-text-primary mb-5">
            Configure your viewing key
          </p>

          {/* Scope selector */}
          <div className="mb-5">
            <label className="text-xs text-text-primary/50 mb-3 block">
              Disclosure scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                {
                  value: 'full' as DisclosureScope,
                  label: 'Full history',
                  desc: 'All amounts and timestamps',
                },
                {
                  value: 'range' as DisclosureScope,
                  label: 'Range proof',
                  desc: 'Prove amount within range without exact value',
                },
                {
                  value: 'existence' as DisclosureScope,
                  label: 'Existence only',
                  desc: 'Prove transactions exist, no amounts',
                },
              ] as const).map(option => (
                <button
                  key={option.value}
                  onClick={() => setConfig(c => ({ ...c, scope: option.value }))}
                  className={`
                    text-left p-3 rounded-xl border text-xs transition-all
                    ${config.scope === option.value
                      ? 'border-amber bg-amber/10'
                      : 'border-amber/20 hover:border-amber/40'
                    }
                  `}
                >
                  <div className="font-medium text-text-primary mb-1">{option.label}</div>
                  <div className="text-text-primary/50">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient label */}
          <div className="mb-5">
            <label className="text-xs text-text-primary/50 mb-2 block">
              Recipient (optional, for your records)
            </label>
            <input
              type="text"
              placeholder="e.g. Chainalysis, IRS, Binance compliance"
              value={config.recipientLabel}
              onChange={e => setConfig(c => ({ ...c, recipientLabel: e.target.value }))}
              className="w-full bg-void border border-amber/20 rounded-xl px-4 py-3
                         text-text-primary placeholder-text-primary/20 text-sm
                         focus:outline-none focus:border-amber/60"
            />
          </div>

          {/* Include yield toggle */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-text-primary">Include yield history</div>
              <div className="text-xs text-text-primary/50">
                Show earnings from yield strategies
              </div>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, includeYield: !c.includeYield }))}
              className={`
                w-11 h-6 rounded-full transition-colors relative
                ${config.includeYield ? 'bg-amber' : 'bg-amber/20'}
              `}
            >
              <div className={`
                absolute top-1 w-4 h-4 rounded-full bg-void transition-transform
                ${config.includeYield ? 'translate-x-6' : 'translate-x-1'}
              `} />
            </button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber/5 border border-amber/20
                          rounded-xl p-3 mb-5">
            <svg className="w-4 h-4 text-amber shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-text-primary/60">
              This viewing key is permanent for past activity. Anyone with this key
              can verify your historical transactions. Share only with trusted parties.
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!isReady || isGenerating}
            className="w-full bg-amber text-void font-bold py-4 rounded-xl
                       hover:bg-amber/90 transition-colors disabled:opacity-40"
          >
            {isGenerating ? 'Generating...' : 'Generate Viewing Key'}
          </button>
        </div>

        {/* Generated key display */}
        {generatedKey && (
          <div className="bg-panel border border-zk-green/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-zk-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-zk-green">Viewing key generated</span>
            </div>

            {/* Key display */}
            <div className="bg-void rounded-xl p-4 font-mono text-xs
                            text-text-primary/70 break-all mb-4 leading-relaxed">
              {generatedKey}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2
                           border border-amber/30 text-amber py-3 rounded-xl
                           hover:bg-amber/10 transition-colors text-sm font-medium"
              >
                {isCopied
                  ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  )
                  : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy key
                    </>
                  )
                }
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([generatedKey], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `phantom-viewing-key-${Date.now()}.txt`
                  a.click()
                }}
                className="flex items-center justify-center gap-2
                           border border-amber/30 text-amber py-3 px-4
                           rounded-xl hover:bg-amber/10 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>

            {/* Scope summary */}
            <div className="mt-4 text-xs text-text-primary/40">
              Scope: {config.scope} •
              {config.includeYield ? ' includes yield' : ' excludes yield'} •
              {config.recipientLabel ? ` for ${config.recipientLabel}` : ' no recipient set'}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Placeholder — replace with PhantomKeyManager.generateViewingKey() when ready
async function generateViewingKey(config: ViewingKeyConfig, address: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(
    JSON.stringify({ address, scope: config.scope, ts: Date.now() })
  )
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `phantom_vk_${config.scope}_${hashHex}`
}
