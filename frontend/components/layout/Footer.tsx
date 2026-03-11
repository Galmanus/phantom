import Link from 'next/link'

/**
 * Footer — Minimal footer with gradient divider
 */

export function Footer() {
  return (
    <footer className="border-t border-[--border] mt-auto">
      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[--border] to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6">
              <svg viewBox="0 0 32 32" className="w-full h-full opacity-60">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                <polygon
                  points="16,2 29,9 29,23 16,30 3,23 3,9"
                  fill="url(#footerLogoGrad)"
                />
              </svg>
            </div>
            <span className="font-display font-extrabold text-sm tracking-wider text-[--text-subtle]">
              PHANTOM
            </span>
          </div>

          {/* Center text */}
          <p className="font-mono text-[11px] text-[--text-ghost] text-center">
            Built on Starknet · Powered by Stwo · Open Source
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/phantom-btc/phantom"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-[--text-subtle] hover:text-[--violet-bright] transition-colors"
            >
              GitHub
            </a>
            <a
              href="/developers"
              className="font-mono text-[11px] text-[--text-subtle] hover:text-[--violet-bright] transition-colors"
            >
              Docs
            </a>
            <a
              href="#"
              className="font-mono text-[11px] text-[--text-subtle] hover:text-[--violet-bright] transition-colors"
            >
              Audit
            </a>
            <a
              href="#"
              className="font-mono text-[11px] text-[--text-subtle] hover:text-[--violet-bright] transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
