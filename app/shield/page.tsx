'use client'

import { ShieldForm } from '../../components/shield/ShieldForm'
import { NoteList } from '../../components/shield/NoteList'

export default function ShieldPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-parchment mb-4">
            Shield
          </h1>
          <p className="text-lg text-secondary">
            Make your Bitcoin invisible. Deposit into the shield pool and your position 
            disappears from public view.
          </p>
        </div>

        {/* Main Content - Two Panels */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form Panel - 55% */}
          <div className="lg:col-span-3">
            <ShieldForm />
          </div>

          {/* Notes Panel - 45% */}
          <div className="lg:col-span-2">
            <NoteList />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-surface rounded-xl border border-subtle">
            <h3 className="font-display font-bold text-parchment mb-2">Non-custodial</h3>
            <p className="text-sm text-secondary">
              Your keys, your crypto. PHANTOM never takes custody of your assets.
            </p>
          </div>
          <div className="p-6 bg-surface rounded-xl border border-subtle">
            <h3 className="font-display font-bold text-parchment mb-2">Client-side proofs</h3>
            <p className="text-sm text-secondary">
              All ZK proofs are generated in your browser. Your data never leaves your device.
            </p>
          </div>
          <div className="p-6 bg-surface rounded-xl border border-subtle">
            <h3 className="font-display font-bold text-parchment mb-2">Selective disclosure</h3>
            <p className="text-sm text-secondary">
              Prove compliance to regulators without revealing your full position.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
