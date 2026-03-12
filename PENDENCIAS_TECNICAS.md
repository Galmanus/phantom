# PHANTOM Protocol - Pendências Técnicas para Bitcoin Real

## Visão Geral

Este documento lista todas as pendências técnicas para que o PHANTOM Protocol funcione com **Bitcoin real (mainnet)**.

---

## 🔴 CRÍTICO (Bloqueia tudo)

### 1. Contratos Cairo - Implementação Completa do Verifier

**Arquivo:** [`contracts/phantom_verifier/src/phantom_verifier.cairo`](contracts/phantom_verifier/src/phantom_verifier.cairo)

**Status:** Parcialmente implementado

**O que falta:**
- [ ] Implementar verificação REAL de Stwo STARK proofs
- [ ] Implementar CairoVerifier para proofs nativos (quando Starknet 0.14.2 sair)
- [ ] Integração com CairoVerifier (atualmente só tem stub)
- [ ] Testes de fuzzing para verificação de proof

```cairo
// FALTA: Implementação real
fn verify_shield_proof(proof: Span<felt252>, public_inputs: Span<felt252>) -> bool {
    // Currently just returns true - NEEDS REAL IMPLEMENTATION
    true
}
```

### 2. Circuitos ZK - Stwo AIR Prover

**Arquivo:** [`circuits/src/shield/circuit.rs`](circuits/src/shield/circuit.rs)

**Status:** Placeholder (usa crypto-based proofs, não Stwo real)

**O que falta:**
- [ ] Implementar Stwo AIR constraints reais (~4,300 para shield)
- [ ] Implementar `prove()` com Stwo prover API
- [ ] Implementar `verify()` com Stwo verifier
- [ ] Compilar para WASM com wasm-pack

```rust
// ATUAL (placeholder):
pub fn prove(&self) -> Result<ShieldProof, String> {
    // Only validates witness, doesn't generate real Stwo proof
    self.generate_witness()?;
    Ok(ShieldProof { ... })
}

// PRECISA SER:
pub fn prove(&self) -> Result<ShieldProof, String> {
    // Generate actual Stwo AIR proof
    let trace = self.generate_trace();
    let proof = stwo_prover::prove(&trace, &self.air);
    Ok(ShieldProof { stark_proof: proof })
}
```

### 3. WASM Prover Build

**Arquivo:** [`wasm/src/lib.rs`](wasm/src/lib.rs)

**Status:** Estrutura existe, precisa compilar

**O que falta:**
- [ ] Build `wasm-pack build --target web`
- [ ] Integrar WASM no SDK (`ProverWorkerClient`)
- [ ] Testar em browser real

---

## 🟠 ALTA PRIORIDADE

### 4. Ring Buffer de Merkle Roots - Implementação Completa

**Arquivo:** [`contracts/phantom_pool/src/phantom_pool.cairo`](contracts/phantom_pool/src/phantom_pool.cairo:49)

**Status:** Parcialmente implementado

**O que falta:**
- [ ] Implementar lógica de rotação de índices (`current_root_index`)
- [ ] Limpar roots antigos após 8新生儿
- [ ] Testar concorrência com múltiplas transações simultâneas

```cairo
// FALTA: Lógica de rotação
fn _store_historical_root(ref self: ContractState, root: felt252) {
    let idx = self.current_root_index.read();
    self.root_history.write(idx, root);
    self.root_block_numbers.write(idx, get_block_number());
    // Precisa incrementar e wraparound em 8
}
```

### 5. Key Derivation - Implementação Completa

**Arquivo:** [`sdk/src/key-derivation.ts`](sdk/src/key-derivation.ts)

**Status:** Stub existe

**O que falta:**
- [ ] Implementar `PhantomKeyManager.fromWallet()` com SNIP-12
- [ ] Implementar PBKDF2 com 600k iterações
- [ ] Derivar IVK (Incoming Viewing Key)
- [ ] Derivar FVK (Full Viewing Key)
- [ ] Derivar per-note spending keys com Poseidon

```typescript
// FALTA: Implementação real
static async fromWallet(account: Account): Promise<PhantomKeyManager> {
    // 1. Sign SNIP-12 message
    const signature = await account.signMessage(SIGNING_MESSAGE)
    // 2. PBKDF2 with 600k iterations
    const masterKey = await pbkdf2(signature, salt, 600_000, 32)
    // 3. Derive IVK/FVK
    return new PhantomKeyManager(masterKey)
}
```

### 6. Chain Scanner - Recuperação de Notas

