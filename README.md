# PHANTOM — ZK Private Execution Layer for BTCFi on Starknet

**The first zero-knowledge private execution layer purpose-built for Bitcoin assets on Starknet.**

PHANTOM solves a concrete, financially significant problem: every BTC position in the BTCFi ecosystem on Starknet — deposits in Vesu, swaps on AVNU, yield positions in Uncap and Opus, liquidity provision on Ekubo — is fully public on-chain. Every wallet, every amount, every strategy is visible to MEV bots, copy-traders, and competitors the moment a transaction lands.

PHANTOM provides:

1. **Shield Pool** — Deposit BTC-family assets (wBTC, tBTC, LBTC, SolvBTC) into a shielded pool where only ZK-proven commitments exist on-chain.
2. **Private Swap** — Execute asset swaps from inside the shield pool via AVNU integration.
3. **Shielded Yield** — Deposit shielded BTC into Vesu, Uncap, and Opus. Earn real yield privately.
4. **Intent Dark Pool** — Submit encrypted trade intents. Matching engine pairs complementary intents and settles atomically.
5. **Selective Disclosure** — Generate auditor-specific compliance proofs that disclose exactly what regulators need.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Shield  │ │  Unshield│ │   Swap   │ │  Yield   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TypeScript SDK (@phantom-btc/sdk)             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  NoteStore   │ │ProverWorker  │ │ Integrations │            │
│  │  (IndexedDB) │ │  (WASM)      │ │ (AVNU, Vesu) │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Starknet Smart Contracts                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ PhantomPool  │ │ PhantomMerkle│ │  Verifier    │            │
│  │  (Core)      │ │  (Tree)      │ │  (Stwo)      │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │ Compliance   │ │   Intent     │                              │
│  │  Oracle      │ │   Matcher    │                              │
│  └──────────────┘ └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ZK Circuits (Rust + Stwo)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Shield  │ │ Unshield │ │  Swap    │ │Compliance│           │
│  │  Circuit │ │  Circuit │ │  Circuit │ │  Circuit │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

**Exact versions required:**

```bash
# Cairo / Starknet
Cairo:              2.13.1
Scarb:              2.13.1
Starknet Foundry:   0.51.1  (snforge + sncast)

# Rust
Rust:               stable, 2024 edition
wasm-pack:          0.13.x
wasm-bindgen:       0.2.x

# Node.js
Node.js:            20 LTS
npm:                10.x

# Frontend
Next.js:            14.x
TypeScript:         5.x strict mode
```

**Install prerequisites:**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Scarb (Cairo package manager)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# Install Starknet Foundry
curl --proto '=https' --tlsv1.2 -sSf https://foundry-rs.github.io/starknet-foundry/install.sh | sh

# Install Node.js (via nvm recommended)
nvm install 20
nvm use 20
```

---

## Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/phantom-btc/phantom.git
cd phantom

# Install SDK dependencies
cd sdk
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install Rust dependencies
cd ../circuits
cargo build
```

### 2. Configure Environment

```bash
# Copy example environment
cp .env.example .env.local

# Edit .env.local with your configuration:
# - Starknet RPC URL (Infura/Alchemy)
# - Contract addresses (after deployment)
# - Token addresses
```

### 3. Build WASM Prover

```bash
# From project root
./scripts/build_wasm.sh

# Or manually:
cd circuits
wasm-pack build --target web --out-dir ../wasm/pkg --features wasm
```

---

## Building the WASM Prover

```bash
# Full build with tests and optimization
./scripts/build_wasm.sh

# Manual build steps:
cd circuits

# Run tests
cargo test --lib

# Build WASM
wasm-pack build --target web --out-dir ../wasm/pkg --features wasm

# Optimize (requires binaryen)
wasm-opt -O3 wasm/pkg/phantom_prover_bg.wasm -o wasm/pkg/phantom_prover_bg.optimized.wasm
mv wasm/pkg/phantom_prover_bg.optimized.wasm wasm/pkg/phantom_prover_bg.wasm
```

**Performance targets:**
- Shield proof: < 1.5 seconds
- Unshield proof: < 2.5 seconds
- Private swap proof: < 4 seconds
- Compliance bundle: < 6 seconds

---

## Deploying to Sepolia

