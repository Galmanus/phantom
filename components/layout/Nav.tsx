'use client'
import Link from 'next/link'
import { useState } from 'react'

export function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-void/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-amber text-2xl">₿</span>
          <span className="font-heading font-bold text-xl tracking-tight">PHANTOM</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/shield" className="font-mono text-sm uppercase tracking-wider text-muted hover:text-amber transition-colors">App</Link>
          <Link href="/yield" className="font-mono text-sm uppercase tracking-wider text-muted hover:text-amber transition-colors">Yield</Link>
          <Link href="/compliance" className="font-mono text-sm uppercase tracking-wider text-muted hover:text-amber transition-colors">Compliance</Link>
          <Link href="/developers" className="font-mono text-sm uppercase tracking-wider text-muted hover:text-amber transition-colors">Developers</Link>
          <button className="btn-outline text-sm py-2 px-4">Connect Wallet</button>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-muted">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
