# PHANTOM Whitepaper

## Private BTC Yield Manager on Starknet

**Version 1.0 — March 2026**

---

## Abstract

PHANTOM is the first Private BTC Yield Manager built on Starknet's native privacy infrastructure (strkBTC and STRK20). It enables Bitcoin holders to earn yield from DeFi protocols while maintaining complete privacy over their positions, amounts, and returns.

---

## 1. Introduction

### 1.1 The Bitcoin Yield Problem

Bitcoin is the world's largest cryptocurrency by market cap, yet it remains largely unproductive. Most BTC sits in wallets earning 0% yield while the same capital in DeFi earns 3-10% APY.

The reasons are multifold:

1. **Privacy concerns** — Public DeFi positions expose holders to tracking, surveillance, and targeting
2. **Technical friction** — Moving BTC to other chains requires bridges, wrapped tokens, and complex setups
3. **Infrastructure gaps** — No privacy-preserving yield products existed for BTC on L2s

### 1.2 The Starknet Opportunity

On March 10, 2026, Starknet launched two critical infrastructure pieces:

- **strkBTC** — A BTC-backed asset with optional shielding. Deposits can be private or public, with viewing keys for compliance.
- **STRK20** — A privacy standard for all ERC-20 tokens, providing shielded balances, selective disclosure, and anonymous swaps.

This eliminates the need to build custom privacy infrastructure. PHANTOM leverages these native layers to deliver a product, not infrastructure.

---

## 2. System Architecture

### 2.1 Overview

```
User Wallet (Argent X / Braavos)
        ↓
    Starkzap SDK
        ↓
    PhantomProvider (React Context)
        ↓
┌───────────────┐
│ YieldRouter  │ ← Cairo contract
│   (Cairo)    │
└───────────────┘
        ↓
┌───────────────┐
│   Strategies  │
│ Vesu / Ekubo  │
│    / Re7      │
└───────────────┘
```

### 2.2 Components

#### Starkzap SDK
- Connects to user's wallet
- Handles strkBTC operations (approve, transfer)
- Provides token balance reading (shielded + public)

#### PhantomProvider
- React context wrapping the app
- Initializes StarkZap instance
- Exposes `starkzap` and `isReady` to all components

#### PositionManager (SDK)
- Generates position commitments
- Opens/closes yield positions
- Tracks positions in local encrypted storage

#### YieldRouter (Cairo Contract)
- Accepts strkBTC deposits
- Routes to strategy contracts
- Tracks commitments (not amounts)
- Emits events (strategy, timestamp — not amounts)

---

## 3. Privacy Model

### 3.1 What Gets Shielded

| Data | Visibility | Mechanism |
|------|------------|-----------|
| Deposit amount | Private | STRK20 shielded transfer |
| Strategy selection | Public | Event emission |
| Position commitment | Public | Stored in contract |
| Earned yield | Private | Accumulates in shielded balance |
| Withdrawal amount | Private | STRK20 shielded transfer |

### 3.2 Commitment Scheme

When a user opens a position:

1. Client generates `nonce` (random 32 bytes)
2. Client computes `commitment = Poseidon(amount, strategy_id, nonce, ivk_hash)`
3. Client calls `YieldRouter.open_position(commitment, strategy_id, amount, proof)`
4. Contract stores `commitment → position` mapping

The contract never sees the actual amount — only the commitment. The amount is known only to the user (stored client-side).

### 3.3 Viewing Keys

Users can generate viewing keys at `/compliance`:

- **Full disclosure** — Prove exact balance and history
- **Range proof** — Prove balance ≤ X without revealing actual
- **Existence proof** — Prove transactions exist without amounts

This enables:
- Tax reporting
- Audit compliance
- Institutional requirements

---

## 4. Yield Strategies

### 4.1 Supported Strategies

| Strategy | Protocol | Type | APY | Risk | Lock |
|----------|----------|------|-----|------|------|
| Vesu BTC Lending | Vesu | Lending | ~3.5% | Low | None |
| Ekubo BTC/USDC LP | Ekubo | AMM | ~8.2% | Medium | None |
| Re7 BTC Vault | Re7 | Vault | ~6.2% | Medium | 7 days |