**Arquivo:** [`sdk/src/chain-scanner.ts`](sdk/src/chain-scanner.ts)

**Status:** Stub existe

**O que falta:**
- [ ] Query Starknet events (getLogs)
- [ ] Decrypt `encrypted_note` do Shielded event
- [ ] Reconstruct notes com IVK
- [ ] Merge com local storage

### 7. NoteStore - Sistema de Status

**Arquivo:** [`sdk/src/storage/NoteStore.ts`](sdk/src/storage/NoteStore.ts)

**Status:** Parcial

**O que falta:**
- [ ] Implementar `selectNotesForProof()` com marcação imediata de pending
- [ ] Implementar `restoreNotes()` para revert
- [ ] Testar race conditions

---

## 🟡 MÉDIA PRIORIDADE

### 8. ComplianceOracle - Integração Real

**Arquivo:** [`contracts/compliance_oracle/src/compliance_oracle.cairo`](contracts/compliance_oracle/src/compliance_oracle.cairo)

**Status:** Implementado, precisa de testes

**O que falta:**
- [ ] Testes com autoridades reais
- [ ] Integração com oráculos KYC (Chainlink, etc.)
- [ ] Proof scope validation

### 9. IntentMatcher - Dark Pool

**Arquivo:** [`contracts/intent_matcher/src/intent_matcher.cairo`](contracts/intent_matcher/src/intent_matcher.cairo)

**Status:** Implementado, precisa de testes

**O que falta:**
- [ ] Matching algorithm completo
- [ ] Encrypted intent submission
- [ ] Testes de front-running resistance

### 10. Circuitos Restantes

**O que falta:**
- [ ] `circuits/src/unshield/circuit.rs` - Prover real
- [ ] `circuits/src/private_swap/circuit.rs` - Prover real  
- [ ] `circuits/src/private_yield/circuit.rs` - Prover real
- [ ] `circuits/src/compliance/circuit.rs` - Prover real
- [ ] `circuits/src/intent/circuit.rs` - Prover real

---

## 🟢 BAIXA PRIORIDADE

### 11. Testes

**O que falta:**
- [ ] Testes de fuzzing para Cairo contracts
- [ ] Testes de integração SDK (integração com contracts deployados)
- [ ] Testes E2E com testnet real

### 12. Frontend - UX Polish

**O que falta:**
- [ ] Componente ProofTerminal animado
- [ ] Loading states detalhados
- [ ] Error recovery flows

### 13. Documentação

**O que falta:**
- [ ]Auditorias de segurança
- [ ] Specs formal verification
- [ ] Integration guides para exchanges

---

## 📋 Checklist de Produção

```bash
# 1. Build e teste dos contratos
cd contracts && scarb build
cd contracts && snforge test

# 2. Build dos circuitos
cd circuits && cargo build
cd circuits && cargo test

# 3. Build WASM
cd wasm && wasm-pack build --target web

# 4. Build SDK
cd sdk && pnpm build

# 5. Deploy para testnet (Sepolia)
# - Deploy PhantomPool
# - Deploy PhantomVerifier  
# - Deploy ComplianceOracle
# - Deploy IntentMatcher

# 6. Configurar environment vars
NEXT_PUBLIC_PHANTOM_POOL_ADDRESS=0x...
NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS=0x...
# etc...

# 7. Testar E2E na testnet
# - Shield WBTC
# - Unshield WBTC
# - Private Swap
# - Yield deposit
```

---

## ⏱️ Timeline Estimada

| Fase | Tempo Estimado |
|------|----------------|
| Stwo AIR Implementation | 2-3 semanas |
| WASM Prover Build | 1 semana |
| Key Derivation | 1 semana |
| Chain Scanner | 1 semana |
| Testes de Integração | 2 semanas |
| Auditoria de Segurança | 4-6 semanas |
| **Total** | **~11-14 semanas** |

---

## 🎯 Priorização Recomendada

1. **Semana 1-3:** Stwo AIR circuits + WASM prover
2. **Semana 4-5:** Key derivation + NoteStore
3. **Semana 6:** Chain scanner + integration
4. **Semana 7-8:** Testes E2E
5. **Semana 9-10:** Bug fixes + optimizations
6. **Semana 11-16:** Auditoria + mainnet deploy

---

## ⚠️ Riscos Identificados

1. **Stwo API não estável** - Versão 2.1.0 pode mudar
2. **Cairo 2.13 → 2.14** - Migrate pode ser necessário
3. **Starknet 0.14.2** - Verifier nativo pode mudar abordagem
4. **Auditoria** - Pode revelar vulnerabilidades críticas
