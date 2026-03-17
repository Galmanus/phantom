# MIDAS Execution Flow

## Overview
This document describes the complete execution flow of the MIDAS protocol, from user interaction to blockchain settlement.

---

## 1. User Entry: Shield (Deposit)

### Step 1.1: User initiates deposit
```
User Wallet (Argent/Braavos)
    |
    v
Frontend: /shield page
    |
    v
User selects: Asset (WBTC/tBTC/LBTC) + Amount
```

### Step 1.2: Key Derivation (off-chain)
```
MidasSDK.keyManager.fromWallet(account)
    |
    v
1. Sign SNIP-12 typed data (deterministic)
2. PBKDF2(HMAC-SHA512, signature, "MIDAS_IVK", 600k) → IVK
3. PBKDF2(HMAC-SHA512, signature, "MIDAS_SK", 600k) → SpendingKey
```

### Step 1.3: Commitment Generation (off-chain)
```
commitment = Poseidon(amount, assetId, nullifierSecret, salt)
    |
    v
nullifier = Poseidon(nullifierSecret, serialNumber)
    |
    v
Encrypted note = AES-GCM(IVK, {amount, nullifierSecret, salt})
```

### Step 1.4: ZK Proof Generation (WASM)
```
ShieldCircuit inputs:
- commitment (public)
- amount (public)
- assetId (public)
- nullifierSecret (witness)
- salt (witness)
    |
    v
Proof = prover.proveShield(circuit, inputs)
```

### Step 1.5: On-Chain Submission
```
User Wallet
    |
    v
pool.shield(
  asset: ContractAddress,
  amount: u256,
  commitment: felt252,
  encryptedNote: felt252,
  proof: Array<felt252>
)
    |
    v
MidasPool Contract:
  1. Verify proof (or skip in test mode)
  2. TransferFrom(user, pool, amount)
  3. Insert commitment in Merkle tree
  4. Emit Shielded event
  5. Update current Merkle root
```

### Step 1.6: Note Storage
```
Frontend stores in IndexedDB:
- commitment
- nullifierSecret
- salt
- amount
- leafIndex
- encryptedNote
```

---

## 2. Yield Generation

### Step 2.1: Deposit to Yield Protocol
```
MidasPool (has funds)
    |
    v
YieldRouter.deposit_shielded_yield(
  note_commitment,
  strategy_id (0=Vesu, 1=Uncap, 2=Opus),
  amount
)
    |
    v
Yield Protocol (external):
  - Vesu: deposit to lending pool
  - Uncap: deposit to yield vault
  - Opus: deposit to strategy
    |
    v
Returns: position_id, accumulated_yield
```

### Step 2.2: Yield Tracking (off-chain)
```
User monitors via:
- Chain scanner reads pool events
- Calculates yield from protocol APY
- Updates local note balance
```

### Step 2.3: Claim Yield
```
User
    |
    v
yieldRouter.claim_yield(
  position_commitment,
  proof (ZK proof of yield entitlement)
)
    |
    v
Yield Protocol transfers rewards to pool
    |
    v
Pool updates user's note (increase amount)
```

---

## 3. Private Liquid Staking

### Step 3.1: Shielded Stake Deposit
```
User Wallet
    |
    v
/staking page
    |
    v
Generate staking commitment:
  staking_commitment = Poseidon(
    amount,
    validatorSecret,
    salt
  )
    |
    v
ZK Proof: prove valid stake commitment
    |
    v
ShieldedStaking.stake(
  commitment,
  proof,
  encryptedNote
)
    |
    v
Contract:
  1. Verify proof
  2. Accept deposit (asset transfer)
  3. Register shielded position
  4. Mint liquid token (mSTK)
```

### Step 3.2: Validator Rewards
```
Starknet consensus → generates rewards
    |
    v
ShieldedStaking.distribute_rewards(
  total_rewards,
  proof (ZK proof of correct distribution)
)
    |
    v
Each user's shielded balance increases
(no on-chain reveal of amounts)
```

### Step 3.3: Claim Rewards
```
User
    |
    v
claim_yield(
  position_commitment,
  proof
)
    |
    v
Contract verifies ZK proof
    |
    v
Transfer rewards to pool
    |
    v
Protocol fee: 10% (to treasury)
    |
    v
User receives: 90% of rewards
```

### Step 3.4: Unstaking (Exit)
```
User
    |
    v
initiate_unstake(position_commitment)
    |
    v
Contract:
  1. Mark position as unstaking
  2. Start 7-day unbonding period
  3. Emit UnstakingInitiated event
    |
    v
After 7 days:
  |
  v
complete_unstake(
  position_commitment,
  proof
)
    |
    v
Contract:
  1. Verify proof
  2. Burn liquid token (mSTK)
  3. Transfer principal to user
```

---

## 4. User Exit: Unshield (Withdraw)

### Step 4.1: User initiates withdrawal
```
User Wallet
    |
    v
Frontend: /unshield page
    |
    v
Select note(s) to spend
```

### Step 4.2: Merkle Proof Generation (off-chain)
```
Local Merkle tree
    |
    v
Generate proof path from leaf to root
    |
    v
proof = { siblings: [...], path: [...] }
```

