'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Wallet } from 'lucide-react'
import { WalletConnector } from '@/components/wallet/WalletConnector'
import { useWalletStore } from '@/store/walletStore'

/**
 * Navigation — Fixed top navigation with wallet integration
 * 
 * Features:
 * - Glass morphism background with backdrop blur
 * - Animated logo mark (rotating hexagon)
 * - Center nav links with active state
 * - Wallet connector button
 * - Mobile hamburger menu
 */

const navLinks = [
  { href: '/#features', label: 'Protocol' },
  { href: '/#how', label: 'How it works' },
  { href: '/#compliance', label: 'Compliance' },
  { href: '/developers', label: 'Developers' },
]

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isConnected, address } = useWalletStore()

  // Handle scroll for nav background transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass-strong' : 'glass'
        }`}
        style={{ height: '64px' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              {/* Animated hexagon logo */}
              <div className="relative w-8 h-8">
                <svg
                  viewBox="0 0 32 32"
                  className="w-full h-full animate-[spin_60s_linear_infinite] group-hover:animate-none group-hover:scale-105 transition-transform"
                >
                  <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="16,2 29,9 29,23 16,30 3,23 3,9"
                    fill="url(#logoGrad)"
                    opacity="0.9"
                  />
                  <polygon
                    points="16,6 25,11 25,21 16,26 7,21 7,11"
                    fill="var(--void)"
                  />
                </svg>
              </div>
              
              <span className="font-display font-extrabold text-lg tracking-wider text-white">
                PHANTOM
              </span>
            </Link>

            {/* Center nav links — desktop */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono font-medium text-[11px] tracking-[0.12em] uppercase text-[--text-subtle] hover:text-[--violet-bright] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side — wallet + CTA */}
            <div className="hidden md:flex items-center gap-4">
              <WalletConnector />
              
              <Link href="/shield" className="btn-primary">
                Launch App
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-[--text-subtle] hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[--surface] border-l border-[--border] z-50 md:hidden"
            >
              <div className="p-6 pt-20">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="font-mono font-medium text-[11px] tracking-[0.12em] uppercase text-[--text-subtle] hover:text-[--violet-bright] py-3 border-b border-[--border]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button className="btn-ghost w-full justify-center">
                    <Wallet size={16} />
                    Connect Wallet
                  </button>
                  <Link href="/shield" className="btn-primary w-full justify-center">
                    Launch App
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
