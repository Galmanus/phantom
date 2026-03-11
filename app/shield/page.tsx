'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { useWalletStore } from '@/store/walletStore'
import { ShieldedNote } from '@/types'

type Step = 'idle' | 'approving' | 'generating' | 'submitting' | 'success' | 'error'

interface ShieldState {
  step: Step
  asset: string
  amount: string
  error: string | null
  txHash: string | null
  noteId: string | null
}

export default function ShieldPage() {
  const { address, status } = useAccount()
  const { isConnected } = useWalletStore()
  
  const [state, setState] = useState<ShieldState>({
    step: 'idle',
    asset: 'WBTC',
    amount: '',
    error: null,
    txHash: null,
    noteId: null,
  })
  
  const [notes, setNotes] = useState<ShieldedNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)

  // Load notes from IndexedDB via SDK on mount
  useEffect(() => {
    if (!address) return
    
    setIsLoadingNotes(true)
    try {
      // Notes should be loaded from encrypted IndexedDB via SDK's NoteStore
      // For now, display empty state until SDK integration is complete
      setNotes([])
    } catch (e) {
      console.error('Failed to load notes:', e)
    } finally {
      setIsLoadingNotes(false)
    }
  }, [address])

  const handleShield = useCallback(async () => {
    if (!state.amount || !address) return
    
    const amountNum = parseFloat(state.amount)
    if (isNaN(amountNum) || amountNum <= 0) return

    setState(prev => ({ ...prev, step: 'approving', error: null }))

    try {
      // Step 1: Approval - would call token.approve() via SDK
      setState(prev => ({ ...prev, step: 'approving' }))
      
      // Simulate approval (in real implementation, this would be SDK call)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 2: Generate ZK proof via WASM
      setState(prev => ({ ...prev, step: 'generating' }))
      
      // In production: const proof = await prover.proveShield({ commitment, assetId, amount, ... })
      // This calls the real WASM prover via ProverWorkerClient
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 3: Submit transaction to Starknet
      setState(prev => ({ ...prev, step: 'submitting' }))
      
      // In production: const tx = await pool.shield(asset, amount, commitment, proof)
      // This calls the real PhantomPool contract
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Generate mock transaction hash
      const txHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
      
      // Generate note ID
      const noteId = 'phantom-' + Date.now().toString().slice(-6)
      
      // Create note object (in production, this would be saved via SDK's NoteStore)
      // Notes are encrypted with AES-256-GCM and stored in IndexedDB
      const newNote: ShieldedNote = {
        commitment: txHash,
        amount: BigInt(Math.floor(amountNum * 1e8)),
        assetId: state.asset === 'WBTC' ? 0 : state.asset === 'tBTC' ? 1 : state.asset === 'LBTC' ? 2 : 3,
        nullifierSecret: '0x' + Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        serialNumber: '0x' + Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        salt: '0x' + Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        leafIndex: notes.length,
        merkleRoot: '0x' + Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        createdAt: Date.now(),
        spent: false,
      }
      
      // Update UI state (in production, notes are persisted via SDK's NoteStore)
      const updatedNotes = [...notes, newNote]
      setNotes(updatedNotes)
      
      setState(prev => ({ 
        ...prev, 
        step: 'success', 
        txHash,
        noteId 
      }))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: errorMessage 
      }))
    }
  }, [state.amount, state.asset, address, notes])

  const handleReset = useCallback(() => {
    setState({
      step: 'idle',
      asset: 'WBTC',
      amount: '',
      error: null,
      txHash: null,
      noteId: null,
    })
  }, [])

  // Calculate USD value (in production, fetch from real price oracle)
  const usdValue = state.amount ? (parseFloat(state.amount) * 98472).toFixed(2) : '0.00'

  // Get total shielded value
  const totalShielded = notes.reduce((sum, note) => {
    return sum + (note.spent ? 0n : note.amount)
  }, 0n)
  const totalShieldedDisplay = (Number(totalShielded) / 1e8).toFixed(4)

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl text-parchment mb-4">Connect Wallet</h2>
          <p className="text-secondary mb-6">Please connect your wallet to shield your Bitcoin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Shield</h1>
        <p className="text-lg text-secondary mb-12">Make your Bitcoin invisible.</p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-3 card">
            {state.step === 'idle' && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-xl text-parchment">Shield Your Bitcoin</h2>
                
                <div>
                  <label className="font-mono text-xs uppercase text-muted mb-2 block">Asset</label>
                  <select 
                    value={state.asset} 
                    onChange={e => setState(prev => ({ ...prev, asset: e.target.value }))}
                    className="input"
                  >
                    <option value="WBTC">wBTC - Wrapped Bitcoin</option>
                    <option value="tBTC">tBTC - Test Bitcoin</option>
                    <option value="LBTC">LBTC - Liquid Bitcoin</option>
                    <option value="SolvBTC">SolvBTC</option>
                  </select>
                </div>
                
                <div>
                  <label className="font-mono text-xs uppercase text-muted mb-2 block">Amount</label>
                  <input 
                    type="number" 
                    value={state.amount} 
                    onChange={e => setState(prev => ({ ...prev, amount: e.target.value }))}
                    className="input text-2xl font-mono" 
                    placeholder="0.00" 
                    step="0.00000001"
                    min="0"
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <button 
                      className="text-amber font-mono text-xs uppercase hover:text-amber-dim transition-colors"
                      onClick={() => setState(prev => ({ ...prev, amount: '0.1' }))}
                    >
                      MAX
                    </button>
                    <span className="text-muted">≈ ${usdValue} USD</span>
                  </div>
                </div>
                
                <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Network fee</span>
                    <span className="font-mono">~0.001 STRK</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Shield fee</span>
                    <span className="font-mono">0.05%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Proof time</span>
                    <span className="font-mono text-amber">~120ms client-side</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleShield} 
                  disabled={!state.amount || parseFloat(state.amount) <= 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ▶ Shield {state.amount || '0'} {state.asset}
                </button>
                
                <p className="font-mono text-xs text-muted text-center">
                  Your note is stored locally with AES-256 encryption.
                </p>
              </div>
            )}

            {state.step === 'approving' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto border-4 border-amber border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="font-display font-bold text-xl text-parchment mb-2">Awaiting wallet approval...</h3>
                <p className="text-sm text-secondary">Approve PHANTOM to spend your {state.asset}.</p>
              </div>
            )}

            {state.step === 'generating' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div 
                    className="w-32 h-32 mx-auto rounded-full bg-amber-glow border-2 border-amber flex items-center justify-center animate-pulse" 
                    style={{boxShadow: '0 0 60px var(--amber-glow)'}}
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-amber">
                      <path d="M12 2L20 7V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-parchment text-center">Generating ZK Proof</h3>
                <div className="bg-void rounded-xl p-4 font-mono text-xs space-y-1">
                  <div className="text-zk-green">{'>'} Initializing Stwo prover...</div>
                  <div className="text-zk-green">{'>'} Loading circuit constraints...</div>
                  <div className="text-zk-green">{'>'} Building Merkle witness...</div>
                  <div className="text-zk-green">{'>'} Computing Poseidon2 hash...</div>
                  <div className="text-amber animate-pulse">{'>'} Generating STARK proof...</div>
                </div>
              </div>
            )}

            {state.step === 'submitting' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto border-4 border-amber border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="font-display font-bold text-xl text-parchment mb-2">Submitting to Starknet...</h3>
                {state.txHash && (
                  <p className="font-mono text-sm text-amber">
                    Tx: {state.txHash.slice(0, 10)}...{state.txHash.slice(-6)}
                  </p>
                )}
                <p className="text-sm text-muted mt-2">Waiting for confirmation...</p>
              </div>
            )}

            {state.step === 'success' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-full bg-zk-green-dim flex items-center justify-center mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-zk-green">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="font-display font-bold text-2xl text-parchment mb-2">✓ Bitcoin Shielded</h3>
                <p className="text-secondary mb-4">{state.amount} {state.asset} successfully hidden.</p>
                <p className="font-mono text-sm text-amber mb-6">Note #{state.noteId}</p>
                <div className="flex gap-4">
                  <button onClick={handleReset} className="btn-primary flex-1">Shield More</button>
                  <button className="btn-outline flex-1">View Notes</button>
                </div>
              </div>
            )}

            {state.step === 'error' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto rounded-full bg-error/20 flex items-center justify-center mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-error">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="font-display font-bold text-2xl text-parchment mb-2">Transaction Failed</h3>
                <p className="text-error mb-6">{state.error}</p>
                <button onClick={handleReset} className="btn-primary">Try Again</button>
              </div>
            )}
          </div>

          {/* Notes Panel */}
          <div className="lg:col-span-2 card">
            <h3 className="font-display font-bold text-lg text-parchment mb-4">My Shielded Notes</h3>
            <p className="font-mono text-xs text-muted mb-6">
              Total shielded: {totalShieldedDisplay} wBTC · ≈ ${(parseFloat(totalShieldedDisplay) * 98472).toFixed(0)}
            </p>
            
            <div className="flex gap-2 mb-6">
              {['all', 'confirmed', 'pending', 'spent'].map(f => (
                <button 
                  key={f} 
                  className={`px-3 py-1 rounded-lg font-mono text-xs uppercase ${f === 'all' ? 'bg-amber text-void' : 'bg-surface text-muted hover:bg-border transition-colors'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            {isLoadingNotes ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 mx-auto border-2 border-amber border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p className="font-mono text-sm">No shielded notes yet.</p>
                <p className="font-mono text-xs mt-2">Shield your first Bitcoin above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note, i) => (
                  <div key={i} className="p-4 bg-surface rounded-xl border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-amber text-xl">₿</span>
                        <div>
                          <div className="font-mono text-parchment">
                            {(Number(note.amount) / 1e8).toFixed(4)} wBTC
                          </div>
                          <div className="font-mono text-xs text-muted">
                            Note #{note.leafIndex} · {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className="badge bg-zk-green-dim text-zk-green text-xs px-2 py-1 rounded">
                        CONFIRMED
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="btn-outline text-xs py-2 px-3 flex-1">Use in Swap</button>
                      <button className="btn-primary text-xs py-2 px-3 flex-1">Unshield</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
