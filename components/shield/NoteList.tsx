'use client'

import { useState } from 'react'

interface ShieldedNote {
  id: string
  asset: string
  amount: string
  commitment: string
  merkleRoot: string
  timestamp: number
  status: 'confirmed' | 'pending' | 'spent'
}

const mockNotes: ShieldedNote[] = [
  {
    id: '0042',
    asset: 'wBTC',
    amount: '0.10',
    commitment: '0x3f7a...c2b1',
    merkleRoot: '#831,422',
    timestamp: Date.now() - 7200000,
    status: 'confirmed',
  },
  {
    id: '0038',
    asset: 'wBTC',
    amount: '0.1341',
    commitment: '0x8b5c...f246',
    merkleRoot: '#829,100',
    timestamp: Date.now() - 1800000,
    status: 'pending',
  },
  {
    id: '0025',
    asset: 'USDC',
    amount: '5000',
    commitment: '0xa78b...8b5c',
    merkleRoot: '#815,400',
    timestamp: Date.now() - 86400000,
    status: 'spent',
  },
]

export function NoteList() {
  const [showSpent, setShowSpent] = useState(false)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'spent'>('all')
  
  const filteredNotes = mockNotes.filter(note => {
    if (filter !== 'all' && note.status !== filter) return false
    if (!showSpent && note.status === 'spent') return false
    return true
  })

  const activeNotes = mockNotes.filter(n => n.status !== 'spent')
  const totalValue = activeNotes.reduce((acc, note) => {
    const rate = note.asset === 'wBTC' ? 98472.32 : 1
    return acc + parseFloat(note.amount) * rate
  }, 0)

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="bg-panel border border-subtle rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-lg text-parchment">My Shielded Notes</h3>
          <p className="font-mono text-xs text-muted mt-1">
            Total shielded: {activeNotes.reduce((acc, n) => acc + parseFloat(n.amount), 0).toFixed(4)} wBTC · ≈ ${totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'confirmed', 'pending', 'spent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-lg whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-amber text-void'
                : 'text-muted hover:text-secondary bg-surface'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 opacity-30">
            <svg viewBox="0 0 32 32" className="w-full h-full text-amber">
              <polygon
                points="16,2 28,10 28,22 16,30 4,22 4,10"
                fill="currentColor"
              />
            </svg>
          </div>
          <h4 className="font-display font-semibold text-base mb-2 text-parchment">No notes found</h4>
          <p className="font-body text-sm text-muted">
            Shield assets to create your first private note.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                note.status === 'spent'
                  ? 'bg-surface border-subtle opacity-60'
                  : note.status === 'pending'
                  ? 'bg-surface border-amber-dim/30'
                  : 'bg-surface border-subtle hover:border-amber-dim'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold ${
                    note.status === 'spent'
                      ? 'bg-subtle text-muted'
                      : 'bg-amber-glow text-amber'
                  }`}>
                    ₿
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-semibold ${note.status === 'spent' ? 'line-through text-muted' : 'text-parchment'}`}>
                        {note.amount} {note.asset}
                      </span>
                      {note.status === 'confirmed' && (
                        <span className="badge badge-success">CONFIRMED</span>
                      )}
                      {note.status === 'pending' && (
                        <span className="badge badge-pending">PENDING</span>
                      )}
                      {note.status === 'spent' && (
                        <span className="badge bg-subtle text-muted">SPENT</span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-muted">
                      Note #{note.id} · {note.timestamp ? formatTime(note.timestamp) : 'Just now'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                <div>
                  <div className="font-mono text-muted uppercase tracking-wider mb-1">Commitment</div>
                  <div className="font-mono text-secondary">{note.commitment}</div>
                </div>
                <div>
                  <div className="font-mono text-muted uppercase tracking-wider mb-1">Merkle Root</div>
                  <div className="font-mono text-secondary">#{note.merkleRoot}</div>
                </div>
              </div>

              {note.status !== 'spent' && (
                <div className="flex gap-2 pt-2 border-t border-subtle">
                  <button className="btn-outline text-xs py-2 px-3 flex-1">
                    Use in Swap
                  </button>
                  <button className="btn-primary text-xs py-2 px-3 flex-1">
                    Unshield
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Show spent toggle */}
          <div className="pt-4 border-t border-subtle">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSpent}
                onChange={(e) => setShowSpent(e.target.checked)}
                className="rounded border-subtle text-amber focus:ring-amber bg-surface"
              />
              <span className="font-body text-sm text-muted">Show spent notes</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
