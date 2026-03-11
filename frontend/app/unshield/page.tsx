'use client';

export default function UnshieldPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-title mb-2">Unshield Assets</h1>
        <p className="text-body text-textMuted mb-8">
          Withdraw assets from the shield pool back to your wallet.
        </p>

        <div className="max-w-xl mx-auto p-6 bg-surface rounded-xl border border-border">
          <div className="mb-6">
            <label className="block text-label text-textMuted mb-2">Select Note</label>
            <select className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary">
              <option>No shielded notes found</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-label text-textMuted mb-2">Recipient Address</label>
            <input
              type="text"
              placeholder="0x..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary"
            />
          </div>

          <div className="mb-6">
            <label className="block text-label text-textMuted mb-2">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary"
            />
          </div>

          <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors">
            Unshield
          </button>
        </div>
      </div>
    </main>
  );
}
