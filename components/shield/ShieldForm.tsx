'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldVisual } from '../ui/ShieldVisual'

type ShieldStep = 'idle' | 'approving' | 'generating' | 'submitting' | 'success'

interface ShieldFormProps {
  onSuccess?: (noteId: string) => void
}

export function ShieldForm({ onSuccess }: ShieldFormProps) {
  const [step, setStep] = useState<ShieldStep>('idle')
  const [amount, setAmount] = useState('')
  const [asset, setAsset] = useState('wBTC')

  const handleShield = () => {
    if (!amount || parseFloat(amount) <= 0) return
    setStep('approving')
    // Simulate steps for now
    setTimeout(() => setStep('generating'), 2000)
    setTimeout(() => setStep('submitting'), 5000)
    setTimeout(() => {
      setStep('success')
      onSuccess?.(`phantom-${Date.now().toString().slice(-4)}`)
    }, 7000)
  }

  return (
    <div className="bg-panel border border-subtle rounded-2xl p-8">
      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-display font-bold text-2xl mb-2 text-parchment">Shield Your Bitcoin</h2>
              <p className="font-body text-sm text-secondary">
                Deposit wBTC, tBTC, LBTC or SolvBTC into the shield pool. 
                Only a ZK commitment appears on-chain.
              </p>
            </div>

            {/* Asset Selector */}
            <div>
              <label className="font-mono text-xs tracking-[0.14em] uppercase text-muted mb-2 block">
                Asset
              </label>
              <div className="relative">
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="input appearance-none cursor-pointer"
                >
                  <option value="wBTC">wBTC</option>
                  <option value="tBTC">tBTC</option>
                  <option value="LBTC">LBTC</option>
                  <option value="SolvBTC">SolvBTC</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="font-mono text-xs tracking-[0.14em] uppercase text-muted mb-2 block">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input text-2xl font-mono pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-lg text-muted">
                  {asset}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <button className="font-mono text-xs tracking-[0.1em] uppercase text-amber hover:underline">
                  MAX
                </button>
                <span className="font-body text-sm text-muted">
                  ≈ ${amount ? (parseFloat(amount) * 98472.32).toFixed(2) : '0.00'} USD
                </span>
              </div>
            </div>

            {/* Fee Preview */}
            <div className="p-4 bg-surface rounded-xl border border-subtle space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Network fee</span>
                <span className="font-mono text-secondary">~0.001 STRK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Shield fee</span>
                <span className="font-mono text-secondary">0.05%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Proof time</span>
                <span className="font-mono text-amber">~120ms</span>
              </div>
            </div>

            {/* Shield Button */}
            <button
              onClick={handleShield}
              disabled={!amount || parseFloat(amount) <= 0}
              className="btn-primary w-full"
            >
              ▶ Shield {amount || '0'} {asset}
            </button>

            <p className="font-mono text-xs text-muted text-center leading-relaxed">
              Your shield note will be stored locally with AES-256 encryption.
              Export a backup before clearing browser data.
            </p>
          </motion.div>
        )}

        {step === 'approving' && (
          <motion.div
            key="approving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-16 h-16 mx-auto">
              <div className="w-full h-full border-4 border-amber border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-2 text-parchment">Awaiting wallet approval...</h3>
              <p className="font-body text-sm text-secondary">
                Approve PHANTOM to spend your {asset}.
                This is a standard ERC-20 approval.
              </p>
            </div>
            <button disabled className="btn-primary opacity-50">
              Waiting for approval...
            </button>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <ShieldVisual />
            </div>
            
            <div className="text-center">
              <h3 className="font-display font-bold text-xl mb-2 text-parchment">Generating ZK Proof</h3>
              <p className="font-body text-sm text-secondary">
                Your private data never leaves this device
              </p>
            </div>

            {/* Proof Terminal */}
            <div className="code-block">
              <div className="code-block-header">
                <span className="font-mono text-xs text-muted">PHANTOM ZK ENGINE v0.3.1</span>
              </div>
              <div className="code-block-content text-xs">
                <div className="text-zk-green">{'>'} Initializing Stwo prover...</div>
                <div className="text-zk-green">{'>'} Loading circuit constraints...</div>
                <div className="text-zk-green">{'>'} Sampling randomness...</div>
                <div className="text-zk-green">{'>'} Building Merkle witness...</div>
                <div className="text-zk-green">{'>'} Computing Poseidon2 hash [1/2]...</div>
                <div className="text-zk-green">{'>'} Computing Poseidon2 hash [2/2]...</div>
                <div className="text-amber animate-pulse">{'>'} Generating STARK proof...</div>
                <div className="mt-2 text-muted">Constraints: 4,312 / 4,312</div>
                <div className="text-muted">Elapsed: 89ms</div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-16 h-16 mx-auto">
              <div className="w-full h-full border-4 border-amber border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-2 text-parchment">Submitting to Starknet...</h3>
              <p className="font-body text-sm text-secondary">
                Your shield transaction is being confirmed on-chain.
              </p>
            </div>
            <div className="p-3 bg-surface rounded-lg inline-block">
              <div className="font-mono text-xs text-muted">Tx:</div>
              <div className="font-mono text-xs text-amber">0x4f3a...c91b</div>
            </div>
            <div className="text-sm text-muted">
              Block ~#842,341 · Estimated: 8s
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-zk-green-dim flex items-center justify-center">
              <svg className="w-10 h-10 text-zk-green" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 6L9 17L4 12"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl mb-2 text-parchment">✓ Bitcoin Shielded</h3>
              <p className="font-body text-secondary">
                {amount} {asset} successfully hidden.
              </p>
              <p className="font-mono text-sm text-amber mt-2">
                Note #{Date.now().toString().slice(-4)}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep('idle')}
                className="btn-primary flex-1"
              >
                Shield More
              </button>
              <button className="btn-outline flex-1">
                View Notes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
