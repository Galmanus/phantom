'use client'
import { useRouter } from 'next/navigation'

export default function ShieldPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-8">
      <div className="max-w-lg w-full">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber/10 border border-amber/30
                        flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-display font-bold text-text-primary mb-3">
          Shielding is now automatic.
        </h1>

        <p className="text-text-primary/60 mb-8 leading-relaxed">
          PHANTOM now uses <span className="text-amber font-medium">strkBTC</span> —
          Starknet's native private Bitcoin token. Your balance is private by default,
          no manual shielding required.
        </p>

        {/* What changed */}
        <div className="bg-panel border border-amber/10 rounded-xl p-5 mb-8">
          <div className="text-xs font-mono text-amber uppercase tracking-wider mb-4">
            What changed
          </div>
          <div className="space-y-3">
            {[
              {
                before: 'Manual shield transaction required',
                after: 'strkBTC is private by default',
              },
              {
                before: 'Custom ZK circuit for each deposit',
                after: 'Starknet STRK20 handles privacy natively',
              },
              {
                before: 'Shield first, then earn',
                after: 'Earn directly with private balance',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="text-text-primary/30 line-through flex-1">
                  {item.before}
                </div>
                <svg className="w-4 h-4 text-amber shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="text-zk-green flex-1">
                  {item.after}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/yield')}
            className="w-full bg-amber text-void font-bold py-4 rounded-xl
                       hover:bg-amber/90 transition-colors flex items-center
                       justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Start Earning Privately
          </button>
          <button
            onClick={() => router.push('/swap')}
            className="w-full border border-amber/30 text-amber font-medium py-4
                       rounded-xl hover:bg-amber/10 transition-colors"
          >
            Get strkBTC First
          </button>
        </div>

      </div>
    </div>
  )
}
