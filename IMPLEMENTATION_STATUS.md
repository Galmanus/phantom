# PHANTOM — Implementation Status

## Vision: Private DeFi on Starknet

PHANTOM is the first **Private BTC Yield Manager** on Starknet, built on **STRK20** and **strkBTC**.

### What is STRK20?
- Native Starknet ERC-20 with **privacy by default**
- Balances and transfers private using zero-knowledge proofs
- Single privacy pool for all ERC-20s

### Core Features
1. **Shield/Unshield** — Deposit and withdraw BTC privately
2. **Anonymous Swaps** — Trade on Ekubo without exposing identity
3. **Anonymous Staking** — Stake without exposing position
4. **Compliance** — Encrypted viewing key for regulators

---

## Current Implementation Status

### ✅ Completed

#### Circuits (Rust)
- [x] Real Poseidon hash using `starknet-crypto` (16 tests passing)
- [x] Merkle tree with inclusion proofs
- [x] Nullifier derivation
- [x] WASM prover build

#### SDK (TypeScript)
- [x] Key derivation with PBKDF2 (600k iterations)
- [x] AES-GCM-256 encryption for notes
- [x] IndexedDB via `idb` library
- [x] ProverWorkerClient for Web Worker

#### Frontend (Next.js 14)
- [x] Pages: Shield, Yield, Swap, Compliance
- [x] Hooks: useStrkBTC, useWalletSync
- [x] Removed all mocks (setTimeout, Math.random)
- [x] StarknetProvider configured with Alchemy RPC

#### Contracts (Cairo 2.15.0)
- [x] yield_router with OpenZeppelin
- [x] Scarb.toml with registry dependencies
- [x] IERC20Dispatcher using OZ

### ❌ Pending

| Item | Status | Action Required |
|------|--------|-----------------|
| **strkBTC token** | Pending | Await mainnet launch |
| **Deploy Contracts** | Pending | Deploy to Sepolia |
| **Wallet Connection** | Pending | Use Argent X |

---

## Tech Stack

- **Cairo**: 2.15.0
- **Scarb**: 2.13.1
- **Starknet.js**: 7.x
- **Next.js**: 14 (App Router)
- **TypeScript**: 5.x strict mode
- **WASM**: wasm-pack

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run circuit tests
cd circuits && cargo test

# Build WASM prover
bash scripts/build_wasm.sh
```

---

## Environment Variables

```env
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_STRKBTC_ADDRESS=0x...
NEXT_PUBLIC_STRK20_POOL_ADDRESS=0x...
NEXT_PUBLIC_YIELD_ROUTER_ADDRESS=0x...
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│  Shield Page  │  Yield Page  │  Swap Page  │  Compliance   │
└──────┬────────┴──────┬────────┴───────┬────────┴──────┬──────┘
       │               │                 │               │
       ▼               ▼                 ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PHANTOM SDK                              │
├─────────────────────────────────────────────────────────────┤
│  PhantomKeyManager  │  NoteStore  │  ProverWorkerClient    │
│  (PBKDF2 + AES)    │  (IndexedDB)│  (WASM)              │
└──────┬──────────────┴──────────────┴───────────┬──────────┘
       │                                          │
       ▼                                          ▼
┌──────────────────────┐         ┌──────────────────────────┐
│   Yield Router       │         │   Starknet Sequencer      │
│   (Cairo Contract)   │         │   (Verify Proof)         │
└──────────────────────┘         └──────────────────────────┘
```

---

## Compliance Architecture

PHANTOM implements **encrypted viewing keys** for compliance:

1. User generates viewing key when connecting wallet
2. Key is encrypted with HKDF(IVK, scope)
3. If regulator requests, authorized third party can decrypt
4. Only the specific user is affected — others maintain privacy

---

*PHANTOM — The First Private BTC Yield Manager on Starknet*
*Stack: strkBTC + STRK20 + Stwo + Cairo 2.15.0 + Next.js 14*
*Developer: Manuel (@galmanus) — Florianópolis, Brazil — March 2026*