```bash
# Set your deployer address
export DEPLOYER_ADDRESS=0xYourStarknetAddress

# Run deployment script
./scripts/deploy_sepolia.sh

# Expected output:
# === PHANTOM: Starknet Sepolia Deployment ===
# [1/6] Building WASM prover...
# ✓ WASM prover built
# [2/6] Running Cairo test suite...
# ✓ Cairo tests completed
# [3/6] Deploying contracts to Sepolia...
# PhantomMerkle: 0x...
# PhantomVerifier: 0x...
# ComplianceOracle: 0x...
# IntentMatcher: 0x...
# PhantomPool: 0x...
# ✓ Addresses written to .env.local
# === Deployment complete ===
```

**Contract addresses are saved to `.env.local`**

---

## Running the Frontend

```bash
cd frontend

# Development server
npm run dev

# Production build
npm run build
npm start

# Open in browser: http://localhost:3000
```

---

## Running the Full Test Suite

```bash
# Cairo contract tests
cd contracts
snforge test --workspace

# Rust circuit tests
cd circuits
cargo test --lib

# Circuit verification (soundness checks)
./scripts/verify_circuits.sh

# TypeScript SDK tests
cd sdk
npm test

# Frontend tests
cd frontend
npm test

# All tests should pass with zero failures
```

**Expected test counts:**
- Cairo: 500+ tests
- Rust: 100+ tests
- TypeScript: 50+ tests

---

## Integration Guide

### Using @phantom-btc/sdk in Your dApp

```typescript
import { PhantomSDK } from '@phantom-btc/sdk';
import { connect } from 'starknetkit';

// Connect wallet
const { account } = await connect({ modalMode: 'alwaysAsk' });

// Initialize PHANTOM SDK
const sdk = new PhantomSDK({
  rpcUrl: 'https://starknet-sepolia.infura.io/v3/YOUR_KEY',
  account: account,
  storagePassword: 'user-chosen-password',
});

await sdk.initialize();

// Shield 1 wBTC
const note = await sdk.shield({
  asset: 'WBTC',
  amount: BigInt(100000000), // 1 wBTC in satoshis
  onProgress: (step, message) => {
    console.log(`[${step}] ${message}`);
  },
});

console.log('Shielded note commitment:', note.commitment);

// Private swap via AVNU
const outputNote = await sdk.privateSwap({
  noteIn: note,
  assetOut: 'USDC',
  minAmountOut: BigInt(95000000), // Minimum output
  slippageTolerance: 0.005, // 0.5% slippage
});

// Deposit to Vesu for yield
const position = await sdk.depositShieldedYield({
  note: outputNote,
  protocol: 'vesu',
});

// Export backup (CRITICAL - users must do this)
const backup = await sdk.exportBackup();
// Download backup file to secure location
```

### React Hook Example

```typescript
import { usePhantomBalance } from '@phantom-btc/sdk/hooks';

function MyComponent() {
  const { balance, loading, error } = usePhantomBalance('WBTC');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Your shielded balance: {balance} WBTC</div>;
}
```

---

## Security Notes

### For Users

⚠ **CRITICAL: Your shield notes are stored ONLY in your browser.**

- **Backup your notes:** Use the Export Backup feature regularly
- **Never share your password:** It encrypts your local note storage
- **Clearing browser data = losing funds:** Without a backup, cleared notes cannot be recovered
- **Notes are NEVER sent to servers:** All proof generation happens locally in your browser

### For Operators

- **Nullifier registry is PERMANENT:** Once a nullifier is marked spent, it cannot be unspent
- **Historical roots are always valid:** Users can unshield against any past Merkle root
- **Pause does NOT block withdrawals:** Users must always be able to withdraw funds
- **Verifier updates require 7-day timelock:** Security measure against malicious upgrades

---

## Known Limitations (v1.0)

1. **Testnet only:** Currently deployed on Starknet Sepolia. Mainnet deployment pending audit.
2. **Limited assets:** Supports wBTC, tBTC, LBTC, SolvBTC, STRK, USDC. More assets coming.
3. **Browser-based prover:** Proof generation takes 1-4 seconds depending on circuit complexity.
4. **No mobile app:** Web-only interface. Mobile apps planned for v2.
5. **Single regulator registry:** Multi-jurisdiction compliance coming in v2.
6. **No hardware wallet support:** Browser wallet only (Argent X, Braavos).

---

## License

MIT License

Copyright (c) 2026 PHANTOM Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

*PHANTOM — Real cryptography. Real privacy. Real Bitcoin DeFi.*
