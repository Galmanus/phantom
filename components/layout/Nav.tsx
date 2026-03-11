'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { WalletConnector } from '../wallet/WalletConnector'

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        isScrolled
          ? 'bg-void/75 backdrop-blur-2xl border-b border-subtle'
          : 'bg-void/50 backdrop-blur-2xl'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 relative">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <polygon
                points="16,2 28,10 28,22 16,30 4,22 4,10"
                fill="url(#logo-gradient)"
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5A623" />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-mono text-lg tracking-[0.1em] font-bold text-amber">
            PHANTOM
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6">
            {[
              { href: '/shield', label: 'App' },
              { href: '/yield', label: 'Yield' },
              { href: '/compliance', label: 'Compliance' },
              { href: '/developers', label: 'Developers' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-sm tracking-[0.12em] uppercase text-muted hover:text-amber transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Launch App Button */}
          <WalletConnector />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <WalletConnector />
        </div>
      </div>
    </motion.nav>
  )
}
