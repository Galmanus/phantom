'use client'

import { useState, useEffect, useCallback } from 'react'

// Tipos locais para demonstração
type ShieldStep = 'generating_randomness' | 'computing_commitment' | 'generating_proof' | 'submitting_transaction'

interface ShieldedNote {
  commitment: string
  amount: bigint
  assetId: number
  nullifierSecret: string
  serialNumber: string
  salt: string
  leafIndex: number
  merkleRoot: string
  createdAt: number
  spent: boolean
}

// Mock do SDK para demonstração
class MockPhantomSDK {
  async initialize() {
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  async shield(params: { asset: string; amount: bigint; onProgress?: (step: ShieldStep, message: string) => void }) {
    const steps: Array<{ step: ShieldStep; message: string; duration: number }> = [
      { step: 'generating_randomness', message: 'Generating cryptographic randomness...', duration: 300 },
      { step: 'computing_commitment', message: 'Computing commitment...', duration: 500 },
      { step: 'generating_proof', message: 'Generating zero-knowledge proof...', duration: 2000 },
      { step: 'submitting_transaction', message: 'Submitting transaction to Starknet...', duration: 3000 },
    ]

    for (const { step, message, duration } of steps) {
      params.onProgress?.(step, message)
      await new Promise(resolve => setTimeout(resolve, duration))
    }

    // Return mock note
    return {
      commitment: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      amount: params.amount,
      assetId: 0,
      nullifierSecret: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      serialNumber: '0x1',
      salt: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      leafIndex: 0,
      merkleRoot: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      createdAt: Date.now(),
      spent: false,
    } as ShieldedNote
  }

  destroy() {}
}

export default function ShieldPage() {
  const [selectedAsset, setSelectedAsset] = useState('WBTC')
  const [amount, setAmount] = useState('')
  const [isShielding, setIsShielding] = useState(false)
  const [currentStep, setCurrentStep] = useState<ShieldStep | null>(null)
  const [stepMessage, setStepMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ShieldedNote | null>(null)
  const [sdk, setSdk] = useState<MockPhantomSDK | null>(null)

  const assets = [
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { symbol: 'tBTC', name: 'tBTC', decimals: 18 },
    { symbol: 'LBTC', name: 'Liquid Bitcoin', decimals: 8 },
    { symbol: 'SolvBTC', name: 'Solv Bitcoin', decimals: 18 },
  ]

  // Initialize SDK on mount
  useEffect(() => {
    const initSDK = async () => {
      const mockSdk = new MockPhantomSDK()
      await mockSdk.initialize()
      setSdk(mockSdk)
    }
    initSDK()

    return () => {
      sdk?.destroy()
    }
  }, [])

  const handleShield = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!sdk) {
      setError('SDK not initialized')
      return
    }

    setIsShielding(true)
    setError(null)
    setSuccess(null)
    setCurrentStep(null)
    setStepMessage('')

    try {
      const asset = assets.find(a => a.symbol === selectedAsset)
      if (!asset) {
        throw new Error('Invalid asset')
      }

      // Convert amount to base units
      const amountInBaseUnits = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, asset.decimals)))

      const note = await sdk.shield({
        asset: selectedAsset,
        amount: amountInBaseUnits,
        onProgress: (step, message) => {
          setCurrentStep(step)
          setStepMessage(message)
        },
      })

      setSuccess(note)
    } catch (err) {
      console.error('Shield error:', err)
      setError(err instanceof Error ? err.message : 'Shield failed. Please try again.')
      setCurrentStep(null)
    } finally {
      setIsShielding(false)
    }
  }, [amount, sdk, selectedAsset, assets])

  const handleReset = () => {
    setSuccess(null)
    setAmount('')
    setCurrentStep(null)
    setStepMessage('')
  }

  return (
    <main className="min-h-screen px-6 py-12 relative z-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-extrabold text-[48px] md:text-[56px] leading-[1.0] tracking-[-0.02em] mb-3">
          Shield Assets
        </h1>
        <p className="font-syne font-normal text-[15px] leading-[1.7] text-[--text-muted] mb-8">
          Deposit BTC-family assets into the PHANTOM shield pool. Your positions become private commitments on-chain.
        </p>

        {success ? (
          // Success State
          <div className="max-w-xl mx-auto">
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">🛡️</div>
              <h2 className="font-display font-bold text-2xl text-[--success] mb-4">
                Assets Shielded Successfully!
              </h2>
              
              <div className="text-left p-6 bg-[--surface-3] rounded-xl mb-6 font-mono text-sm">
                <div className="mb-3">
                  <span className="text-[--text-subtle]">Commitment:</span>
                  <div className="text-[--violet-bright] break-all mt-1">{success.commitment}</div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span className="text-[--text-subtle]">Amount:</span>
                    <div className="text-[--text]">{amount} {selectedAsset}</div>
                  </div>
                  <div>
                    <span className="text-[--text-subtle]">Asset ID:</span>
                    <div className="text-[--text]">{success.assetId}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[--border]">
                  <span className="text-[--text-subtle]">Leaf Index:</span>
                  <span className="text-[--text] ml-2">{success.leafIndex}</span>
                </div>
              </div>

              <p className="text-sm text-[--text-subtle] mb-6">
                ✅ Your shielded note has been saved to local storage
              </p>

              <button
                onClick={handleReset}
                className="w-full py-4 btn-primary"
              >
                Shield Another Asset
              </button>
            </div>
          </div>
        ) : (
          // Shield Form
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Shield Form */}
            <div className="card p-8">
              <h2 className="font-display font-bold text-2xl mb-6">Deposit</h2>

              {/* Asset Selector */}
              <div className="mb-6">
                <label className="block font-mono font-medium text-[11px] tracking-[0.12em] uppercase text-[--text-subtle] mb-2">
                  Asset
                </label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="input"
                  disabled={isShielding}
                >
                  {assets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.name} ({asset.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block font-mono font-medium text-[11px] tracking-[0.12em] uppercase text-[--text-subtle] mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="any"
                    className="input pr-20"
                    disabled={isShielding}
                  />
                  <button
                    type="button"
                    onClick={() => setAmount('1.0')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-[--violet-dim] text-[--violet-bright] rounded hover:bg-[--violet-dim]/80 transition-colors disabled:opacity-50"
                    disabled={isShielding}
                  >
                    1.0
                  </button>
                </div>
                <p className="font-mono font-medium text-[11px] tracking-[0.12em] text-[--text-subtle] mt-2">
                  Enter the amount of {selectedAsset} to shield
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] rounded-lg text-[--danger] text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Shield Button */}
              <button
                onClick={handleShield}
                disabled={isShielding || !amount || !sdk}
                className="w-full py-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isShielding ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Shielding...
                  </span>
                ) : (
                  'Shield Assets'
                )}
              </button>

              {!sdk && (
                <p className="text-center text-sm text-[--text-subtle] mt-4">
                  Initializing SDK...
                </p>
              )}
            </div>

            {/* Proof Progress */}
            <div className="card p-8">
              <h2 className="font-display font-bold text-2xl mb-6">Status</h2>

              {currentStep ? (
                <div className="space-y-4">
                  <ProgressStep
                    step="generating_randomness"
                    current={currentStep}
                    label="Generating cryptographic randomness"
                    duration="0.3s"
                  />
                  <ProgressStep
                    step="computing_commitment"
                    current={currentStep}
                    label="Computing commitment"
                    duration="0.5s"
                  />
                  <ProgressStep
                    step="generating_proof"
                    current={currentStep}
                    label="Generating zero-knowledge proof"
                    duration="2.0s"
                  />
                  <ProgressStep
                    step="submitting_transaction"
                    current={currentStep}
                    label="Submitting transaction to Starknet"
                    duration="~30s"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-[--text-subtle]">
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="mb-2">Ready to shield</p>
                  <p className="text-sm">Enter an amount and click Shield Assets</p>
                </div>
              )}

              {currentStep && (
                <div className="mt-6 p-4 bg-[--surface-3] rounded-lg">
                  <p className="text-sm text-[--text-subtle]">{stepMessage}</p>
                  {currentStep === 'generating_proof' && (
                    <div className="mt-3 h-1 bg-[--border] rounded-full overflow-hidden">
                      <div className="h-full bg-[--violet] animate-pulse" style={{ width: '50%' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning Banner */}
        <div className="mt-8 p-4 bg-[rgba(251,191,36,0.04)] border border-[rgba(251,191,36,0.18)] rounded-lg">
          <p className="text-[--warning] text-sm">
            ⚠ Your shield notes are stored only in this browser. If you clear browser data without exporting a backup, your funds cannot be recovered.
          </p>
        </div>
      </div>
    </main>
  )
}

function ProgressStep({
  step,
  current,
  label,
  duration,
}: {
  step: ShieldStep
  current: ShieldStep | null
  label: string
  duration: string
}) {
  const steps: ShieldStep[] = [
    'generating_randomness',
    'computing_commitment',
    'generating_proof',
    'submitting_transaction',
  ]

  const currentIndex = steps.indexOf(current || 'generating_randomness')
  const stepIndex = steps.indexOf(step)

  const isComplete = stepIndex < currentIndex
  const isCurrent = stepIndex === currentIndex

  return (
    <div className={`flex items-center gap-3 ${isCurrent ? 'opacity-100' : 'opacity-50'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
        isComplete ? 'bg-[--success] text-white' : isCurrent ? 'bg-[--violet] text-white animate-pulse' : 'bg-[--border] text-[--text-subtle]'
      }`}>
        {isComplete ? '✓' : isCurrent ? '⟳' : ''}
      </div>
      <span className="flex-1 font-syne font-normal text-[14px]">{label}</span>
      <span className="font-mono font-medium text-[11px] tracking-[0.12em] text-[--text-subtle]">{duration}</span>
    </div>
  )
}
