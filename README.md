# PHANTOM — ZK Private Execution Layer for BTCFi on Starknet

![PHANTOM Logo](phantom-zk.jpeg)

**The first zero-knowledge private execution layer purpose-built for Bitcoin assets on Starknet.**

---

## Executive Summary

PHANTOM is a privacy protocol that enables shielded (private) transactions for BTC-backed assets on Starknet. Using zero-knowledge proofs (ZKP), PHANTOM conceals transaction amounts, asset types, and participant identities while maintaining full on-chain verifiability.

**Core Innovation:** PHANTOM implements a UTXO-style shielded pool on top of Starknet's account abstraction model, enabling Bitcoin-native privacy properties in an EVM-compatible environment.

---

## Problem Statement

### The Privacy Crisis in BTCFi

Every BTC position in Starknet's BTCFi ecosystem is fully transparent:

- **Vesu deposits**: All lending positions visible
- **AVNU swaps**: Trade amounts and strategies exposed  
- **Uncap positions**: Yield strategies public
- **Ekubo liquidity**: LP positions traceable

This creates several problems:

1. **MEV Extraction**: Bots front-run large trades
2. **Strategy Theft**: Competitors copy successful strategies
3. **Regulatory Risk**: Full transaction history creates compliance burden
4. **Privacy Loss**: Financial privacy is fundamentally broken

---

## Solution: PHANTOM Protocol

PHANTOM provides five core privacy primitives:

### 1. Shield Pool
Deposit wBTC, tBTC, LBTC, or SolvBTC into a shielded pool. Only a cryptographic commitment (Pedersen hash) appears on-chain. The actual amount and recipient are known only to the depositor.

```
User → Deposit wBTC → { commitment = Poseidon(amount, asset, secret, salt) } → On-chain
```

### 2. Private Swap
Swap between shielded assets without revealing:
- Input asset and amount
- Output asset and amount
- Route taken

Integration with AVNU for best execution, with privacy preserved throughout.

### 3. Shielded Yield
Deposit shielded BTC into yield protocols (Vesu, Uncap, Opus) while maintaining privacy. The yield position itself is shielded.

### 4. Intent Dark Pool
Submit encrypted trade intents. The matching engine pairs complementary intents atomically. No front-running possible—intents are never visible until matched.

### 5. Selective Disclosure
Generate auditor-specific ZK proofs that disclose exactly what regulators need:
- **KYC Status Only**: Proves user is verified without revealing identity
- **Amount Below Threshold**: Proves transaction < $10K without exact amount
- **Sanctions Cleared**: Proves no sanctioned entity involvement
- **Full Audit**: Complete transaction proof for regulated entities

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Frontend (Next.js 14)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Shield  │  │ Unshield │  │   Swap   │  │  Yield   │  │Compliance│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TypeScript SDK (@phantom-btc/sdk)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PhantomKey   │  │  NoteStore   │  │ProverWorker  │  │ Integrations │  │
│  │ Manager      │  │  (IndexedDB) │  │   (WASM)     │  │(AVNU,Vesu)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    ChainScanner (Event Recovery)                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Starknet Smart Contracts                               │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │  PhantomPool   │  │ PhantomMerkle  │  │   Verifier     │                 │
│  │   (Core)      │  │   (Tree)       │  │   (Stwo AIR)  │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐                                    │
│  │ Compliance     │  │    Intent      │                                    │
│  │    Oracle     │  │    Matcher     │                                    │
│  └────────────────┘  └────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ZK Circuits (Rust + Stwo AIR)                           │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Shield  │  │ Unshield │  │  Swap    │  │  Yield   │  │Compliance│   │
│  │  ~4,300  │  │  ~5,000  │  │  ~7,500  │  │  ~6,000  │  │  ~8,000  │   │
│  │   const  │  │   const  │  │   const  │  │   const  │  │   const  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cryptographic Primitives

### Commitment Scheme: Poseidon2

PHANTOM uses Poseidon2 hash for all commitments:

```
commitment = Poseidon(amount, asset_id, nullifier_secret, salt)
nullifier = Poseidon(nullifier_secret, serial_number)
```