### Step 4.3: Nullifier Computation
```
nullifier = Poseidon(nullifierSecret, serialNumber)
    |
    v
Check: is_nullifier_spent(nullifier) == false
```

### Step 4.4: ZK Proof Generation
```
UnshieldCircuit inputs:
- nullifier (public)
- merkle_root (public)
- amount (public, withdrawal)
- change_commitment (public, or 0)
- nullifierSecret (witness)
- salt (witness)
- merkle_proof (witness)
    |
    v
Proof = prover.proveUnshield(circuit, inputs)
```

### Step 4.5: On-Chain Submission
```
User Wallet
    |
    v
pool.unshield(
  nullifier,
  recipient,
  asset,
  amount,
  merkle_root,
  change_commitment,
  proof
)
    |
    v
MidasPool Contract:
  1. Verify merkle_root is known
  2. Verify proof
  3. Check nullifier not spent
  4. Mark nullifier as spent
  5. Transfer tokens to recipient
  6. (Optional) Create change note
  7. Emit Unshielded event
```

---

## 5. Private Transfer (Shielded → Shielded)

### Step 5.1: Sender prepares transfer
```
Sender selects note(s) to spend
    |
    v
Creates output note for recipient
    |
    v
Generates:
- input_nullifiers (for spent notes)
- output_commitments (for new notes)
- change_commitment (if needed)
```

### Step 5.2: ZK Proof
```
TransferCircuit proves:
- Input notes exist in Merkle tree
- Nullifiers correctly computed
- Output commitments valid
- Value conserved (input = output + change)
```

### Step 5.3: On-Chain
```
pool.private_transfer(
  input_nullifiers,
  output_commitments,
  change_commitment,
  proof
)
    |
    v
Contract:
  1. Verify all nullifiers unspent
  2. Mark input nullifiers as spent
  3. Insert output commitments
  4. Update Merkle root
```

### Step 5.4: Recipient Notification
```
Off-chain message (encrypted)
    |
    v
Recipient downloads commitment from chain
    |
    v
Verifies it's in Merkle tree
    |
    v
Can spend using nullifierSecret
```

---

## 6. Compliance: Selective Disclosure

### Step 6.1: User generates viewing key
```
MidasSDK.keyManager.deriveIVK()
    |
    v
IVK = Incoming Viewing Key (read-only)
    |
    v
User can share IVK with:
- Auditors
- Regulators
- Counterparties
```

### Step 6.2: Generate compliance proof
```
User (or auditor)
    |
    v
complianceOracle.verify_disclosure(
  ivk,
  scope: 'amount_only' | 'kyc_status' | 'sanctions_cleared' | 'full_audit',
  proof
)
    |
    v
ZK Circuit proves:
- User has valid note(s)
- Amount in range (for amount_only)
- KYC status valid (for kyc_status)
- etc.
    |
    v
Returns: Boolean + disclosed info
```

---

## Execution Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  Shield  │    │  Stake   │    │  Yield   │    │ Unshield │   │
│  │ (Deposit)│    │ (Staking)│    │ (Earn)   │    │ (Withdraw│   │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘   │
│       │               │               │               │          │
│       v               v               v               v          │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │                    MIDAS SDK                             │     │
│  │  • Key Derivation (PBKDF2)                              │     │
│  │  • Commitment Generation (Poseidon)                    │     │
│  │  • ZK Proof Generation (WASM Prover)                   │     │
│  │  • Note Storage (IndexedDB)                            │     │
│  └─────────────────────┬────────────────────────────────────┘     │
│                        │                                          │
└────────────────────────┼──────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────────┐
│                      ON-CHAIN ACTIONS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │                   Cairo Contracts                         │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │     │
│  │  │ MidasPool   │  │YieldRouter  │  │ShieldedStak │      │     │
│  │  │ (Privacy)   │  │ (DeFi)      │  │ (Staking)   │      │     │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │     │
│  │         │                │                │             │     │
│  │         v                v                v             │     │
│  │  ┌─────────────────────────────────────────────┐       │     │
│  │  │              Starknet Sequencer              │       │     │
│  │  │  • Verifies ZK proofs                        │       │     │
│  │  │  • Executes transactions                     │       │     │
│  │  │  • Updates state                            │       │     │
│  │  └─────────────────────────────────────────────┘       │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   Vesu   │  │  Uncap   │  │   Opus   │  │  Stark   │           │
│  │ (Lending)│  │ (Yield)  │  │ (Yield)  │  │ (Staking)│           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Security Properties

| Property | How It's Enforced |
|----------|-------------------|
| **Double-spend prevention** | Nullifier set in contract storage |
| **Privacy** | Commitments + ZK proofs hide amounts/addresses |
| **Integrity** | Merkle tree + proofs verify note existence |
| **Non-custodial** | User holds keys; contract never accesses them |
| **Compliance** | Optional viewing keys for selective disclosure |

---

## Test Mode (Current)

During testnet, the ZK proof verification is skipped:

```cairo
if self.test_mode.read() {
    return true; // Skip proof verification
}
// Real verification would happen here
```

This must be disabled before mainnet deployment.
