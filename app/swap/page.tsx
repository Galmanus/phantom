'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { useWalletStore } from '@/store/walletStore'
import { ShieldedNote } from '@/types'

type SwapStatus = 'idle' | 'proof' | 'encrypted' | 'matching' | 'settled' | 'error'

interface SwapState {
  status: SwapStatus
  fromNoteId: string | null
  fromAmount: string
  toAsset: string
  toAmount: string
  slippage: string
  error: string | null
}

export default function SwapPage() {
  const { address, status: walletStatus } = useAccount()
  const { isConnected } = useWalletStore()
  
  const [notes, setNotes] = useState<ShieldedNote[]>([])
  const [state, setState] = useState<SwapState>({
    status: 'idle',
    fromNoteId: null,
    fromAmount: '',
    toAsset: 'USDC',
    toAmount: '',
    slippage: '0.5',
    error: null,
  })

  // Load notes from localStorage
  useEffect(() => {
    if (!address) return
    
    try {
      const storedNotes = localStorage.getItem('phantom_notes')
      if (storedNotes) {
        const parsed = JSON.parse(storedNotes) as ShieldedNote[]
        setNotes(parsed.filter(n => !n.spent))
      }
    } catch (e) {
      console.error('Failed to load notes:', e)
    }
  }, [address])

  // Calculate swap amount (mock price for demo)
  useEffect(() => {
    if (!state.fromAmount) {
      setState(prev => ({ ...prev, toAmount: '' }))
      return
    }
    
    const wbtcPrice = 98472 // Mock price - in production, fetch from AVNU
    const amount = parseFloat(state.fromAmount)
    if (isNaN(amount)) return
    
    const slippage = parseFloat(state.slippage) / 100
    const minAmount = amount * wbtcPrice * (1 - slippage)
    
    setState(prev => ({ ...prev, toAmount: minAmount.toFixed(2) }))
  }, [state.fromAmount, state.slippage])

  const handleSwap = useCallback(async () => {
    if (!state.fromAmount || !state.fromNoteId) return
    
    setState(prev => ({ ...prev, status: 'proof', error: null }))
    
    try {
      // Step 1: Generate proof
      // In production: await prover.provePrivateSwap({ note, assetOut, amountOutMin })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 2: Encrypt intent
      setState(prev => ({ ...prev, status: 'encrypted' }))
      // In production: encrypt intent with recipient's public key
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Step 3: Submit to dark pool
      setState(prev => ({ ...prev, status: 'matching' }))
      // In production: call intent_matcher.submit_intent()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 4: Settlement
      setState(prev => ({ ...prev, status: 'settled' }))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed'
      setState(prev => ({ ...prev, status: 'error', error: errorMessage }))
    }
  }, [state.fromAmount, state.fromNoteId])

  const handleReset = useCallback(() => {
    setState({
      status: 'idle',
      fromNoteId: null,
      fromAmount: '',
      toAsset: 'USDC',
      toAmount: '',
      slippage: '0.5',
      error: null,
    })
  }, [])

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl text-parchment mb-4">Connect Wallet</h2>
          <p className="text-secondary mb-6">Please connect your wallet to swap privately.</p>
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl text-parchment mb-4">No Shielded Notes</h2>
          <p className="text-secondary mb-6">You need to shield some Bitcoin first before you can swap.</p>
          <a href="/shield" className="btn-primary">Go to Shield</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Swap</h1>
        <p className="text-lg text-secondary mb-12">Trade privately. No front-running. No exposure.</p>

        <div className="card space-y-6">
          <h2 className="font-display font-bold text-xl text-parchment">Private Swap</h2>
          
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase text-muted">From (shielded)</label>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <select 
                className="w-full bg-transparent font-mono text-amber mb-2"
                value={state.fromNoteId || ''}
                onChange={e => {
                  const note = notes[parseInt(e.target.value)]
                  setState(prev => ({ 
                    ...prev, 
                    fromNoteId: e.target.value,
                    fromAmount: note ? (Number(note.amount) / 1e8).toFixed(4) : ''
                  }))
                }}
              >
                <option value="">Select a note</option>
                {notes.map((note, i) => (
                  <option key={i} value={i}>
                    Note #{note.leafIndex} - {(Number(note.amount) / 1e8).toFixed(4)} wBTC
                  </option>
                ))}
              </select>
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">Available</span>
                <span className="font-mono text-sm text-parchment">
                  {state.fromAmount ? `${state.fromAmount} wBTC` : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center text-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase text-muted">To</label>
            <div className="p-4 bg-surface rounded-xl border border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-parchment text-lg">{state.toAsset}</span>
                </div>
                <span className="font-mono text-parchment">{state.toAmount || '0.00'} USDC</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map(s => (
              <button 
                key={s} 
                onClick={() => setState(prev => ({ ...prev, slippage: s }))}
                className={`flex-1 py-2 rounded-lg font-mono text-xs ${state.slippage === s ? 'bg-amber text-void' : 'bg-surface text-muted'}`}
              >
                {s}%
              </button>
            ))}
          </div>

          <div className="p-4 bg-surface rounded-xl border border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Rate</span>
              <span className="font-mono">1 wBTC = 97,893.20 USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Route</span>
              <span className="font-mono">wBTC → USDC via AVNU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Price impact</span>
              <span className="font-mono text-zk-green">&lt; 0.01%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">PHANTOM fee</span>
              <span className="font-mono">0.05%</span>
            </div>
          </div>

          {state.status === 'idle' && (
            <button 
              onClick={handleSwap} 
              disabled={!state.fromNoteId || !state.fromAmount}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶ Swap Privately
            </button>
          )}

          {state.status === 'error' && (
            <div className="text-center">
              <p className="text-error mb-4">{state.error}</p>
              <button onClick={handleReset} className="btn-primary">Try Again</button>
            </div>
          )}
        </div>

        {/* Intent Status Tracker */}
        {state.status !== 'idle' && state.status !== 'error' && (
          <div className="mt-8 card">
            <h3 className="font-display font-bold text-lg text-parchment mb-6">Intent Status</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${state.status === 'proof' ? 'bg-amber text-void' : 'bg-zk-green text-void'}`}>
                    {state.status === 'proof' ? (
                      <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></div>
                    ) : '✓'}
                  </div>
                  <div>
                    <p className="font-bold text-parchment">Proof generated</p>
                    <p className="text-xs text-muted">ZK proof computed locally</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    state.status === 'encrypted' ? 'bg-amber text-void' : 
                    state.status === 'matching' || state.status === 'settled' ? 'bg-zk-green text-void' : 'bg-border text-muted'
                  }`}>
                    {state.status === 'encrypted' ? (
                      <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></div>
                    ) : '✓'}
                  </div>
                  <div>
                    <p className="font-bold text-parchment">Intent encrypted</p>
                    <p className="text-xs text-muted">Direction hidden from observers</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    state.status === 'matching' ? 'bg-amber text-void' : 
                    state.status === 'settled' ? 'bg-zk-green text-void' : 'bg-border text-muted'
                  }`}>
                    {state.status === 'matching' ? (
                      <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></div>
                    ) : state.status === 'settled' ? '✓' : '○'}
                  </div>
                  <div>
                    <p className="font-bold text-parchment">Sent to dark pool</p>
                    <p className="text-xs text-muted">Matching in progress...</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    state.status === 'settled' ? 'bg-zk-green text-void' : 'bg-border text-muted'
                  }`}>
                    {state.status === 'settled' ? '✓' : '○'}
                  </div>
                  <div>
                    <p className="font-bold text-parchment">Settlement confirmed</p>
                    <p className="text-xs text-muted">Atomic execution complete</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted mt-6 p-4 bg-surface rounded-lg">
              Your intent is encrypted. No one can see your trade direction until it's matched.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
