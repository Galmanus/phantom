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

#### Frontend (Next.js 14)
- [x] Pages: Shield, Yield, Swap, Compliance, Developers
- [x] Real AVNU integration in Swap page
- [x] Real PhantomKeyManager.fromWallet() in Compliance page
- [x] Removed all mocks (setTimeout, Math.random)
- [x] StarknetProvider configured
- [x] WalletConnector component
- [x] Design system (void, surface, panel, amber, zk-green, parchment)

#### SDK (TypeScript)
- [x] Key derivation with PBKDF2 (600k iterations)
- [x] AES-GCM-256 encryption for notes
- [x] IndexedDB via `idb` library
- [x] ProverWorkerClient for Web Worker
- [x] PhantomSDK with shield(), unshield(), privateSwap(), depositShieldedYield()
- [x] getAllNotes(), getUnspentNotes(), getActiveYieldPositions()
- [x] Backup/restore functionality

#### Hooks
- [x] usePhantomSDKReal - with getActiveYieldPositions, getUnspentNotes
- [x] usePhantomTransaction
- [x] useStrkBTC
- [x] useTokenBalances
- [x] useWalletSync

#### Contracts (Cairo 2.15.0)
- [x] yield_router with OpenZeppelin
- [x] Scarb.toml with registry dependencies
- [x] IERC20Dispatcher using OZ
- [x] compliance_oracle
- [x] intent_matcher

#### Circuits (Rust)
- [x] Real Poseidon hash using `starknet-crypto`
- [x] Merkle tree with inclusion proofs
- [x] Nullifier derivation
- [x] WASM prover build
- [x] Shield circuit
- [x] Unshield circuit
- [x] Private swap circuit
- [x] Private yield circuit
- [x] Compliance circuit

---

### ⚠️ PARTIALLY COMPLETE / NEEDS WORK

| Item | Status | Notes |
|------|--------|-------|
| **strkBTC token** | Not deployed | Waiting for mainnet |
| **Deploy Contracts** | Not done | Need addresses in .env |
| **Shield functionality** | UI stub | Page explains "automatic" but no real shield flow |
| **Unshield functionality** | Not implemented | No UI page |
| **Yield deposit flow** | Incomplete | Shield works but yield routing is PLACEHOLDER |
| **Compliance proofs** | PLACEHOLDER | Shows IVK, real proofs need Starknet 0.14.2 |
| **TypeScript errors** | ✅ Fixed | Missing FieldElement export, missing await, wrong YieldPosition fields — all resolved |
| **Tests** | ✅ Fixed | NoteStore.test.ts method names corrected, assertion logic fixed |
| **NEON Compliance** | ✅ Integrated | MidasPool contract + circuits now support NEON compliance gate |
| **Staking page** | Coming Soon | Added wallet gate and "Coming Soon" badge |
| **Yield page** | ✅ Fixed | Hard-coded asset replaced with dynamic selection |

---

### 🔴 Missing / Not Working

1. **Environment Variables** - Need real contract addresses:
   - `NEXT_PUBLIC_STRKBTC_ADDRESS`
   - `NEXT_PUBLIC_PHANTOM_POOL_ADDRESS`
   - `NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS`
   - `NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS`
   - `NEXT_PUBLIC_INTENT_MATCHER_ADDRESS`
   - `NEXT_PUBLIC_PHANTOM_MERKLE_ADDRESS`
   - Token addresses (WBTC, TBTC, LBTC, SOLVBTC)
   - `NEXT_PUBLIC_AVNU_ROUTER_ADDRESS`

2. **Shield Page** - Currently just a marketing page explaining "automatic shielding" - no actual shield functionality

3. **Unshield** - No UI page at all

4. **Starknet 0.14.2 Dependency** - Multiple PLACEHOLDER comments:
   - `// PLACEHOLDER: Waiting for Starknet 0.14.2 native Stwo syscall`
   - `// PLACEHOLDER: PhantomVerifier.cairo accepts empty proof in test mode`

5. **WASM Prover** - Built but may not work correctly in production

6. **SDK Type Issues**:
   - `PhantomSDKConfig.account` type is `any` instead of `AccountInterface`
   - `IDBKeyRange` import issue in NoteStore.ts

---

## Brutal Truth

### What's Actually Working:
1. **Swap page** - Real AVNU integration, works if env vars set
2. **Compliance page** - Can derive IVK from wallet signature
3. **Yield page** - Can shield funds (but can't route to yield protocols)
4. **Developers page** - Documentation exists
5. **SDK storage** - Notes encrypted in IndexedDB
6. **Key derivation** - PBKDF2-600k works

### What's NOT Working:
1. **No way to unshield** - No UI, no function
2. **Shield page is fake** - Just explains the concept
3. **Yield routing is fake** - PLACEHOLDER comment, no actual contract calls
4. **No real contract addresses** - Everything points to empty env vars
5. **Compliance proofs are fake** - Just shows IVK as JSON

### Next Steps to Actually Ship:
1. Deploy contracts to Sepolia
2. Fill in .env.local with real addresses
3. Implement unshield UI and function
4. Connect yield deposit to yield_router contract
5. Fix TypeScript errors
6. Test end-to-end flow

---

## Tech Stack (as of March 2026)

- **Cairo**: 2.15.0
- **Scarb**: 2.13.1
- **Starknet.js**: 8.9.2 (NOT 7.x as previously stated)
- **Next.js**: 14 (App Router)
- **TypeScript**: 5.x
- **WASM**: wasm-pack
- **Stwo**: 2.1.0

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

## Environment Variables Required

```env
# RPC
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_RPC_URL=https://free-rpc.nethermind.io/sepolia-juno

# PHANTOM Contracts
NEXT_PUBLIC_PHANTOM_POOL_ADDRESS=0x...
NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS=0x...
NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_INTENT_MATCHER_ADDRESS=0x...
NEXT_PUBLIC_PHANTOM_MERKLE_ADDRESS=0x...

# Tokens
NEXT_PUBLIC_STRKBTC_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_WBTC=0x...
NEXT_PUBLIC_TOKEN_TBTC=0x...
NEXT_PUBLIC_TOKEN_LBTC=0x...
NEXT_PUBLIC_TOKEN_SOLVBTC=0x...

# Integrations
NEXT_PUBLIC_AVNU_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_WASM_PATH=/phantom_prover_bg.wasm
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

**CURRENT STATUS**: IVK derivation works. Real ZK compliance proofs require Starknet 0.14.2.

---

*PHANTOM — The First Private BTC Yield Manager on Starknet*
*Stack: strkBTC + STRK20 + Stwo + Cairo 2.15.0 + Next.js 14*
*Developer: Manuel (@galmanus) — Florianópolis, Brazil — March 2026*
*Last Updated: March 2026*
