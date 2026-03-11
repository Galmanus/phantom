export default function DevelopersPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-title mb-2">Developers</h1>
        <p className="text-body text-textMuted mb-8">
          Integrate PHANTOM into your dApp. Build private BTCFi experiences.
        </p>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-section mb-4">Installation</h2>
          <div className="p-4 bg-surface rounded-xl border border-border font-mono text-sm">
            <code className="text-text">npm install @phantom-btc/sdk</code>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-section mb-4">Quick Start</h2>
          <div className="p-4 bg-surface rounded-xl border border-border overflow-x-auto">
            <pre className="font-mono text-sm text-text">
{`import { PhantomSDK } from '@phantom-btc/sdk';

// Initialize SDK
const sdk = new PhantomSDK({
  rpcUrl: 'https://starknet-sepolia.infura.io/v3/YOUR_KEY',
  account: starknetAccount,
  storagePassword: 'user-password',
});

await sdk.initialize();

// Shield assets
const note = await sdk.shield({
  asset: 'WBTC',
  amount: BigInt(100000000), // 1 wBTC in satoshis
  onProgress: (step, message) => {
    console.log(step, message);
  },
});

console.log('Shielded note:', note);`}
            </pre>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="text-section mb-4">API Reference</h2>
          
          <div className="space-y-6">
            <APIMethod
              name="shield"
              description="Deposit assets into the shield pool"
              params={[
                { name: 'asset', type: 'string', description: 'Asset symbol (WBTC, tBTC, etc.)' },
                { name: 'amount', type: 'bigint', description: 'Amount in base units' },
                { name: 'onProgress', type: 'callback', description: 'Progress callback', optional: true },
              ]}
              returns="Promise&lt;ShieldedNote&gt;"
            />

            <APIMethod
              name="unshield"
              description="Withdraw assets from the shield pool"
              params={[
                { name: 'note', type: 'ShieldedNote', description: 'The note to spend' },
                { name: 'recipient', type: 'string', description: 'Recipient address' },
                { name: 'amount', type: 'bigint', description: 'Amount to withdraw' },
              ]}
              returns="Promise&lt;string&gt; (transaction hash)"
            />

            <APIMethod
              name="privateSwap"
              description="Execute a private swap via AVNU"
              params={[
                { name: 'noteIn', type: 'ShieldedNote', description: 'Input note' },
                { name: 'assetOut', type: 'string', description: 'Output asset symbol' },
                { name: 'minAmountOut', type: 'bigint', description: 'Minimum output amount' },
                { name: 'slippageTolerance', type: 'number', description: 'Slippage tolerance (e.g., 0.005)' },
              ]}
              returns="Promise&lt;ShieldedNote&gt;"
            />

            <APIMethod
              name="depositShieldedYield"
              description="Deposit to yield protocol"
              params={[
                { name: 'note', type: 'ShieldedNote', description: 'Note to deposit' },
                { name: 'protocol', type: "'vesu' | 'uncap' | 'opus'", description: 'Yield protocol' },
              ]}
              returns="Promise&lt;YieldPosition&gt;"
            />
          </div>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-section mb-4">Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <ResourceLink
              title="Documentation"
              description="Full API documentation and guides"
              href="#"
            />
            <ResourceLink
              title="GitHub"
              description="Source code and examples"
              href="#"
            />
            <ResourceLink
              title="Discord"
              description="Community support"
              href="#"
            />
            <ResourceLink
              title="Testnet Faucet"
              description="Get testnet tokens"
              href="#"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function APIMethod({
  name,
  description,
  params,
  returns,
}: {
  name: string;
  description: string;
  params: Array<{ name: string; type: string; description: string; optional?: boolean }>;
  returns: string;
}) {
  return (
    <div className="p-6 bg-surface rounded-xl border border-border">
      <div className="flex items-baseline gap-3 mb-2">
        <code className="text-primary font-mono text-lg">{name}</code>
        <code className="text-textMuted text-sm">→ {returns}</code>
      </div>
      <p className="text-body text-textMuted mb-4">{description}</p>
      
      <div className="space-y-2">
        {params.map((param) => (
          <div key={param.name} className="flex gap-4 text-sm">
            <code className="font-mono text-text w-32">{param.name}{param.optional && '?'}</code>
            <code className="font-mono text-secondary w-24">{param.type}</code>
            <span className="text-textMuted">{param.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceLink({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="p-4 bg-surface/50 rounded-lg border border-border hover:border-primary/50 transition-colors block"
    >
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm text-textMuted">{description}</div>
    </a>
  );
}