**Why Poseidon2?**
- Arithmetization-friendly (low constraint count)
- Starknet-native (same as Cairo's Poseidon)
- ZK-friendly (no XOR tables)

### Merkle Tree: Incremental Sparse Merkle

- **Depth**: 32 (supports 2^32 notes)
- **Hash**: Poseidon2
- **Update**: O(depth) = O(32), not O(n)

### Ring Buffer for State Contention

Problem: Two users prove against the same Merkle root simultaneously.

Solution: Store last 8 valid roots in a ring buffer:

```cairo
const N_ROOTS: u8 = 8;

fn is_valid_root(self: @ContractState, root: felt252) -> bool {
    let mut i: u8 = 0;
    loop {
        if i >= N_ROOTS { break false; }
        if self.merkle_roots.read(i) == root { break true; }
        i += 1;
    }
}
```

---

## Key Derivation: SNIP-12 + PBKDF2

PHANTOM derives viewing keys from wallet signatures:

```typescript
// SNIP-12 typed message signing
const SIGNING_MESSAGE = {
  domain: { name: 'PHANTOM', version: '1', chainId: 'SN_MAIN' },
  types: { ... },
  primaryType: 'PhantomKeyDerivation',
  message: {
    message: 'PHANTOM key derivation...',
    version: '1',
  },
};

// User signs → 600k PBKDF2 iterations → Master Key
// Master Key → HKDF → IVK (Incoming Viewing Key) + FVK (Full Viewing Key)
```

---

## ZK Circuit Specifications

### Shield Circuit (~4,300 constraints)

**Public Inputs:**
- `commitment` (felt252)
- `asset_id` (u8)

**Private Inputs:**
- `amount` (u64)
- `nullifier_secret` (felt252)
- `salt` (felt252)

**Constraints:**
1. `amount > 0` (non-zero)
2. `amount < 2^64` (range check)
3. `asset_id < 6` (supported assets)
4. `commitment = Poseidon(amount, asset_id, nullifier_secret, salt)`

### Unshield Circuit (~5,000 constraints)

**Public Inputs:**
- `nullifier_hash`
- `recipient`
- `amount`

**Private Inputs:**
- `note` (encrypted)
- `nullifier_secret`
- `merkle_path`

**Constraints:**
1. Merkle path validity (root → leaf)
2. Nullifier uniqueness (not spent)
3. Amount conservation

---

## Supported Assets

| Asset | ID | Standard |
|-------|-----|----------|
| wBTC  | 0  | ERC-20   |
| tBTC  | 1  | ERC-20   |
| LBTC  | 2  | ERC-20   |
| SolvBTC | 3 | ERC-20   |
| STRK  | 4  | ERC-20   |
| USDC  | 5  | ERC-20   |

---

## Security Model

### Privacy Guarantees

- **Sender Privacy**: Only commitment hash visible
- **Recipient Privacy**: Shielded address not linkable to identity
- **Amount Privacy**: Exact amounts hidden
- **History Privacy**: Past transactions unlinkable

### Threat Model

1. **Colluding Parties**: Even if all protocol participants collude, privacy holds
2. **Blockchain Observer**: Cannot determine transaction details from on-chain data
3. **Exchange**: Cannot link withdrawal to deposit without additional data

### Limitations

- **Quantum Threat**: Not quantum-resistant (future upgradeable)
- **Metadata**: Transaction timing and gas usage still visible
- **Social**: Re-entrancy attacks possible if users share viewing keys

---

## Deployment

### Testnet (Sepolia)
- Status: **In Development**
- Expected: Q2 2026

### Mainnet
- Status: **Pending Security Audit**
- Expected: Q4 2026 (after audit)

---

## Performance Targets

| Operation | Proving Time (1 core) | Verification |
|-----------|----------------------|---------------|
| Shield    | 80-150ms            | <10ms         |
| Unshield  | 100-180ms           | <10ms         |
| Swap      | 150-280ms           | <10ms         |
| Yield     | 120-220ms           | <10ms         |
| Compliance| 160-300ms           | <10ms         |

---

## Regulatory Compliance

PHANTOM includes **Selective Disclosure** as a first-class feature:

```
┌─────────────────────────────────────────────────────┐
│              Compliance Oracle                       │
├─────────────────────────────────────────────────────┤
│  Proof Types:                                       │
│  - KycStatusOnly    (proves KYC without ID)        │
│  - AmountBelowThreshold (proves <$10K)             │
│  - SanctionsCleared (proves no OFAC)               │
│  - FullAudit        (complete proof)                │
└─────────────────────────────────────────────────────┘
```

---

## Team

**Lead Developer:** Manuel (@galmanus)
- Solo researcher
- Previously: Neon Covenant (ZK age verification on Starknet Sepolia)
- Focus: Starknet, Cairo, Rust/ZK

---

## Get Started

```bash
# Clone
git clone https://github.com/galmanus/phantom.git
cd phantom

# Build circuits
cd circuits && cargo build

# Build WASM
cd wasm && wasm-pack build --target web --out-dir ../frontend/public/wasm

# Run frontend
cd frontend && npm run dev
```

---

## Links

- **Website**: https://phantom-btc.xyz
- **GitHub**: https://github.com/galmanus/phantom
- **Discord**: (coming soon)
- **Twitter**: @phantom_btc

---

## License

MIT License

Copyright (c) 2026 PHANTOM Team

---

*PHANTOM — Real cryptography. Real privacy. Real Bitcoin DeFi.*
