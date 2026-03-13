'use client'

import { useState, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import type { Account } from 'starknet'
import { useWalletStore } from '@/store/walletStore'
import { parseWalletError } from '@/lib/wallet-errors'
import { WalletConnector } from '@/components/wallet/WalletConnector'

type DisclosureScope = 'amount_only' | 'kyc_status' | 'sanctions_cleared' | 'full_audit'

interface DisclosureOption {
  scope: DisclosureScope
  label: string
  description: string
  icon: string
}

const DISCLOSURE_OPTIONS: DisclosureOption[] = [
  {
    scope: 'amount_only',
    label: 'Amount Only',
    description: 'Prove total position is below reporting threshold without revealing exact amount',
    icon: '≤',
  },
  {
    scope: 'kyc_status',
    label: 'KYC Status',
    description: 'Prove identity verification was completed without revealing personal data',
    icon: '✓',
  },
  {
    scope: 'sanctions_cleared',
    label: 'Sanctions Cleared',
    description: 'Prove no sanctioned addresses are involved in your transactions',
    icon: '🛡',
  },
  {
    scope: 'full_audit',
    label: 'Full Audit Key',
    description: 'Provide regulator with complete view of your shielded positions via IVK',
    icon: '🔑',
  },
]

export default function CompliancePage() {
  const { account: accountInterface, address } = useAccount()
  const { incomingViewingKey, setPhantomKeys, account: starknetAccount } = useWalletStore()

  // Use the account from walletStore which has the proper starknet.js Account type
  const account = starknetAccount as Account | null

  const [selectedScope, setSelectedScope] = useState<DisclosureScope>('amount_only')
  const [isDerivingKey, setIsDerivingKey] = useState(false)
  const [derivationError, setDerivationError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedProof, setCopiedProof] = useState(false)

  // IVK já foi derivada pelo useWalletSync no mount — mas o usuário pode re-derivar
  const hasKey = !!incomingViewingKey

  // ─── Derivar IVK ────────────────────────────────────────────────────────────

  const deriveViewingKey = useCallback(async () => {
    if (!account) return

    setIsDerivingKey(true)
    setDerivationError(null)

    try {
      // Import dinâmico para evitar SSR
      const { PhantomKeyManager } = await import('@/sdk/src/key-derivation')
      const keyManager = await PhantomKeyManager.fromWallet(account)

      // Persistir no walletStore
      setPhantomKeys(keyManager.ivkHex, null)
    } catch (error) {
      setDerivationError(parseWalletError(error))
    } finally {
      setIsDerivingKey(false)
    }
  }, [account, setPhantomKeys])

  // ─── Copy helpers ────────────────────────────────────────────────────────────

  const copyToClipboard = useCallback(async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setter(true)
      setTimeout(() => setter(false), 2000)
    }
  }, [])

  // ─── Gerar prova de compliance ────────────────────────────────────────────────
  // PLACEHOLDER: Waiting for Starknet 0.14.2 native Stwo syscall
  // Por enquanto exibe o IVK formatado como "prova" para escopo full_audit

  const getProofPayload = (): string => {
    if (!incomingViewingKey || !address) return ''
    return JSON.stringify({
      scope: selectedScope,
      ivk: selectedScope === 'full_audit' ? incomingViewingKey : '[SCOPED_PROOF_PLACEHOLDER]',
      address,
      timestamp: Date.now(),
      protocol: 'PHANTOM v1',
      network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
      note: 'PLACEHOLDER: Real ZK compliance proof pending Starknet 0.14.2',
    }, null, 2)
  }

  const truncateKey = (key: string): string =>
    key.slice(0, 10) + '...' + key.slice(-8)

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-void pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/30
                            flex items-center justify-center">
              <svg className="w-5 h-5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-parchment">Compliance</h1>
              <p className="text-sm text-secondary">Selective disclosure via encrypted viewing keys</p>
            </div>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Generate cryptographic proofs to satisfy regulatory requirements without
            revealing your full transaction history. Privacy by default, compliance when needed.
          </p>
        </div>

        {/* Wallet Gate */}
        {!account && (
          <div className="bg-panel border border-subtle rounded-2xl p-8 text-center mb-6">
            <p className="text-secondary mb-4">Connect your wallet to access compliance tools</p>
            <WalletConnector />
          </div>
        )}

        {account && (
          <div className="space-y-6">

            {/* IVK Section */}
            <div className="bg-panel border border-subtle rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-mono uppercase tracking-wider text-parchment">
                    Incoming Viewing Key
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    Derived from your wallet signature via PBKDF2-600k
                  </p>
                </div>
                {hasKey && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-zk-green">
                    <span className="w-1.5 h-1.5 rounded-full bg-zk-green" />
                    Active
                  </span>
                )}
              </div>

              {hasKey ? (
                <div className="space-y-3">
                  {/* Key display */}
                  <div className="flex items-center gap-3 bg-void/50 border border-subtle
                                   rounded-xl p-3 font-mono text-sm">
                    <span className="text-parchment truncate flex-1">
                      {truncateKey(incomingViewingKey!)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(incomingViewingKey!, setCopiedKey)}
                      className="shrink-0 text-xs text-secondary hover:text-amber transition-colors"
                    >
                      {copiedKey ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Share this key only with authorized regulators. It allows read-only access to your shielded positions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-secondary">
                    Your viewing key has not been derived yet. Click below to sign a message with your wallet and derive your PHANTOM privacy keys.
                  </p>
                  <button
                    onClick={deriveViewingKey}
                    disabled={isDerivingKey}
                    className="w-full py-3 rounded-xl bg-amber text-void font-mono text-sm
                               uppercase tracking-wider font-bold
                               hover:bg-amber/90 transition-colors
                               disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isDerivingKey ? 'Deriving Keys...' : 'Derive Viewing Key'}
                  </button>
                  {isDerivingKey && (
                    <p className="text-xs text-amber/70 font-mono text-center">
                      Running PBKDF2 with 600,000 iterations — this takes ~3 seconds
                    </p>
                  )}
                  {derivationError && (
                    <div className="bg-error/10 border border-error/30 rounded-xl p-3">
                      <p className="text-xs text-error font-mono">{derivationError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Disclosure Scope */}
            {hasKey && (
              <div className="bg-panel border border-subtle rounded-2xl p-6">
                <h2 className="text-sm font-mono uppercase tracking-wider text-parchment mb-4">
                  Disclosure Scope
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DISCLOSURE_OPTIONS.map(option => (
                    <button
                      key={option.scope}
                      onClick={() => setSelectedScope(option.scope)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selectedScope === option.scope
                          ? 'border-amber/50 bg-amber/5'
                          : 'border-subtle hover:border-subtle-2 bg-void/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0">{option.icon}</span>
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            selectedScope === option.scope ? 'text-amber' : 'text-parchment'
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-muted leading-relaxed">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Proof payload */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-secondary uppercase tracking-wider">
                      Compliance Proof Payload
                    </span>
                    <button
                      onClick={() => copyToClipboard(getProofPayload(), setCopiedProof)}
                      className="text-xs font-mono text-secondary hover:text-amber transition-colors"
                    >
                      {copiedProof ? '✓ Copied' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="bg-void/50 border border-subtle rounded-xl p-4
                                   text-xs font-mono text-parchment/70 overflow-auto
                                   max-h-48 whitespace-pre-wrap break-all">
                    {getProofPayload()}
                  </pre>
                  <p className="text-xs text-amber/60 mt-2 font-mono">
                    ⚠ PLACEHOLDER — Real ZK compliance proofs pending Starknet 0.14.2 Stwo verifier
                  </p>
                </div>
              </div>
            )}

            {/* Architecture note */}
            <div className="bg-panel border border-amber/10 rounded-2xl p-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber mb-3">
                How it works
              </h3>
              <div className="space-y-2 text-sm text-muted">
                <p>1. Your wallet signs a SNIP-12 typed message (deterministic)</p>
                <p>2. PBKDF2 with 600,000 iterations derives IVK + Spending Key</p>
                <p>3. IVK allows read-only access to your shielded notes</p>
                <p>4. Spending Key is never shared — only you can spend funds</p>
                <p>5. ZK proofs let you prove properties without revealing data</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
