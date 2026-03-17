'use client'
import Link from 'next/link'
import { useState } from 'react'
import { WalletConnector } from '@/components/wallet/WalletConnector'

// Simple icon components since lucide-react is not installed
const TrendingUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const ArrowLeftRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const stakingIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const [showStrk20Tooltip, setShowStrk20Tooltip] = useState(false)

  const navItems = [
    { 
      label: 'Staking', 
      href: '/staking', 
      description: 'Private liquid staking',
      icon: stakingIcon,
    },
    { 
      label: 'Earn', 
      href: '/yield', 
      description: 'Private yield strategies',
      icon: TrendingUpIcon,
    },
    { 
      label: 'Get strkBTC', 
      href: '/swap', 
      description: 'Convert BTC to strkBTC',
      icon: ArrowLeftRightIcon,
    },
    { 
      label: 'Compliance', 
      href: '/compliance', 
      description: 'Viewing keys & disclosure',
      icon: ShieldIcon,
    },
    { 
      label: 'Developers', 
      href: '/developers', 
      description: 'Integrate MIDAS',
      icon: CodeIcon,
    },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-void/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-amber text-2xl">₿</span>
          <span className="font-heading font-bold text-xl tracking-tight">MIDAS</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="flex items-center gap-2 text-sm text-muted hover:text-amber transition-colors"
            >
              <item.icon />
              <span className="font-mono uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
          
          {/* STRK20 indicator */}
          <button
            onClick={() => setShowStrk20Tooltip(!showStrk20Tooltip)}
            className="relative flex items-center gap-1.5 px-2 py-1 rounded-full bg-zk-green/10 
                       border border-zk-green/30 hover:bg-zk-green/20 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zk-green animate-pulse" />
            <span className="text-xs font-mono text-zk-green uppercase">STRK20</span>
            
            {showStrk20Tooltip && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-panel border 
                             border-amber/20 rounded-xl p-4 shadow-xl z-50">
                <p className="text-xs text-text-primary/70 leading-relaxed">
                  Privacy powered by Starknet STRK20 — native privacy layer for all 
                  ERC-20 tokens on Starknet. Your balances and transactions stay private.
                </p>
              </div>
            )}
          </button>
          
          <WalletConnector />
        </div>
        
        {/* Mobile menu button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="md:hidden text-muted p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-void border-b border-border">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-muted hover:text-amber 
                           hover:bg-amber/5 transition-colors"
              >
                <item.icon />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted/50">{item.description}</div>
                </div>
              </Link>
            ))}
            <div className="pt-2 border-t border-amber/10">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-zk-green" />
                <span className="text-sm text-zk-green font-mono">STRK20</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
