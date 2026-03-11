import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-subtle">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-12">
        <div className="grid grid-colsgrid-cols-3 gap-8-1 md: items-center">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <polygon
                  points="16,2 28,10 28,22 16,30 4,22 4,10"
                  fill="url(#footer-gradient)"
                />
                <defs>
                  <linearGradient id="footer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5A623" />
                    <stop offset="100%" stopColor="#F5A623" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="font-mono text-sm tracking-[0.1em] font-bold text-amber">
              PHANTOM
            </span>
          </div>

          {/* Center: Text */}
          <div className="text-center">
            <p className="font-mono text-xs tracking-[0.14em] uppercase text-muted">
              Built on Starknet · ZK Privacy · BTCFi
            </p>
          </div>

          {/* Right: Links */}
          <div className="flex justify-end gap-6">
            {[
              { label: 'GitHub', href: '#' },
              { label: 'Docs', href: '#' },
              { label: 'Audit', href: '#' },
              { label: 'Discord', href: '#' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-xs tracking-[0.14em] uppercase text-muted hover:text-amber transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
