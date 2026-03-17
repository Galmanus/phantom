import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber">₿</span>
              <span className="font-heading font-bold text-lg">MIDAS</span>
            </div>
            <p className="text-sm text-muted">ZK Privacy for BTCFi</p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">Protocol</h4>
            <div className="space-y-2">
              <Link href="/shield" className="block text-sm text-secondary hover:text-amber">Shield</Link>
              <Link href="/swap" className="block text-sm text-secondary hover:text-amber">Private Swap</Link>
              <Link href="/yield" className="block text-sm text-secondary hover:text-amber">Shielded Yield</Link>
              <Link href="/compliance" className="block text-sm text-secondary hover:text-amber">Compliance</Link>
            </div>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">Resources</h4>
            <div className="space-y-2">
              <Link href="/developers" className="block text-sm text-secondary hover:text-amber">Documentation</Link>
              <a href="#" className="block text-sm text-secondary hover:text-amber">GitHub</a>
              <a href="#" className="block text-sm text-secondary hover:text-amber">Audit Report</a>
            </div>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">Legal</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-secondary hover:text-amber">Privacy Policy</a>
              <a href="#" className="block text-sm text-secondary hover:text-amber">Terms</a>
              <a href="#" className="block text-sm text-secondary hover:text-amber">Security</a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted">
          © 2026 MIDAS Protocol. Built on Starknet.
        </div>
      </div>
    </footer>
  )
}
