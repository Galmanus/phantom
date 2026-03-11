'use client'
import { useState } from 'react'

type Section = 'quickstart' | 'sdk' | 'architecture' | 'contracts' | 'examples'

export default function DevelopersPage() {
  const [activeSection, setActiveSection] = useState<Section>('quickstart')

  const sections = [
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'sdk', label: 'SDK Reference' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'examples', label: 'Examples' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-display font-black text-5xl text-parchment mb-4">Developers</h1>
        <p className="text-lg text-secondary mb-12">Build privacy into your BTCFi applications.</p>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-24 space-y-1">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id as Section)} className={`block w-full text-left px-4 py-2 rounded-lg font-mono text-sm transition-all ${activeSection === s.id ? 'bg-amber text-void' : 'text-muted hover:text-parchment hover:bg-surface'}`}>{s.label}</button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {activeSection === 'quickstart' && (
              <div className="space-y-12">
                <section>
                  <h2 className="font-display font-bold text-3xl text-parchment mb-6">Quick Start</h2>
                  <p className="text-secondary text-lg mb-8">Get up and running with PHANTOM SDK in under 5 minutes.</p>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Step 1: Installation</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`# Using pnpm (recommended)
pnpm add @phantom-btc/sdk

# Or npm
npm install @phantom-btc/sdk

# Or yarn
yarn add @phantom-btc/sdk`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Step 2: Environment Variables</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`# .env.local
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io
NEXT_PUBLIC_PHANTOM_POOL_ADDRESS=0x...
NEXT_PUBLIC_WBTC_ADDRESS=0x...
NEXT_PUBLIC_TBTC_ADDRESS=0x...
NEXT_PUBLIC_LBTC_ADDRESS=0x...
NEXT_PUBLIC_SOLVBTC_ADDRESS=0x...`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Step 3: Initialize & Shield BTC</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm">
{`import { PhantomSDK } from '@phantom-btc/sdk'
import { parseAmount } from '@phantom-btc/sdk'

// Initialize with your Starknet account
const phantom = new PhantomSDK({
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
  account: yourStarknetAccount,
  storagePassword: 'your-encryption-password',
})

// Initialize (loads WASM prover, opens IndexedDB)
await phantom.initialize()

// Shield 0.1 BTC into the privacy pool
const note = await phantom.shield({
  asset: 'WBTC',
  amount: parseAmount('0.1', 8), // 8 decimals for BTC
  onProgress: (step, message) => {
    console.log(\`[\${step}] \${message}\`)
  },
})

console.log('Shielded note:', note.commitment)
// Note is now stored encrypted in IndexedDB`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Step 4: Unshield (Withdraw)</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm">
{`// Get all your shielded notes
const notes = await phantom.getNotes()

// Unshield 0.05 BTC back to your wallet
const txHash = await phantom.unshield({
  note: notes[0],
  recipient: yourStarknetAddress,
  amount: parseAmount('0.05', 8),
})

console.log('Unshielded! Transaction:', txHash)`}
                    </pre>
                  </div>

                  <div className="card mt-6 bg-amber/10 border-amber/30">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">⚡ Pro Tip: Using with React</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`// hooks/usePhantomSDK.ts
import { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { PhantomSDK } from '@phantom-btc/sdk'

export function usePhantomSDK() {
  const { account } = useAccount()
  
  return useMemo(() => {
    if (!account) return null
    
    return new PhantomSDK({
      rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
      account,
      storagePassword: 'user-session-key',
    })
  }, [account])
}`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">What's Next?</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <a href="#" onClick={() => setActiveSection('sdk')} className="card hover:border-amber transition-all cursor-pointer">
                      <h4 className="font-bold text-parchment mb-1">SDK Reference</h4>
                      <p className="text-sm text-muted">Explore all available methods and types.</p>
                    </a>
                    <a href="#" onClick={() => setActiveSection('examples')} className="card hover:border-amber transition-all cursor-pointer">
                      <h4 className="font-bold text-parchment mb-1">Example Projects</h4>
                      <p className="text-sm text-muted">Full working code for common use cases.</p>
                    </a>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'sdk' && (
              <div className="space-y-12">
                <section>
                  <h2 className="font-display font-bold text-3xl text-parchment mb-6">SDK Reference</h2>
                  <p className="text-secondary text-lg mb-8">Complete API reference for the PHANTOM SDK.</p>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">PhantomSDK</h3>
                    <p className="text-sm text-secondary mb-4">Main entry point for PHANTOM protocol interactions.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`import { PhantomSDK } from '@phantom-btc/sdk'

const phantom = new PhantomSDK({
  rpcUrl: string,           // Starknet RPC URL
  account: Account,         // starknet.js Account
  storagePassword: string,   // Encryption key for IndexedDB
  chainId?: string,         // Optional: defaults to SN_SEPOLIA
})

// Must call after construction
await phantom.initialize()`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">phantom.shield()</h3>
                    <p className="text-sm text-secondary mb-4">Deposit assets into the PHANTOM shield pool. Generates a ZK commitment and submits to Starknet.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`interface ShieldParams {
  asset: string              // Asset symbol: 'WBTC' | 'TBTC' | 'LBTC' | 'SOLVBTC'
  amount: bigint             // Amount in wei (use parseAmount())
  recipient?: string         // Optional: shield to another address
  onProgress?: (step: ShieldStep, message: string) => void
}

type ShieldStep = 
  | 'generating_randomness'   // Creating cryptographic secrets
  | 'computing_commitment'    // Computing Pedersen/poseidon commitment
  | 'generating_proof'        // ZK proof generation (WASM)
  | 'submitting_transaction'  // On-chain transaction

// Returns: ShieldedNote
interface ShieldedNote {
  commitment: FieldElement    // Public commitment hash
  amount: bigint             // Shielded amount
  assetId: AssetId           // Asset type
  nullifierSecret: FieldElement  // Private spending key
  serialNumber: FieldElement     // Unique serial
  salt: FieldElement         // Randomness
  leafIndex: number          // Merkle tree position
  merkleRoot: FieldElement   // Current tree root
  createdAt: number         // Timestamp
  spent: boolean             // Whether note is spent
}`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">phantom.unshield()</h3>
                    <p className="text-sm text-secondary mb-4">Withdraw assets from the shield pool. Generates proof of ownership without revealing the note.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`interface UnshieldParams {
  note: ShieldedNote         // The note to spend
  recipient: string          // Destination address
  amount: bigint            // Amount to withdraw
  onProgress?: (step: UnshieldStep, message: string) => void
}

type UnshieldStep =
  | 'fetching_merkle_data'   // Getting tree data from chain
  | 'computing_nullifier'   // Computing spend nullifier
  | 'generating_proof'       // ZK proof of spend authority
  | 'submitting_transaction' // On-chain withdrawal

// Returns: transaction hash (string)`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">phantom.privateSwap()</h3>
                    <p className="text-sm text-secondary mb-4">Execute a private atomic swap between shielded assets via AVNU.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`interface SwapParams {
  noteIn: ShieldedNote       // Input note to spend
  assetOut: string           // Output asset symbol
  minAmountOut: bigint      // Minimum output amount (slippage protection)
  slippageTolerance: number // 0.01 = 1% slippage
  onProgress?: (step: SwapStep, message: string) => void
}

type SwapStep =
  | 'fetching_price_quote'  // Getting quote from AVNU
  | 'generating_proof'       // ZK swap proof
  | 'executing_swap'         // Submitting to pool
  | 'settling'              // Final settlement

// Returns: ShieldedNote (new output note)`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">phantom.depositShieldedYield()</h3>
                    <p className="text-sm text-secondary mb-4">Deposit shielded funds into yield protocols (Vesu, Uncap, Opus).</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`interface YieldParams {
  note: ShieldedNote         // Note to deposit
  protocol: 'vesu' | 'uncap' | 'opus'  // Yield protocol
  onProgress?: (step: YieldStep, message: string) => void
}

interface YieldPosition {
  depositCommitment: FieldElement
  protocol: 'vesu' | 'uncap' | 'opus'
  protocolId: number
  principalAmount: bigint
  assetId: AssetId
  yieldPositionSecret: FieldElement
  depositTimestamp: number
  lastClaimTimestamp: number
  claimed: boolean
}`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">phantom.selectiveDisclosure()</h3>
                    <p className="text-sm text-secondary mb-4">Generate compliance proofs without revealing full transaction details.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`interface DisclosureParams {
  type: 'amount_below_threshold' | 'kyc_status' | 'full_audit'
  threshold?: bigint         // For amount_below_threshold
  regulatorId?: string       // For kyc_status / full_audit
}

interface ComplianceProof {
  regulatorId: string
  scope: 'amount_only' | 'kyc_status' | 'full_audit'
  kycProof: KYCProof
  amountProof: AmountProof
  sanctionsProof: SanctionsProof
  proofBundle: string
  generatedAt: number
}`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">phantom.getNotes()</h3>
                    <p className="text-sm text-secondary mb-4">Retrieve all shielded notes from local encrypted storage.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`// Returns all notes (confirmed + pending)
const allNotes = await phantom.getNotes()

// Filter by status
const confirmed = allNotes.filter(n => n.status === 'confirmed')
const pending = allNotes.filter(n => n.status === 'pending')

// Filter by asset
const wbtcNotes = allNotes.filter(n => n.assetId === AssetId.WBTC)

// Calculate total balance
const totalBalance = confirmed.reduce((sum, n) => sum + n.amount, 0n)`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">Type References</h3>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">AssetId</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`enum AssetId {
  WBTC = 0,
  TBTC = 1,
  LBTC = 2,
  SOLVBTC = 3,
  STRK = 4,
  USDC = 5,
}

// Helper functions
import { getAssetBySymbol, getAssetById, parseAmount, formatAmount } from '@phantom-btc/sdk'

const asset = getAssetBySymbol('WBTC')
// { id: 0, name: 'Wrapped Bitcoin', symbol: 'wBTC', decimals: 8, ... }

const amount = parseAmount('0.1', 8)  // 10000000n
const formatted = formatAmount(10000000n, 8)  // "0.1"`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Error Handling</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`import { PhantomError, ProofGenerationError, TransactionError, StorageError, NoteSelectionError } from '@phantom-btc/sdk'

try {
  await phantom.shield({ asset: 'WBTC', amount: 10000000n })
} catch (error) {
  if (error instanceof ProofGenerationError) {
    console.error('ZK proof failed:', error.message)
  } else if (error instanceof TransactionError) {
    console.error('Transaction reverted:', error.details)
  } else if (error instanceof NoteSelectionError) {
    // Concurrency issue - note already selected by another operation
    console.error('Note in use, try again')
  } else if (error instanceof StorageError) {
    console.error('IndexedDB error:', error.message)
  }
}`}
                    </pre>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'architecture' && (
              <div className="space-y-12">
                <section>
                  <h2 className="font-display font-bold text-3xl text-parchment mb-6">Architecture</h2>
                  <p className="text-secondary text-lg mb-8">Understanding the PHANTOM protocol stack.</p>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-6">5-Layer Architecture</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-sm font-bold">5</div>
                        <div className="flex-1">
                          <div className="font-bold text-parchment">Frontend (Next.js + starknet-react)</div>
                          <div className="text-sm text-muted">User interface, wallet integration, proof terminal UI</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-sm font-bold">4</div>
                        <div className="flex-1">
                          <div className="font-bold text-parchment">SDK (TypeScript)</div>
                          <div className="text-sm text-muted">Developer API, note management, encrypted storage</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-sm font-bold">3</div>
                        <div className="flex-1">
                          <div className="font-bold text-parchment">WASM Prover (Rust + Stwo)</div>
                          <div className="text-sm text-muted">Client-side ZK proof generation, runs in Web Worker</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-sm font-bold">2</div>
                        <div className="flex-1">
                          <div className="font-bold text-parchment">ZK Circuits (Rust + Stwo AIR)</div>
                          <div className="text-sm text-muted">Privacy-preserving computation definitions</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber/20 flex items-center justify-center text-amber font-mono text-sm font-bold">1</div>
                        <div className="flex-1">
                          <div className="font-bold text-parchment">Starknet Contracts (Cairo)</div>
                          <div className="text-sm text-muted">On-chain state, proof verification, asset custody</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">Data Flow: Shield</h3>
                  <div className="card">
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`1. USER INITIATES SHIELD
   │
   ▼
2. SDK GENERATES SECRETS
   ├── nullifier_secret (private spending key)
   ├── salt (randomness)
   └── serial_number (unique identifier)
   │
   ▼
3. SDK COMPUTES COMMITMENT
   commitment = Poseidon2(asset_id, amount, nullifier_secret, salt)
   │
   ▼
4. WASM PROVER GENERATES ZK PROOF
   ├── Proves: user knows (nullifier_secret, salt)
   ├── Public: commitment, asset_id, amount
   └── Constraint: amount < 2^64 (range check)
   │
   ▼
5. SDK SUBMITS TO STARKNET
   ├── pool.shield(token, amount, commitment, encrypted_note, proof)
   ├── Token transfer: user → pool
   └── Event: Shielded(commitment, asset_id, leaf_index, encrypted_note)
   │
   ▼
6. NOTE STORED LOCALLY
   ├── Encrypted with user's IVK
   └── Saved to IndexedDB`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">Data Flow: Unshield</h3>
                  <div className="card">
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-sm text-parchment">
{`1. USER INITIATES UNSHIELD
   │
   ▼
2. SDK FETCHES MERKLE DATA
   ├── Current merkle_root from pool
   └── Merkle path for note.leaf_index
   │
   ▼
3. SDK COMPUTES NULLIFIER
   nullifier = Poseidon2(nullifier_secret, serial_number)
   │
   ▼
4. WASM PROVER GENERATES ZK PROOF
   ├── Proves: user knows (nullifier_secret, merkle_path)
   ├── Public: nullifier, recipient, amount, merkle_root
   └── Constraint: nullifier not in spent_registry
   │
   ▼
5. SDK SUBMITS TO STARKNET
   ├── pool.unshield(nullifier, recipient, asset, amount, root, change, proof)
   ├── Token transfer: pool → recipient
   └── Nullifier marked as spent
   │
   ▼
6. NOTE MARKED AS SPENT
   ├── Local note status updated to 'spent'
   └── Change note saved if applicable`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">Security Model</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="card">
                      <h4 className="font-bold text-parchment mb-2">🔒 Privacy Guarantees</h4>
                      <ul className="text-sm text-secondary space-y-2">
                        <li>• Amount & asset hidden via Pedersen commitments</li>
                        <li>• Sender/recipient encrypted</li>
                        <li>• Linkability: only spend authority knows which note</li>
                        <li>• Selective disclosure for compliance</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="font-bold text-parchment mb-2">⚡ Liveness</h4>
                      <ul className="text-sm text-secondary space-y-2">
                        <li>• Ring buffer of 8 Merkle roots</li>
                        <li>• No blocking on concurrent proofs</li>
                        <li>• Client-side proof generation</li>
                        <li>• Web Worker for non-blocking UI</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="font-bold text-parchment mb-2">🛡️ Safety</h4>
                      <ul className="text-sm text-secondary space-y-2">
                        <li>• Nullifier prevents double-spend</li>
                        <li>• Range checks on amounts</li>
                        <li>• Merkle path validation</li>
                        <li>• Encrypted notes for recovery</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="font-bold text-parchment mb-2">🔑 Key Derivation</h4>
                      <ul className="text-sm text-secondary space-y-2">
                        <li>• SNIP-12 wallet signature</li>
                        <li>• PBKDF2 with 600k iterations</li>
                        <li>• IVK for note encryption</li>
                        <li>• Per-note spending keys</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'contracts' && (
              <div className="space-y-12">
                <section>
                  <h2 className="font-display font-bold text-3xl text-parchment mb-6">Contracts</h2>
                  <p className="text-secondary text-lg mb-8">Cairo contract interfaces and function signatures.</p>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">IPhantomPool</h3>
                    <p className="text-sm text-secondary mb-4">Main shield pool contract. Handles deposits, withdrawals, swaps, and yield.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`#[generate_trait]
pub trait IPhantomPool<T> {
    // ─── Core Operations ─────────────────────────────────────────
    
    fn shield(
        ref self: T,
        asset: ContractAddress,
        amount: u256,
        commitment: felt252,
        encrypted_note: ByteArray,
        proof: Span<felt252>,
    ) -> (felt252, u32);

    fn unshield(
        ref self: T,
        nullifier: felt252,
        recipient: ContractAddress,
        asset: ContractAddress,
        amount: u256,
        merkle_root: felt252,
        change_commitment: Option<felt252>,
        proof: Span<felt252>,
    );

    // ─── Private Swaps ────────────────────────────────────────────
    
    fn settle_private_swap(
        ref self: T,
        nullifier_in: felt252,
        commitment_out: felt252,
        proof: Span<felt252>,
        swap_params: Span<felt252>,
    );

    // ─── Yield ────────────────────────────────────────────────────
    
    fn deposit_shielded_yield(
        ref self: T,
        commitment: felt252,
        protocol: u8,
        proof: Span<felt252>,
        yield_params: Span<felt252>,
    );

    fn claim_shielded_yield(
        ref self: T,
        yield_position_nullifier: felt252,
        new_commitment: felt252,
        proof: Span<felt252>,
    );

    // ─── Admin ─────────────────────────────────────────────────────
    
    fn update_verifier(ref self: T, new_verifier: ContractAddress);
    fn pause(ref self: T);
    fn unpause(ref self: T);
    fn add_supported_asset(ref self: T, asset: ContractAddress);

    // ─── Queries ───────────────────────────────────────────────────
    
    fn get_merkle_root(self: @T) -> felt252;
    fn is_nullifier_spent(self: @T, nullifier: felt252) -> bool;
    fn is_valid_historical_root(self: @T, root: felt252) -> bool;
    fn is_paused(self: @T) -> bool;
}`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">IComplianceOracle</h3>
                    <p className="text-sm text-secondary mb-4">Regulatory compliance verification and selective disclosure.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`#[generate_trait]
pub trait IComplianceOracle<T> {
    // ─── Authority Management ─────────────────────────────────────
    
    fn register_authority(
        ref self: T,
        authority_id: felt252,
        name: ByteArray,
        scope: u8,  // 0=KYC, 1=Amount, 2=Sanctions, 3=Full
    );

    fn update_authority_scope(
        ref self: T,
        authority_id: felt252,
        new_scope: u8,
    );

    // ─── Proof Verification ────────────────────────────────────────
    
    fn verify_kyc_proof(
        self: @T,
        proof: Span<felt252>,
        authority_id: felt252,
    ) -> bool;

    fn verify_amount_proof(
        self: @T,
        proof: Span<felt252>,
        threshold: u256,
        authority_id: felt252,
    ) -> bool;

    fn verify_sanctions_proof(
        self: @T,
        proof: Span<felt252>,
        recipient: ContractAddress,
        authority_id: felt252,
    ) -> bool;

    // ─── Disclosure Records ────────────────────────────────────────
    
    fn record_disclosure(
        ref self: T,
        user: ContractAddress,
        authority_id: felt252,
        proof_type: u256,
        metadata: ByteArray,
    );

    fn get_disclosure_history(
        self: @T,
        user: ContractAddress,
    ) -> Array<felt252>;
}`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">IIntentMatcher</h3>
                    <p className="text-sm text-secondary mb-4">Dark pool for matching private swap intents.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`#[generate_trait]
pub trait IIntentMatcher<T> {
    // ─── Intent Submission ────────────────────────────────────────
    
    fn submit_intent(
        ref self: T,
        intent_commitment: felt252,
        encrypted_intent: ByteArray,
        valid_until: u64,
        proof: Span<felt252>,
    );

    fn cancel_intent(
        ref self: T,
        intent_commitment: felt252,
        proof: Span<felt252>,
    );

    // ─── Matching ──────────────────────────────────────────────────
    
    fn match_intents(
        ref self: T,
        intent_a: felt252,
        intent_b: felt252,
        proof: Span<felt252>,
    );

    // ─── Queries ──────────────────────────────────────────────────
    
    fn get_intent(
        self: @T,
        commitment: felt252,
    ) -> (ByteArray, u64, bool);  // encrypted, expiry, active

    fn get_matches_for_intent(
        self: @T,
        commitment: felt252,
    ) -> Array<felt252>;
}`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">Contract Addresses</h3>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Sepolia Testnet</h3>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">PHANTOM Pool</span><span className="text-parchment">Deploy after testing</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">Verifier</span><span className="text-parchment">Deploy after testing</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">Compliance Oracle</span><span className="text-parchment">Deploy after testing</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">Intent Matcher</span><span className="text-parchment">Deploy after testing</span></div>
                    </div>
                  </div>

                  <div className="card mt-4">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Supported Assets</h3>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">WBTC</span><span className="text-amber">Wrapped Bitcoin</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">TBTC</span><span className="text-amber">tBTC</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">LBTC</span><span className="text-amber">Liquid Bitcoin</span></div>
                      <div className="flex justify-between p-3 bg-surface rounded-lg"><span className="text-muted">SOLVBTC</span><span className="text-amber">SolvBTC</span></div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">Storage Layout</h3>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">PhantomPool Storage</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`#[storage]
struct Storage {
    // ─── Merkle Tree ──────────────────────────────────────────────
    merkle_tree: MerkleTree,
    merkle_roots: LegacyMap<u8, felt252>,     // Ring buffer (8 roots)
    current_root_index: u8,
    root_count: u64,
    
    // ─── Nullifiers ──────────────────────────────────────────────
    nullifier_registry: LegacyMap<felt252, bool>,
    nullifier_tree: SparseMerkleTree,
    
    // ─── Assets ───────────────────────────────────────────────────
    supported_assets: LegacyMap<felt252, bool>,
    asset_balances: LegacyMap<(felt252, ContractAddress), u256>,
    
    // ─── Shielded Positions ───────────────────────────────────────
    pending_commitments: LegacyMap<felt252, CommitmentData>,
    commitments: LegacyMap<felt252, CommitmentData>,
    
    // ─── Yield ─────────────────────────────────────────────────────
    yield_positions: LegacyMap<felt252, YieldPosition>,
    protocol_deposits: LegacyMap<(u8, ContractAddress), u256>,
    
    // ─── Admin ───────────────────────────────────────────────────
    verifier: ContractAddress,
    pending_verifier: ContractAddress,
    owner: ContractAddress,
    paused: bool,
    
    // ─── Version ─────────────────────────────────────────────────
    version: felt252,
}`}
                    </pre>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'examples' && (
              <div className="space-y-12">
                <section>
                  <h2 className="font-display font-bold text-3xl text-parchment mb-6">Examples</h2>
                  <p className="text-secondary text-lg mb-8">Working code examples for common PHANTOM integrations.</p>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">Example 1: Basic Shield/Unshield</h3>
                    <p className="text-sm text-secondary mb-4">Complete flow for shielding and unshielding Bitcoin.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`import { PhantomSDK } from '@phantom-btc/sdk'
import { parseAmount, formatAmount, AssetId } from '@phantom-btc/sdk'

// Configuration
const RPC_URL = 'https://starknet-sepolia.public.blastapi.io'
const STORAGE_PASSWORD = 'user-session-key-123'

async function main() {
  // 1. Initialize SDK
  const phantom = new PhantomSDK({
    rpcUrl: RPC_URL,
    account: myStarknetAccount,
    storagePassword: STORAGE_PASSWORD,
  })
  
  await phantom.initialize()
  
  // 2. Check balance
  const notes = await phantom.getNotes()
  const confirmedNotes = notes.filter(n => n.status === 'confirmed')
  const totalBalance = confirmedNotes.reduce((sum, n) => sum + n.amount, 0n)
  
  console.log(\`Shielded balance: \${formatAmount(totalBalance, 8)} WBTC\`)
  
  // 3. Shield some BTC
  if (totalBalance === 0n) {
    console.log('No shielded funds, depositing...')
    
    const shieldNote = await phantom.shield({
      asset: 'WBTC',
      amount: parseAmount('0.01', 8),
      onProgress: (step, msg) => console.log(\`[\${step}] \${msg}\`),
    })
    
    console.log(\`Shielded! Commitment: \${shieldNote.commitment}\`)
  }
  
  // 4. Unshield half
  if (confirmedNotes.length > 0) {
    const note = confirmedNotes[0]
    const unshieldAmount = note.amount / 2n
    
    const txHash = await phantom.unshield({
      note,
      recipient: myStarknetAccount.address,
      amount: unshieldAmount,
      onProgress: (step, msg) => console.log(\`[\${step}] \${msg}\`),
    })
    
    console.log(\`Unshielded! Tx: \${txHash}\`)
  }
  
  // 5. Cleanup
  phantom.destroy()
}

main().catch(console.error)`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">Example 2: Private Swap (WBTC → USDC)</h3>
                    <p className="text-sm text-secondary mb-4">Swap shielded WBTC for USDC without revealing amounts.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`import { PhantomSDK } from '@phantom-btc/sdk'
import { parseAmount } from '@phantom-btc/sdk'

async function privateSwap(phantom: PhantomSDK) {
  // 1. Get WBTC note
  const notes = await phantom.getNotes()
  const wbtcNote = notes.find(
    n => n.assetId === AssetId.WBTC && !n.spent && n.status === 'confirmed'
  )
  
  if (!wbtcNote) throw new Error('No WBTC note found')
  
  // 2. Get price quote from AVNU (off-chain)
  const quote = await fetch(
    \`https://starknet.api.avnu.fi/swap/v1/quotes?\` +
    \`sellToken=\${WBTC_ADDRESS}&buyToken=\${USDC_ADDRESS}&\` +
    \`sellAmount=\${wbtcNote.amount}\`
  ).then(r => r.json())
  
  const minAmountOut = BigInt(quote.minAmountOut)
  const slippage = 0.005  // 0.5%
  const minAcceptable = minAmountOut - (minAmountOut * BigInt(slippage * 10000) / 10000n)
  
  // 3. Execute private swap
  const outputNote = await phantom.privateSwap({
    noteIn: wbtcNote,
    assetOut: 'USDC',
    minAmountOut: minAcceptable,
    slippageTolerance: 0.5,
    onProgress: (step, msg) => console.log(\`[\${step}] \${msg}\`),
  })
  
  console.log(\`Swapped! Output note: \${outputNote.commitment}\`)
  console.log(\`Received: \${formatAmount(outputNote.amount, 6)} USDC\`)
}`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">Example 3: Yield Deposit</h3>
                    <p className="text-sm text-secondary mb-4">Deposit shielded BTC into Vesu for yield.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`import { PhantomSDK } from '@phantom-btc/sdk'
import { parseAmount } from '@phantom-btc/sdk'

async function depositYield(phantom: PhantomSDK) {
  // 1. Get a shielded note
  const notes = await phantom.getNotes()
  const note = notes.find(n => n.status === 'confirmed' && !n.spent)
  
  if (!note) throw new Error('No available note')
  
  // 2. Fetch current APY from protocol
  const apy = await fetch('https://api.vesu.xyz/v1/rates/wBTC')
    .then(r => r.json())
    .then(d => d.apy)
  
  console.log(\`Current WBTC APY: \${(apy * 100).toFixed(2)}%\`)
  
  // 3. Deposit to Vesu
  const position = await phantom.depositShieldedYield({
    note,
    protocol: 'vesu',
    onProgress: (step, msg) => console.log(\`[\${step}] \${msg}\`),
  })
  
  console.log(\`Deposited! Position: \${position.depositCommitment}\`)
  
  // 4. Position is automatically tracked
  // Claim yield later with phantom.claimShieldedYield(position)
}`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">Example 4: Compliance Disclosure</h3>
                    <p className="text-sm text-secondary mb-4">Generate a proof that shows "amount below threshold" without revealing exact balance.</p>
                    <pre className="bg-void p-4 rounded-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`import { PhantomSDK } from '@phantom-btc/sdk'
import { parseAmount } from '@phantom-btc/sdk'

async function generateComplianceProof(phantom: PhantomSDK) {
  // Generate proof that balance is below $10,000
  // Useful for KYC exemptions in some jurisdictions
  
  const proof = await phantom.selectiveDisclosure({
    type: 'amount_below_threshold',
    threshold: parseAmount('10000', 2),  // $10,000
  })
  
  console.log(\`Generated compliance proof:\`)
  console.log(\`  Scope: \${proof.scope}\`)
  console.log(\`  Amount in range: \${proof.amountProof.amountInRange}\`)
  console.log(\`  Generated: \${new Date(proof.generatedAt).toISOString()}\`)
  
  // The proof contains:
  // - Zero-knowledge proof that amount < threshold
  // - No information about exact amount
  // - Cryptographic commitment to the regulator
  
  return proof
}

// Also available:
// - 'kyc_status': Prove KYC without revealing identity
// - 'full_audit': Full audit trail for regulators`}
                    </pre>
                  </div>

                  <div className="card mt-6">
                    <h3 className="font-mono text-xs uppercase text-amber mb-3">Example 5: Note Recovery</h3>
                    <p className="text-sm text-secondary mb-4">Recover notes from chain events using viewing key.</p>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`import { PhantomSDK } from '@phantom-btc/sdk'
import { PhantomKeyManager } from '@phantom-btc/sdk'

async function recoverNotes(phantom: PhantomSDK, account: Account) {
  // 1. Derive IVK from wallet (same as initialization)
  const keyManager = await PhantomKeyManager.fromWallet(account)
  
  // 2. Scan chain for Shielded events
  // This queries Starknet for all ShieldEvent logs
  // and decrypts the encrypted_note field using IVK
  const recoveredNotes = await phantom.scanChainEvents(
    account.address,
    keyManager.ivk
  )
  
  console.log(\`Found \${recoveredNotes.length} shielded notes on chain\`)
  
  // 3. Merge with local storage
  // Notes that exist on chain but not locally will be saved
  for (const note of recoveredNotes) {
    const exists = await phantom.getNoteByCommitment(note.commitment)
    if (!exists) {
      await phantom.importNote(note)
      console.log(\`Imported: \${note.commitment}\`)
    }
  }
}

// This is useful for:
// - First-time user setup
// - Switching devices
// - Clearing browser data`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="font-display font-bold text-2xl text-parchment mb-4">React Hook Example</h3>
                  
                  <div className="card">
                    <h3 className="font-mono text-xs uppercase text-muted mb-3">Complete React Integration</h3>
                    <pre className="bg-void p-4 rounded-xl overflow-x-auto font-mono text-xs text-parchment overflow-x-scroll">
{`// components/ShieldButton.tsx
'use client'

import { useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { PhantomSDK } from '@phantom-btc/sdk'
import { parseAmount } from '@phantom-btc/sdk'

export function ShieldButton({ amount }: { amount: string }) {
  const { account } = useAccount()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleShield = async () => {
    if (!account) {
      setError('Connect wallet first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const phantom = new PhantomSDK({
        rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL!,
        account,
        storagePassword: 'session-key',
      })
      
      await phantom.initialize()
      
      const note = await phantom.shield({
        asset: 'WBTC',
        amount: parseAmount(amount, 8),
        onProgress: (step, msg) => {
          console.log(\`[\${step}] \${msg}\`)
        },
      })
      
      alert(\`Shielded! Note: \${note.commitment.slice(0, 10)}...\`)
      phantom.destroy()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <button
        onClick={handleShield}
        disabled={loading || !account}
        className="bg-amber text-void px-6 py-3 rounded-lg font-bold disabled:opacity-50"
      >
        {loading ? 'Shielding...' : 'Shield BTC'}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  )
}`}
                    </pre>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
