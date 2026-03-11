'use client'

import { useState, useRef, useEffect } from 'react'

interface WalletConnectorProps {
  className?: string
}

export function WalletConnector({ className = '' }: WalletConnectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const wallets = [
    { id: 'argent', name: 'Argent X', icon: '⬡' },
    { id: 'braavos', name: 'Braavos', icon: '⚡' },
    { id: 'metamask', name: 'MetaMask', icon: '🦊' },
  ]

  const handleConnect = (walletId: string) => {
    setSelectedWallet(walletId)
    // Simulate connection - in real app this would use starknet-react
    setTimeout(() => {
      setIsConnected(true)
      setIsOpen(false)
    }, 500)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setSelectedWallet(null)
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-outline flex items-center gap-2"
        >
          <span>Connect Wallet</span>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-panel border border-subtle rounded-xl shadow-xl overflow-hidden z-50">
            <div className="p-3 border-b border-subtle">
              <span className="font-mono text-xs text-muted uppercase tracking-wider">
                Select Wallet
              </span>
            </div>
            <div className="p-2">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors text-left"
                >
                  <span className="text-xl">{wallet.icon}</span>
                  <span className="font-mono text-sm text-parchment">{wallet.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Connected state
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-surface border border-subtle rounded-lg hover:border-amber-dim transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-zk-green animate-pulse" />
        <span className="font-mono text-sm text-parchment">
          0x3f7a...c2b1
        </span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-panel border border-subtle rounded-xl shadow-xl overflow-hidden z-50">
          {/* Wallet Info */}
          <div className="p-4 border-b border-subtle">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">
                {wallets.find(w => w.id === selectedWallet)?.icon}
              </span>
              <div>
                <div className="font-mono text-sm text-parchment">
                  {wallets.find(w => w.id === selectedWallet)?.name}
                </div>
                <div className="font-mono text-xs text-muted">
                  0x3f7a...c2b1
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Balance:</span>
              <span className="font-mono text-amber">0.2341 wBTC · 8.3 STRK</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors text-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-muted">
                <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12a2 2 0 00-2 2c0 1.1.9 2 2 2h4v-4h-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-mono text-sm text-secondary">My Notes (3 shielded)</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors text-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-muted">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="font-mono text-sm text-secondary">Settings</span>
            </button>
            <button 
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors text-left"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-error">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-mono text-sm text-error">Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