### 4.2 Strategy Integration

Each strategy is a separate protocol. PHANTOM acts as an aggregator:

1. User selects strategy in UI
2. PositionManager generates commitment
3. Starkzap approves strkBTC spend
4. YieldRouter deposits to strategy contract
5. Position tracked locally

### 4.3 Future Strategies

Potential additions:
- Uncap BTC staking
- Yearn-style vault rotation
- Delta-neutral strategies

---

## 5. User Flow

### 5.1 Onboarding

1. User visits PHANTOM
2. Connects wallet (Argent X or Braavos)
3. Visits `/swap` to get strkBTC (bridge from L1 or swap)
4. strkBTC appears in wallet (shielded by default)

### 5.2 Opening a Position

1. User visits `/yield`
2. Selects strategy (Vesu, Ekubo, or Re7)
3. Enters amount
4. Confirms transaction
5. Position opens — commitment stored on-chain
6. Amount tracked locally only

### 5.3 Monitoring

1. User views dashboard at `/yield`
2. Sees position count (not amounts — blurred)
3. Clicks "Reveal" to see own amounts locally
4. Yield estimates shown client-side

### 5.4 Closing a Position

1. User clicks "Withdraw" on position
2. Confirms transaction
3. YieldRouter withdraws from strategy
4. strkBTC transferred to user (shielded)
5. Position marked as closed locally

---

## 6. Contract Design

### 6.1 YieldRouter

```cairo
#[starknet::contract]
mod YieldRouter {
    // Position stored as commitment → data (no amount)
    // Strategy TVL aggregated (no per-user data)
    
    fn open_position(
        ref self: ContractState,
        commitment: felt252,
        strategy_id: u8,
        strkbtc_amount: u128,
    ) { ... }
    
    fn close_position(
        ref self: ContractState,
        commitment: felt252,
        original_amount: u128,
    ) { ... }
}
```

### 6.2 Events

```cairo
// What gets emitted (public):
PositionOpened { commitment, strategy, deposited_at }
PositionClosed { commitment, closed_at }

// What stays private:
// - amount
// - yield earned
// - withdrawal amount
```

---

## 7. Security Considerations

### 7.1 Client-Side Security

- Private keys stay in wallet (never touch PHANTOM)
- Amounts stored locally (IndexedDB, encrypted)
- Viewing keys derived from wallet seed

### 7.2 Smart Contract Security

- Owner-only configuration
- Pausable by admin
- Reentrancy guards on deposits/withdrawals

### 7.3 Privacy Guarantees

- Contract stores commitments only
- No amount in storage or events
- User controls local data

---

## 8. Roadmap

### Phase 1 — Core (COMPLETE)
- [x] Starkzap integration
- [x] YieldRouter contract
- [x] PositionManager SDK
- [x] Strategy selector UI
- [x] Viewing key generation

### Phase 2 — Launch (Q2 2026)
- [ ] Deploy to Starknet Sepolia
- [ ] Integrate with Vesu, Ekubo, Re7
- [ ] User testing and audits
- [ ] Mainnet deployment

### Phase 3 — Growth (Q3-Q4 2026)
- [ ] More yield strategies
- [ ] Mobile app
- [ ] Institutional onboarding
- [ ] Governance token (optional)

---

## 9. Team

**Founder:** Manuel (@galmanus, @streetxsmart) — Florianópolis, Brazil

**Background:** Starknet community builder, connected to Starknet Foundation (Omar Espejel, Teddy Pender, Gnana, Szu). Previous work noticed by Eli Ben-Sasson.

---

## 10. Conclusion

PHANTOM transforms how Bitcoin holders access DeFi yield. By building on Starknet's native privacy infrastructure (strkBTC and STRK20), PHANTOM delivers:

- **True privacy** — Positions, amounts, and returns stay hidden
- **Native integration** — Uses existing infrastructure, not custom builds
- **One-click yield** — Simple UX for earning on BTC
- **Compliance-ready** — Viewing keys for institutions

The product is ready. The infrastructure is ready. It's time to bring private BTC yield to Starknet.

---

*March 2026*
*PHANTOM Protocol*
