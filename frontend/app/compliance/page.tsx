'use client';

import { useState } from 'react';

export default function CompliancePage() {
  const [scope, setScope] = useState<'amount_only' | 'kyc_status' | 'full_audit'>('amount_only');

  const regulators = [
    { id: 'bcb', name: 'Banco Central do Brasil', country: 'Brazil' },
    { id: 'fincen', name: 'FinCEN', country: 'United States' },
    { id: 'fca', name: 'FCA', country: 'United Kingdom' },
  ];

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-title mb-2">Selective Disclosure</h1>
        <p className="text-body text-textMuted mb-8">
          Generate compliance proofs for regulators. Disclose only what's necessary.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Regulator Selection */}
          <div className="p-6 bg-surface rounded-xl border border-border">
            <h2 className="text-section mb-6">Select Regulator</h2>
            
            <div className="space-y-3">
              {regulators.map((regulator) => (
                <button
                  key={regulator.id}
                  className="w-full p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="font-semibold">{regulator.name}</div>
                  <div className="text-sm text-textMuted">{regulator.country}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection */}
          <div className="p-6 bg-surface rounded-xl border border-border">
            <h2 className="text-section mb-6">Disclosure Scope</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'amount_only'}
                  onChange={() => setScope('amount_only')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">Amount Only</div>
                  <div className="text-sm text-textMuted">
                    I confirm this transaction is below reporting threshold
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'kyc_status'}
                  onChange={() => setScope('kyc_status')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">KYC Status</div>
                  <div className="text-sm text-textMuted">
                    I confirm my identity is KYC-verified
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'full_audit'}
                  onChange={() => setScope('full_audit')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">Full Audit</div>
                  <div className="text-sm text-textMuted">
                    KYC status, amount range, and sanctions screening
                  </div>
                </div>
              </label>
            </div>

            <button className="w-full mt-6 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors">
              Generate Proof
            </button>
          </div>
        </div>

        {/* Privacy Explainer */}
        <div className="mt-8 p-6 bg-surface/50 rounded-xl border border-border">
          <h3 className="text-section mb-4">What the regulator will see</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-success mb-2">✓ Revealed</h4>
              <ul className="text-body text-textMuted space-y-1">
                <li>• Transaction is KYC-verified</li>
                <li>• Amount is below reporting threshold</li>
                <li>• Recipient is not on sanctions lists</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-danger mb-2">✗ Remains Private</h4>
              <ul className="text-body text-textMuted space-y-1">
                <li>• Your wallet address</li>
                <li>• Exact transaction amount</li>
                <li>• Which protocol you used</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
