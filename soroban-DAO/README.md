# Soroban DAO

A decentralized autonomous organization (DAO) smart contract built on Stellar's Soroban platform.

## 📁 Project Structure

```text
.
├── contracts
│   └── soroban-dao
│       ├── src
│       │   ├── lib.rs      # Main contract logic
│       │   └── test.rs     # Contract tests
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

## 🚀 Contract Features

- **Create DAO**: Create new DAOs with name, description, and deadline
- **Vote**: Cast votes (Yes/No) on DAOs
- **Update DAO**: Modify DAO details (owner only)
- **Delete DAO**: Remove a DAO (owner only)
- **Donate**: Donate XLM to the contract
- **Withdraw**: Withdraw funds (admin only)

---

## 🛠️ Stellar CLI Commands Reference

### Prerequisites

Install the Stellar CLI:
```bash
# Using cargo
cargo install stellar-cli --locked

# Verify installation
stellar --version
```

---

## 📦 Contract Commands

### Initialize a New Soroban Project
```bash
# Create a new project
stellar contract init my-project

# Create with example contracts
stellar contract init my-project --with-example token

# Create with frontend template
stellar contract init my-project --frontend-template astro
```

### Build Contract
```bash
# Build all contracts in workspace
stellar contract build

```

### Optimize Contract (Optional - reduces WASM size)
```bash
stellar contract optimize --wasm target/wasm32v1-none/release/soroban_dao.wasm
```

---

## 🔑 Key Management

### Generate New Keys
```bash
# Generate a new identity (stored locally)
stellar keys generate <NAME> --network testnet

# Generate and fund with testnet XLM
stellar keys generate <NAME> --network testnet
stellar keys fund <NAME> --network testnet
```

### List All Keys
```bash
# List all identities
stellar keys ls

# List with file paths
stellar keys ls -l
```

### Show Key Details
```bash
# Get public address
stellar keys address <NAME>

# Get secret key (KEEP THIS PRIVATE!)
stellar keys show <NAME>
```

### Import Existing Key
```bash
# Import using secret key
stellar keys add <NAME> --secret-key
# Then enter your secret key when prompted

# Import using seed phrase (12/24 words)
stellar keys add <NAME> --seed-phrase
# Then enter your seed phrase when prompted
```

### Remove Key
```bash
stellar keys rm <NAME>
```

### Fund Account (Testnet Only)
```bash
stellar keys fund <NAME> --network testnet
```

---

## 🌐 Network Configuration

### Add Network
```bash
# Add testnet
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Add mainnet
stellar network add --global mainnet \
  --rpc-url https://soroban.stellar.org:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Add futurenet
stellar network add --global futurenet \
  --rpc-url https://rpc-futurenet.stellar.org:443 \
  --network-passphrase "Test SDF Future Network ; October 2022"
```

### List Networks
```bash
stellar network ls
```

### Remove Network
```bash
stellar network rm <NETWORK_NAME>
```

---

## 🚀 Deploy Contract

### Deploy to Testnet
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/soroban_dao.wasm \
  --source-account <IDENTITY_NAME> \
  --network testnet \
  --alias soroban_dao
```

### Deploy to Mainnet
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/soroban_dao.wasm \
  --source-account <IDENTITY_NAME> \
  --network mainnet \
  --alias soroban_dao
```

---

## 📝 Contract Invocation

### Initialize Contract
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source-account <IDENTITY_NAME> \
  --network testnet \
  -- \
  initialize \
  --admin <ADMIN_ADDRESS>
```
```bash
shangesh@fedora:~/Soroban-DAO/soroban-DAO$ stellar contract invoke \
  --id CASPJ3SPGNPEYLOSRSNIETEFUSB4FMXBSCYA7QUSVCAV4JIIDROIXBGC \
  --source-account shangesh \
  --network testnet \
  -- \
  initialize \
  --admin $(stellar keys address shangesh)
```

```bash

stellar contract invoke --id soroban_dao --source-account shangesh --network testnet -- initialize --admin $(stellar keys address shangesh)

```
### Create a DAO
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source-account <IDENTITY_NAME> \
  --network testnet \
  -- \
  create_dao \
  --dao_owner <OWNER_ADDRESS> \
  --dao_name "My DAO" \
  --dao_image "https://example.com/image.png" \
  --dao_description "Description of my DAO" \
  --dao_deadline 1735689600
```

### Vote on a DAO
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source-account <IDENTITY_NAME> \
  --network testnet \
  -- \
  vote_dao \
  --voter <VOTER_ADDRESS> \
  --dao_name "My DAO" \
  --choice "yes"
```

### Get DAO Details
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source-account <IDENTITY_NAME> \
  --network testnet \
  -- \
  get_dao \
  --dao_name "My DAO"
```

### Get All DAOs
```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source-account <IDENTITY_NAME> \
  --network testnet \
  -- \
  get_all_daos
```

---

## 🔧 Useful Commands

### Check Contract Info
```bash
# Get contract WASM hash
stellar contract info wasm-hash --wasm target/wasm32v1-none/release/soroban_dao.wasm

# Fetch contract code from network
stellar contract fetch --id <CONTRACT_ID> --network testnet
```

### Contract Aliases
```bash
# List aliases
stellar contract alias ls

# Add alias
stellar contract alias add <ALIAS_NAME> <CONTRACT_ID>

# Remove alias
stellar contract alias rm <ALIAS_NAME>
```

### Generate TypeScript Bindings
```bash
stellar contract bindings typescript \
  --wasm target/wasm32v1-none/release/soroban_dao.wasm \
  --output-dir ./bindings \
  --contract-id <CONTRACT_ID>
```

---

## 📋 Quick Start Guide

```bash
# 1. Clone and navigate to project
cd soroban-DAO

# 2. Generate identity and fund it
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

# 3. Build the contract
stellar contract build

# 4. Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/soroban_dao.wasm \
  --source-account deployer \
  --network testnet \
  --alias soroban_dao

# 5. Initialize the contract (replace CONTRACT_ID with deployed ID)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source-account deployer \
  --network testnet \
  -- \
  initialize \
  --admin $(stellar keys address deployer)

# 6. Verify deployment
stellar keys address deployer
```

---

## 🔐 Security Notes

- **Never share your secret key** - It gives full access to your account
- **Backup your keys** - Store recovery phrases securely offline
- **Test on testnet first** - Always deploy to testnet before mainnet
- **Use funded accounts** - Ensure your account has enough XLM for fees

---

## 📚 Resources

- [Stellar Developers Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar CLI Reference](https://developers.stellar.org/docs/tools/stellar-cli)
- [Stellar Laboratory](https://lab.stellar.org/)
- [Stellar Expert Explorer](https://stellar.expert/)

---

## 📄 Deployed Contract Info

| Network | Contract ID |
|---------|-------------|
| Testnet | `CASPJ3SPGNPEYLOSRSNIETEFUSB4FMXBSCYA7QUSVCAV4JIIDROIXBGC` |

---

## 📝 License

This project is licensed under the MIT License.
