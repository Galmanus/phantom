# Guia de Deploy - Starknet Sepolia

## Pré-requisitos

### 1. Instalar Starknet Foundry (sncast)

```bash
# Via curl (Linux/macOS)
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/install.sh | sh

# Ou via cargo
cargo install starknet-foundry --locked

# Verificar instalação
sncast --version
```

### 2. Obter ETH Sepolia

Você precisa de ETH na rede Sepolia para pagar deploy. Opções:

- **Faucet oficial Starknet**: https://starknet-faucet.vercel.app/
- **Bridge ETH**: https://starkgate.starknet.io/ (depois de obter ETH Sepolia na Ethereum)

### 3. Configurar Carteira

Guarde sua private key da carteira (Argent X ou Braavos). Você vai precisar exportar.

---

## Passo a Passo

### Passo 1: Configurar variáveis de ambiente

Crie ou atualize o arquivo `.env.local`:

```bash
# Seu endereço de deployer (sua carteira)
DEPLOYER_ADDRESS="0xSEU_ENDERECO_AQUI"

# Sua private key (SEM o 0x prefix)
DEPLOYER_PRIVATE_KEY="SUA_PRIVATE_KEY_SEM_0x"

# RPC URL (Alchemy ou Infura)
STARKNET_RPC_URL="https://starknet-sepolia.g.alchemy.com/v2/SEU_API_KEY"
```

### Passo 2: Compilar contratos Cairo

```bash
cd contracts

# Compilar todos os contratos
scarb build

# Se tiver snforge instalado, rodar testes
snforge test
```

### Passo 3: Executar deploy

```bash
# Método 1: Usar o script
bash scripts/deploy_sepolia.sh

# Método 2: Deploy manual com sncast

# Deploy PhantomMerkle
sncast --network sepolia deploy --contract-name PhantomMerkle

# Deploy PhantomVerifier
sncast --network sepolia deploy --contract-name PhantomVerifier --constructor-calldata "0 ENDERECO_DEPLOYER"

# Deploy ComplianceOracle  
sncast --network sepolia deploy --contract-name ComplianceOracle --constructor-calldata "ENDERECO_DEPLOYER"

# Deploy IntentMatcher
sncast --network sepolia deploy --contract-name IntentMatcher --constructor-calldata "ENDERECO_POOL ENDERECO_DEPLOYER"

# Deploy PhantomPool (último - depende dos outros)
sncast --network sepolia deploy --contract-name PhantomPool --constructor-calldata "ENDERECO_MERKLE ENDERECO_VERIFIER ENDERECO_COMPLIANCE ENDERECO_DEPLOYER"
```

### Passo 4: Atualizar .env.local

Após o deploy, os endereços serão salvos em `.env.local`:

```
NEXT_PUBLIC_PHANTOM_POOL_ADDRESS=0x...
NEXT_PUBLIC_PHANTOM_MERKLE_ADDRESS=0x...
NEXT_PUBLIC_PHANTOM_VERIFIER_ADDRESS=0x...
NEXT_PUBLIC_COMPLIANCE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_INTENT_MATCHER_ADDRESS=0x...
```

### Passo 5: Build do Frontend

```bash
npm run build
# ou
pnpm build
```

---

## Comandos Úteis sncast

```bash
# Declarar contrato (para obter class hash)
sncast --network sepolia declare --contract-name SeuContrato

# Deploy com salt customizado
sncast --network sepolia deploy --contract-name SeuContrato --salt 0x123...

# Verificar status de transação
sncast --network sepolia tx status 0xTX_HASH

# Chamar função view
sncast --network sepolia call --contract-address 0x... --function nome_funcao
```

---

## Problemas Comuns

### "RPC node not available"
- Verifique se o RPC URL está correto
- Use outro provider (Alchemy, Infura, orugatt)

### "Insufficient funds"
- Você precisa de ETH Sepolia no endereço de deploy
- Use o faucet: https://starknet-faucet.vercel.app/

### "Contract not found"
- Compile os contratos primeiro: `cd contracts && scarb build`
- Verifique se o nome do contrato está correto no Scarb.toml

### "Invalid signature"
- Verifique se a private key está correta
- Não inclua o prefixo 0x na private key

---

## Após Deploy

1. **Verificar contratos**: Use o Starknet Explorer
   - Sepolia Explorer: https://sepolia.starkscan.co/

2. **Atualizar frontend**: O app vai automaticamente usar os endereços do .env.local

3. **Testar**: Faça um deposit pequeno para testar o fluxo

---

## Arquitetura dos Contratos

```
PhantomPool (principal)
    ├── PhantomMerkle (árvore de notas)
    ├── PhantomVerifier (provas STARK)
    ├── ComplianceOracle (compliance)
    └── IntentMatcher (matching de intents)
```

Cada contrato tem uma função específica no protocolo PHANTOM.
