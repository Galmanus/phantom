# PHANTOM — Private BTC Yield Manager

![PHANTOM Logo](phantom-zk.jpeg)

**Earn yield on your Bitcoin. Keep it private.**

PHANTOM is the first Private BTC Yield Manager on Starknet. Built on strkBTC and STRK20, PHANTOM lets you earn yield from leading DeFi protocols while keeping your position, amount, and returns completely private.

---

## The Problem

Bitcoin holders want to earn yield on their assets, but:

1. **Public positions expose you** — Every DeFi interaction is visible on-chain. Your positions, strategies, and returns are public knowledge.
2. **Institutional requirements** — Institutions need privacy for compliance, but existing solutions force a choice between yield and privacy.
3. **Fragmented experience** — Getting private BTC, moving it to DeFi, and managing yield requires multiple protocols and complex workflows.

---

## The Solution

PHANTOM combines strkBTC's privacy with integrated yield strategies:

- **Private by default** — Your deposits, positions, and returns are shielded. Only you can see your balance.
- **Built on native infrastructure** — Uses Starknet's strkBTC and STRK20, not custom privacy infrastructure.
- **One-click yield** — Select a strategy, deposit, and start earning. No complex setup.
- **Compliance-ready** — Generate viewing keys to prove holdings to auditors without revealing everything.

---

## How It Works

### 1. Get strkBTC

Convert wBTC, tBTC, LBTC, or SolvBTC to strkBTC through the `/swap` page. strkBTC is Starknet's native private Bitcoin with built-in shielding.

### 2. Select a Yield Strategy

Choose from integrated strategies:

| Strategy | Protocol | Type | APY | Lock Period |
|----------|----------|------|-----|-------------|
| Vesu BTC Lending | Vesu | Lending | ~3.5% | None |
| Ekubo BTC/USDC LP | Ekubo | LP | ~8.2% | None |
| Re7 BTC Vault | Re7 | Vault | ~6.2% | 7 days |

### 3. Deposit and Earn

Your BTC is deposited into the strategy. Your position commitment is stored on-chain, but the amount stays private. Yield accumulates in your shielded balance.

### 4. Withdraw Anytime

Close your position to withdraw your original deposit plus earned yield. No one can see how much you earned.

---

## Privacy Architecture

### Shielded Balances

All PHANTOM positions use STRK20's privacy layer:
- **Commitments** — Position existence is public, but amount is not
- **Nullifiers** — Prevents double-spending without revealing amounts
- **Viewing Keys** — Optional disclosure for compliance

### Viewing Keys

Generate a viewing key at `/compliance` to:
- Prove your exact balance to auditors
- Generate range proofs (prove amount ≤ X without revealing actual)
- Show transaction history without exposing balances

### What's Public vs Private

| Data | Visibility |
|------|------------|
| Position exists | Public (commitment) |
| Strategy used | Public |
| Deposit amount | Private |
| Earned yield | Private |
| Withdrawal amount | Private |

---

## Technology Stack

- **strkBTC** — Bitcoin-backed asset with optional shielding
- **STRK20** — Starknet's native privacy standard for ERC-20
- **Starkzap SDK** — Wallet integration and token operations
- **Next.js 14** — Frontend framework
- **Starknet React** — Wallet connection (Argent X, Braavos)
- **Cairo** — Smart contracts

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

### Environment Variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
NEXT_PUBLIC_STRKBTC_ADDRESS=
NEXT_PUBLIC_YIELD_ROUTER_ADDRESS=
NEXT_PUBLIC_VESU_POOL_ADDRESS=
NEXT_PUBLIC_EKUBO_POOL_ADDRESS=
NEXT_PUBLIC_RE7_VAULT_ADDRESS=
```

---

## Project Structure

```
phantom/
├── app/                    # Next.js pages
│   ├── page.tsx            # Landing page
│   ├── yield/              # Yield strategy selector
│   ├── swap/               # Get strkBTC (onboarding)
│   ├── shield/             # Shielding info
│   ├── compliance/         # Viewing key generator
│   └── developers/         # API documentation
├── components/             # React components
├── hooks/                  # Custom hooks
│   └── useStrkBTC.ts       # strkBTC balance
├── sdk/                    # SDK
│   └── src/
│       ├── strategies/     # Yield strategies
│       └── PositionManager.ts
├── contracts/              # Cairo contracts
│   └── yield_router/       # Yield routing
└── circuits/               # Legacy ZK (STRK20 handles now)
```

---

## Development Commands

```bash
# Build frontend
npm run build

# Build SDK
npm run sdk:build

# Test SDK
npm run sdk:test

# Deploy to Sepolia
./scripts/deploy_sepolia.sh
```

---

## Roadmap

- [x] Integrate Starkzap SDK
- [x] Create yield strategies (Vesu, Ekubo, Re7)
- [x] Build PositionManager SDK
- [x] Deploy YieldRouter to Sepolia
- [ ] Launch on Starknet mainnet
- [ ] Add more yield strategies
- [ ] Implement governance

---

## Links

- **Website:** https://phantom.btc
- **Twitter:** @phantom_btc
- **GitHub:** github.com/Galmanus/phantom

---

*Built by @galmanus in Florianópolis, Brazil*
*March 2026*
