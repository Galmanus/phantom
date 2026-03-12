<!--
  PHANTOM — Private BTC Yield Manager on Starknet
  
  The first private BTC yield manager built on STRK20.
  Privacy by default, compliant by design.
-->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Galmanus/phantom/main/phantom.jpeg">
    <img src="https://raw.githubusercontent.com/Galmanus/phantom/main/phantom.jpeg" alt="PHANTOM Logo" width="400">
  </picture>
</p>

<h1 align="center">PHANTOM</h1>

<p align="center">
  <strong>The First Private BTC Yield Manager on Starknet</strong><br>
  Built on STRK20 + strkBTC — Privacy by default, compliant by design
</p>

<p align="center">
  <a href="https://github.com/Galmanus/phantom/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/Galmanus/phantom/main.yml?branch=main" alt="CI Status">
  </a>
  <a href="https://starknet.io">
    <img src="https://img.shields.io/badge/Built_for-Starknet-2ea44f" alt="Starknet">
  </a>
  <a href="https://github.com/Galmanus/phantom/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
  <a href="https://twitter.com/galmanus">
    <img src="https://img.shields.io/badge/Contact-@galmanus-blue.svg" alt="Twitter">
  </a>
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Why Private DeFi](#why-private-defi)
3. [What is STRK20](#what-is-strk20)
4. [Architecture](#architecture)
5. [Features](#features)
6. [Tech Stack](#tech-stack)
7. [Getting Started](#getting-started)
8. [Project Structure](#project-structure)
9. [Security Model](#security-model)
10. [Compliance](#compliance)
11. [Roadmap](#roadmap)
12. [Contributing](#contributing)
13. [License](#license)

---

## Overview

PHANTOM is a **private BTC yield manager** built on Starknet that enables users to:

- **Earn yield** on BTC-backed assets while maintaining complete privacy
- **Shield** their BTC into a privacy pool
- **Trade anonymously** on DEXs like Ekubo
- **Stake privately** without exposing wallet addresses
- **Comply** with regulators when required via encrypted viewing keys

> **Mission:** Bring privacy to DeFi on Starknet, enabling enterprises, institutions, and individuals to use DeFi without exposing their financial activity.

---

## Why Private DeFi?

Every time you move tokens on a public blockchain, you leave a trail:

- Your wallet address
- The amount transferred
- The counterparty
- The timestamp
- Your entire trading strategy

This is incompatible with how modern finance operates:

| Use Case | Problem with Public Blockchains |
|----------|------------------------------|
| **Enterprise Treasury** | Competitors can see all payments and holdings |
| **Institutional Trading** | Regulatory compliance requires confidentiality |
| **Individual Privacy** | Financial privacy is a fundamental right |
| **Market Making** | Strategy exposure leads to front-running |

**PHANTOM solves this** by making every transaction private by default using zero-knowledge proofs.

---

## What is STRK20?

**STRK20** is a native Starknet token standard that implements privacy at the protocol level:

### Key Properties

```
+------------------------------------------------------------------+
|                    STRK20 Token Properties                        |
+------------------------------------------------------------------+
|  Balances are encrypted by default                                |
|  Transfer amounts are hidden from observers                       |
|  Sender and receiver addresses are private                        |
|  All transactions backed by ZK proofs                             |
|  Single pool supports ALL ERC-20 tokens                          |
|  Compatible with existing Starknet accounts                        |
+------------------------------------------------------------------+
```

### How It Works

1. **Deposit** — User deposits BTC-backed tokens into the Privacy Pool
2. **Transact** — ZK proofs verify transactions without revealing details
3. **Withdraw** — User withdraws to a new address, breaking the link

---

## Architecture

```
+------------------------------------------------------------------+
|                           PHANTOM Stack                          |
+------------------------------------------------------------------+

                         +-----------------+
                         |  Frontend (Next.js 14)                   |
                         |  + React 18 + TypeScript                 |
                         |  + Starknet React                        |
                         |  + Tailwind CSS                          |
                         +--------+--------+
                                  |
                                  v
+------------------------------------------------------------------+
|                        PHANTOM SDK                               |
|  +-----------------+  +-----------------+  +-----------------+  |
|  | PhantomKeyManager|  |   NoteStore     |  |ProverWorkerClient|  |
|  |  + PBKDF2       |  |  + IndexedDB    |  |  + WASM Runtime |  |
|  |  + AES-GCM-256  |  |  + Encryption   |  |  + Stwo Prover  |  |
|  |  + SNIP-12      |  |  + Notes        |  |  + Web Worker   |  |
|  +-----------------+  +-----------------+  +-----------------+  |
+---------+-------------------------------------------+----------+
          |                                           |
          v                                           v
+-----------------------------+    +--------------------------------+
|    Cairo Contracts          |    |    Starknet Sequencer          |
|  +-----------------------+ |    |                                |
|  |  + Yield Router      | |    |  + Verifies ZK proofs         |
|  |  + Phantom Pool      | |    |  + Executes transactions       |
|  |  + Phantom Verifier  | |    |  + Maintains state             |
|  |  + Compliance Oracle | |    |                                |
|  +-----------------------+ |    +--------------------------------+
+-----------------------------+
```

### Component Diagram

```
User Wallet
     |
     v
+------------------------------------------+
|           Next.js Frontend               |
|  +--------+ +--------+ +----------+    |
|  | Shield | | Yield  | | Compliance|   |
|  | Page   | | Page   | |   Page    |   |
|  +----+---+ +----+---+ +-----+----+   |
|       |         |          |           |
|       +---------+----------+           |
|                 |                     |
|                 v                     |
|          +--------------+            |
|          | PhantomSDK   |            |
|          |              |            |
|          | + KeyManager |            |
|          | + NoteStore  |            |
|          | + ProverClient              |
|          +-----+-------+            |
+------------------+-------------------+
                   |
                   v
+------------------------------------------+
|           Web Worker (WASM)              |
|  +------------------------------------+ |
|  | + Stwo Prover                      | |
|  | + Poseidon Hash                    | |
|  | + Merkle Tree                      | |
|  | + ZK Circuit Execution            | |
|  +------------------------------------+ |
+------------------+-------------------+
                   |
                   v
+------------------------------------------+
|         Starknet Blockchain             |
|  +--------------+ +------------------+  |
|  | YieldRouter  | |  Privacy Pool    |  |
|  |   Contract   | |    Contract      |  |
|  +--------------+ +------------------+  |
+------------------------------------------+
```

---

## Features

### 1. Shield (Private Deposits)

```typescript
// Deposit BTC privately into the pool
const shield = async (amount: bigint, asset: Asset) => {
  // 1. Generate commitment using Poseidon
  const commitment = await prover.deriveCommitment({
    amount,
    assetId: asset.id,
    nullifierSecret: randomBytes(32),
    salt: randomBytes(32)
  });
  
  // 2. Generate ZK proof
  const proof = await prover.proveShield({ commitment, ... });
  
  // 3. Submit to pool contract
  await poolContract.shield(proof, commitment);
};
```

### 2. Anonymous Yield

```typescript
// Earn yield on shielded assets
const strategies = await getStrategiesWithLiveAPY();
// Returns: [{ name: 'Vesu BTC Lending', apy: 3.5% }, ...]
```

### 3. Anonymous Swaps

- Trade on Ekubo without exposing identity
- Amounts affect public state (necessary for DEX)
- **Your identity remains private**

### 4. Anonymous Staking

- Acquire liquid staking positions privately
- Swap to Stake in one flow
- No public address linked to staking position

### 5. Compliance

```
+------------------------------------------------------------------+
|                    Compliance Mechanism                          |
+------------------------------------------------------------------+
|                                                                  |
|  User Joins Pool + Register Encrypted Viewing Key              |
|                              |                                   |
|                              v                                   |
|  Regulator Request + Third Party Auditing Entity              |
|                              |                                   |
|                              v                                   |
|  Decrypt Specific Key + View User's Transaction History         |
|                              |                                   |
|                              v                                   |
|  Other Users' Privacy + UNCHANGED                               |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | Cairo 2.15.0, TypeScript 5.x |
| **Build** | Scarb 2.13.1, wasm-pack |
| **Blockchain** | Starknet.js 7.x |
| **Frontend** | Next.js 14 (App Router), React 18 |
| **Styling** | Tailwind CSS |
| **Storage** | IndexedDB (via idb) |
| **Crypto** | starknet-crypto, @noble/hashes, @noble/ciphers |
| **Proving** | Stwo (WASM) |

### Version Requirements

```
Cairo:            2.15.0
Scarb:            2.13.1
snforge:          0.51.1
Starknet.js:      7.x
starknet-react:   v5.x
OpenZeppelin:     0.20.0
Next.js:          14.x
Node:             20 LTS
Package Manager:  pnpm
```

---

## Getting Started

### Prerequisites

```bash
# Install Node.js 20
nvm install 20
nvm use 20

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Install pnpm
npm install -g pnpm
```

### Installation

```bash
# Clone the repository
git clone https://github.com/Galmanus/phantom.git
cd phantom

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your RPC URL
# Get a free Alchemy key: https://alchemy.com
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/v2/YOUR_KEY

# Token Addresses (get from Starknet)
NEXT_PUBLIC_STRKBTC_ADDRESS=0x...
NEXT_PUBLIC_STRK20_POOL_ADDRESS=0x...
NEXT_PUBLIC_YIELD_ROUTER_ADDRESS=0x...

# Optional
NEXT_PUBLIC_AVNU_API_URL=https://starknet.api.avnu.fi
NEXT_PUBLIC_VESU_SINGLETON_ADDRESS=0x...
```

### Running Development Server

```bash
# Start the frontend
pnpm dev

# Open http://localhost:3000
```

### Running Tests

```bash
# Rust circuit tests
cd circuits && cargo test

# TypeScript SDK tests
cd sdk && pnpm test

# Run all tests
pnpm test
```

### Building WASM Prover

```bash
# Build the ZK prover (requires Rust + wasm-pack)
bash scripts/build_wasm.sh

# Output: public/phantom_prover.js, public/phantom_prover_bg.wasm
```

---

## Project Structure

```
phantom/
+--- app/                          # Next.js 14 App Router
|   +--- compliance/              # Compliance page
|   |   +--- page.tsx
|   +--- developers/              # Developer documentation
|   +--- shield/                  # Shield page
|   +--- swap/                    # Swap page
|   +--- yield/                   # Yield page
|   +--- providers/               # React providers
|   |   +--- PhantomProvider.tsx
|   |   +--- StarknetProvider.tsx
|   +--- globals.css              # Tailwind styles
|
+--- circuits/                    # Cairo ZK circuits
|   +--- src/
|   |   +--- crypto/             # Cryptographic primitives
|   |   |   +--- poseidon.rs     # Poseidon hash
|   |   |   +--- merkle.rs       # Merkle tree
|   |   |   +--- nullifier.rs    # Nullifier derivation
|   |   +--- private_yield/      # Yield circuit
|   |   +--- private_swap/       # Swap circuit
|   |   +--- compliance/          # Compliance circuit
|   +--- tests/                   # Circuit tests
|
+--- contracts/                   # Cairo smart contracts
|   +--- yield_router/           # Yield routing contract
|   +--- compliance_oracle/       # Compliance oracle
|   +--- intent_matcher/         # Intent matching
|
+--- sdk/                        # PHANTOM SDK (TypeScript)
|   +--- src/
|   |   +--- key-derivation.ts   # PBKDF2 + AES-GCM
|   |   +--- PhantomSDK.ts        # Main SDK
|   |   +--- storage/            # IndexedDB storage
|   |   +--- proof/              # Prover worker client
|   |   +--- integrations/        # DeFi protocol integrations
|   |   +--- strategies/         # Yield strategies
|   +--- tests/                  # SDK tests
|
+--- hooks/                      # React hooks
|   +--- useStrkBTC.ts          # strkBTC balance hook
|   +--- useWalletSync.ts       # Wallet sync hook
|   +--- usePhantomTransaction.ts # Transaction hooks
|
+--- lib/                        # Utilities
|   +--- constants.ts            # Contract addresses
|   +--- phantom-signing.ts     # Signing utilities
|   +--- wallet-errors.ts       # Error handling
|
+--- store/                      # State management
|   +--- walletStore.ts          # Wallet state
|
+--- public/
|   +--- workers/
|   |   +--- prover.worker.ts    # WASM prover worker
|   +--- phantom_prover.js       # Generated WASM bindings
|   +--- phantom_prover_bg.wasm  # Compiled WASM
|
+--- wasm/                       # WASM crate
|   +--- src/
|       +--- lib.rs            # WASM entry point
|
+--- scripts/
|   +--- build_wasm.sh          # WASM build script
|
+--- Configuration Files
    +--- package.json
    +--- tsconfig.json
    +--- tailwind.config.js
    +--- next.config.mjs
    +--- Scarb.toml
    +--- Cargo.toml
```

---

## Security Model

### Threat Model

PHANTOM assumes an **honest prover** model:

```
+------------------------------------------------------------------+
|                     Security Assumptions                          |
+------------------------------------------------------------------+
|                                                                  |
|  1. User generates valid ZK proofs locally                     |
|                                                                  |
|  2. Prover runs in Web Worker (off main thread)               |
|                                                                  |
|  3. All proofs verified on-chain before state changes         |
|                                                                  |
|  4. Viewing keys encrypted with user's IVK                     |
|                                                                  |
|  5. No secret keys stored in localStorage                     |
|                                                                  |
+------------------------------------------------------------------+
```

### Key Security Properties

| Property | Implementation |
|----------|---------------|
| **Balance Privacy** | Notes encrypted with AES-GCM-256 |
| **Transaction Privacy** | ZK proofs hide sender, recipient, amount |
| **Key Derivation** | PBKDF2 with 600,000 iterations |
| **Storage** | IndexedDB (not localStorage) |
| **Proving** | WASM runs in Web Worker |

### Known Limitations

- **Starknet 0.14.2 Required** — On-chain proof verification needs native syscall
- **Client-side Proving** — Currently prover runs client-side
- **Viewing Key Security** — Depends on user's key management

---

## Compliance

PHANTOM is designed to work with regulatory requirements:

### Encrypted Viewing Keys

```typescript
// Generate scoped viewing key
const viewingKey = await generateViewingKey({
  scope: 'full',           // 'full' | 'range' | 'existence'
  recipientLabel: 'Chainalysis',
  includeYield: true,
  expiresAt: Date.now() + 86400000 // 24 hours
});
// Output: phantom_vk_full_exp1234567890_abc123...
```

### How Compliance Works

1. **User registers** an encrypted viewing key when joining the pool
2. **Regulator requests** information through legal channels
3. **Auditing entity** decrypts the specific viewing key
4. **Only that user's data** is revealed — others remain private

This is **not a backdoor** — it's a carefully scoped access mechanism that preserves privacy while satisfying legal requirements.

---

## Roadmap

### Phase 1: Foundation (Complete)
- [x] Real Poseidon hash implementation
- [x] Merkle tree with proofs
- [x] Key derivation (PBKDF2)
- [x] Note encryption (AES-GCM)
- [x] WASM prover
- [x] Basic SDK

### Phase 2: Core Protocol (In Progress)
- [ ] Deploy contracts to Sepolia
- [ ] strkBTC integration
- [ ] Shield/Unshield flows
- [ ] Privacy pool contract

### Phase 3: Yield Features (Planned)
- [ ] Yield router integration
- [ ] Vesu lending integration
- [ ] Anonymous swaps (Ekubo)
- [ ] Anonymous staking

### Phase 4: Production (Planned)
- [ ] Mainnet deployment
- [ ] Security audit
- [ ] Bug bounty program
- [ ] Formal verification

---

## Contributing

We welcome contributions! Please see our Contributing Guide.

### Development Workflow

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/my-feature

# 3. Make changes
# 4. Run tests
pnpm test

# 5. Commit with conventional commits
git commit -m "feat: add new feature"

# 6. Push and create PR
git push origin feature/my-feature
```

### Code Style

- **Cairo**: Follow Starknet conventions
- **TypeScript**: Strict mode, ESLint + Prettier
- **Rust**: Follow rustfmt conventions

---

## License

MIT License — see LICENSE for details.

---

## Links

| Resource | URL |
|----------|-----|
| Website | [phantom.money](https://phantom.money) |
| Starknet | https://starknet.io |
| Documentation | [docs.phantom.money](https://docs.phantom.money) |
| Discord | [Join Discord](https://discord.gg/phantom) |
| Twitter | [@galmanus](https://twitter.com/galmanus) |
| GitHub | [Galmanus/phantom](https://github.com/Galmanus/phantom) |

---

<p align="center">
  <strong>PHANTOM — The First Private BTC Yield Manager on Starknet</strong><br>
  <em>Privacy by default. Compliant by design.</em>
</p>

---

*Built on Starknet | Cairo 2.15.0 | Next.js 14*
