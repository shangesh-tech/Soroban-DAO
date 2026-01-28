# 🌟 Complete Stellar SDK Guide
## From Basic to Pro - @stellar/stellar-sdk

> **Last Updated**: January 2025  
> **SDK Version**: @stellar/stellar-sdk (latest)  
> **Author**: Your Soroban Learning Journey

---

## 📚 Table of Contents

1. [Introduction](#1-introduction)
2. [Installation & Setup](#2-installation--setup)
3. [Core Concepts](#3-core-concepts)
4. [Keypair - Managing Keys](#4-keypair---managing-keys)
5. [Networks & Servers](#5-networks--servers)
6. [Account Management](#6-account-management)
7. [TransactionBuilder](#7-transactionbuilder)
8. [Basic Operations (Payments)](#8-basic-operations-payments)
9. [Soroban Contract Interaction](#9-soroban-contract-interaction)
10. [ScVal Type Conversions](#10-scval-type-conversions)
11. [Contract Client](#11-contract-client)
12. [Simulating Transactions](#12-simulating-transactions)
13. [Freighter Wallet Integration](#13-freighter-wallet-integration)
14. [Events & Streaming](#14-events--streaming)
15. [Error Handling](#15-error-handling)
16. [Complete Examples](#16-complete-examples)
17. [Best Practices](#17-best-practices)
18. [Quick Reference](#18-quick-reference)

---

## 1. Introduction

### What is @stellar/stellar-sdk?

The `@stellar/stellar-sdk` is the official JavaScript library for interacting with:
- **Stellar Network** (payments, accounts, assets)
- **Soroban Smart Contracts** (deploy, invoke, simulate)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    @stellar/stellar-sdk                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ETHEREUM EQUIVALENT:                                                       │
│  ─────────────────────                                                      │
│  ethers.js / viem.js  ←→  @stellar/stellar-sdk                             │
│                                                                             │
│  WHAT IT DOES:                                                              │
│  • Build and sign transactions                                             │
│  • Interact with smart contracts (Soroban)                                 │
│  • Query blockchain data                                                   │
│  • Manage keypairs and accounts                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### SDK Architecture

```
@stellar/stellar-sdk
├── Keypair           → Generate/manage keys (like ethers.Wallet)
├── TransactionBuilder → Build transactions
├── Contract          → Interact with Soroban contracts
├── rpc.Server        → Connect to Soroban RPC
├── Horizon.Server    → Connect to Horizon API
├── Networks          → Network passphrases
├── Operation         → Transaction operations
├── Asset             → Stellar assets (XLM, tokens)
└── nativeToScVal     → Type conversions for Soroban
```

---

## 2. Installation & Setup

### Install the SDK

```bash
# npm
npm install @stellar/stellar-sdk

# yarn
yarn add @stellar/stellar-sdk

# pnpm
pnpm add @stellar/stellar-sdk
```

### Basic Project Setup

```javascript
// package.json
{
  "name": "my-stellar-dapp",
  "type": "module",           // Use ES modules
  "dependencies": {
    "@stellar/stellar-sdk": "^12.0.0"
  }
}
```

### Import Styles

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// OPTION 1: Named Imports (Recommended)
// ═══════════════════════════════════════════════════════════════════════════
import {
  Keypair,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Address,
  nativeToScVal,
  scValToNative,
  rpc
} from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 2: Namespace Import
// ═══════════════════════════════════════════════════════════════════════════
import * as StellarSdk from '@stellar/stellar-sdk';
// Usage: StellarSdk.Keypair, StellarSdk.Contract, etc.

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 3: CommonJS (older Node.js)
// ═══════════════════════════════════════════════════════════════════════════
const { Keypair, Contract } = require('@stellar/stellar-sdk');
```

---

## 3. Core Concepts

### Understanding the Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  HOW STELLAR TRANSACTIONS WORK                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CREATE KEYPAIR                                                         │
│     └── Generate or import secret key                                      │
│                                                                             │
│  2. CONNECT TO NETWORK                                                     │
│     └── rpc.Server (for Soroban) or Horizon.Server (for classic)          │
│                                                                             │
│  3. GET ACCOUNT                                                            │
│     └── Fetch account sequence number from network                         │
│                                                                             │
│  4. BUILD TRANSACTION                                                      │
│     └── TransactionBuilder → add operations → set timeout → build()       │
│                                                                             │
│  5. SIMULATE (Soroban only)                                                │
│     └── server.simulateTransaction() → get resource estimates             │
│                                                                             │
│  6. SIGN TRANSACTION                                                       │
│     └── transaction.sign(keypair) or Freighter wallet                     │
│                                                                             │
│  7. SUBMIT TRANSACTION                                                     │
│     └── server.sendTransaction() → wait for confirmation                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Network Passphrases

```javascript
import { Networks } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK PASSPHRASES (Like Chain IDs in Ethereum)
// ═══════════════════════════════════════════════════════════════════════════

const NETWORKS = {
  TESTNET: Networks.TESTNET,    // "Test SDF Network ; September 2015"
  MAINNET: Networks.PUBLIC,     // "Public Global Stellar Network ; September 2015"
  FUTURENET: Networks.FUTURENET // "Test SDF Future Network ; October 2022"
};

// Ethereum comparison:
// Mainnet chainId: 1     → Networks.PUBLIC
// Goerli chainId: 5      → Networks.TESTNET
// Sepolia chainId: 11155111 → Networks.TESTNET
```

### RPC Endpoints

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// SOROBAN RPC ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const RPC_URLS = {
  // Testnet (for development)
  TESTNET: 'https://soroban-testnet.stellar.org',
  
  // Mainnet (for production)
  MAINNET: 'https://mainnet.sorobanrpc.com',
  
  // Futurenet (for experimental features)
  FUTURENET: 'https://rpc-futurenet.stellar.org'
};

// Ethereum comparison:
// Infura: https://mainnet.infura.io/v3/YOUR_KEY
// Alchemy: https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

---

## 4. Keypair - Managing Keys

### Generate New Keypair

```javascript
import { Keypair } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE RANDOM KEYPAIR
// ═══════════════════════════════════════════════════════════════════════════
const keypair = Keypair.random();

console.log('Public Key:', keypair.publicKey());
// Output: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (56 chars)

console.log('Secret Key:', keypair.secret());
// Output: SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (56 chars)

// ⚠️ IMPORTANT: Secret key starts with 'S', Public key starts with 'G'
```

### Import Existing Keypair

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// FROM SECRET KEY
// ═══════════════════════════════════════════════════════════════════════════
const secretKey = 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const keypair = Keypair.fromSecret(secretKey);

console.log('Public Key:', keypair.publicKey());
// Derives public key from secret

// ═══════════════════════════════════════════════════════════════════════════
// FROM PUBLIC KEY ONLY (for verification, no signing)
// ═══════════════════════════════════════════════════════════════════════════
const publicKey = 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const publicOnlyKeypair = Keypair.fromPublicKey(publicKey);
// Cannot sign transactions with this!
```

### Signing Data

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// SIGN RAW DATA
// ═══════════════════════════════════════════════════════════════════════════
const keypair = Keypair.fromSecret('SXXX...');
const data = Buffer.from('Hello Stellar!');

const signature = keypair.sign(data);
console.log('Signature:', signature.toString('hex'));

// ═══════════════════════════════════════════════════════════════════════════
// VERIFY SIGNATURE
// ═══════════════════════════════════════════════════════════════════════════
const isValid = keypair.verify(data, signature);
console.log('Is Valid:', isValid); // true
```

### Keypair Comparison with Ethereum

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// ETHEREUM (ethers.js)                    │  STELLAR
// ═══════════════════════════════════════════════════════════════════════════
// const wallet = ethers.Wallet.createRandom() │ const keypair = Keypair.random()
// wallet.address                            │ keypair.publicKey()
// wallet.privateKey                         │ keypair.secret()
// new ethers.Wallet(privateKey)             │ Keypair.fromSecret(secret)
// wallet.signMessage(msg)                   │ keypair.sign(data)
```

---

## 5. Networks & Servers

### Soroban RPC Server

```javascript
import { rpc } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// CONNECT TO SOROBAN RPC
// Used for: Smart contract interactions, simulations, sending transactions
// ═══════════════════════════════════════════════════════════════════════════

// Testnet
const server = new rpc.Server('https://soroban-testnet.stellar.org');

// Mainnet
const mainnetServer = new rpc.Server('https://mainnet.sorobanrpc.com');

// With options
const serverWithOptions = new rpc.Server('https://soroban-testnet.stellar.org', {
  allowHttp: false,  // Set true only for local development
});
```

### Horizon Server

```javascript
import { Horizon } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// CONNECT TO HORIZON API
// Used for: Account info, payments, asset management (non-smart-contract)
// ═══════════════════════════════════════════════════════════════════════════

// Testnet
const horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');

// Mainnet
const horizonMainnet = new Horizon.Server('https://horizon.stellar.org');
```

### When to Use Which?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  rpc.Server vs Horizon.Server                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USE rpc.Server FOR:                     │  USE Horizon.Server FOR:        │
│  ─────────────────────────────────────   │  ────────────────────────────── │
│  • Soroban smart contracts               │  • Account balances             │
│  • simulateTransaction()                 │  • Transaction history          │
│  • sendTransaction() for contracts       │  • Payment operations           │
│  • getTransaction() status               │  • Streaming events             │
│  • Contract state queries                │  • Asset information            │
│                                                                             │
│  Think: "Contract stuff"                 │  Think: "Account/Payment stuff" │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Account Management

### Get Account from Network

```javascript
import { rpc, Keypair, Networks } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// FETCH ACCOUNT (Required before building transactions)
// ═══════════════════════════════════════════════════════════════════════════

const server = new rpc.Server('https://soroban-testnet.stellar.org');
const keypair = Keypair.fromSecret('SXXXXXXX...');
const publicKey = keypair.publicKey();

// Fetch account (includes sequence number)
const account = await server.getAccount(publicKey);

console.log('Account ID:', account.accountId());
console.log('Sequence:', account.sequenceNumber());

// This account object is needed for TransactionBuilder!
```

### Fund Account on Testnet (Friendbot)

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// USE FRIENDBOT TO FUND TESTNET ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════

const publicKey = keypair.publicKey();

// Method 1: Fetch request
const response = await fetch(
  `https://friendbot.stellar.org?addr=${publicKey}`
);
const result = await response.json();
console.log('Account funded!', result);

// Method 2: Using the SDK
import { Horizon } from '@stellar/stellar-sdk';
const horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');
await horizonServer.friendbot(publicKey).call();
```

---

## 7. TransactionBuilder

### Basic Transaction Structure

```javascript
import { 
  TransactionBuilder, 
  Networks, 
  BASE_FEE,
  Operation,
  Asset
} from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION BUILDER ANATOMY
// ═══════════════════════════════════════════════════════════════════════════

const transaction = new TransactionBuilder(sourceAccount, {
  fee: BASE_FEE,                    // Base fee in stroops (100 stroops = 0.00001 XLM)
  networkPassphrase: Networks.TESTNET
})
  .addOperation(/* operation */)    // Add one or more operations
  .setTimeout(300)                  // Timeout in seconds (max 5 minutes)
  .build();                         // Finalize the transaction
```

### TransactionBuilder Options

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// ALL TRANSACTIONBUILDER OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

const options = {
  // Required
  fee: BASE_FEE,                         // In stroops (string or number)
  networkPassphrase: Networks.TESTNET,   // Network identifier
  
  // Optional
  timebounds: {
    minTime: 0,                          // Unix timestamp or Date
    maxTime: Date.now() + 300000         // 5 minutes from now
  },
  memo: Memo.text('Hello!'),             // Optional memo
};

const tx = new TransactionBuilder(account, options)
  .addOperation(operation)
  .build();
```

### Adding Multiple Operations

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS CAN HAVE MULTIPLE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

const transaction = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET
})
  // Operation 1: Send XLM
  .addOperation(Operation.payment({
    destination: 'GDESTINATION...',
    asset: Asset.native(),
    amount: '10'
  }))
  // Operation 2: Send XLM to another address
  .addOperation(Operation.payment({
    destination: 'GDESTINATION2...',
    asset: Asset.native(),
    amount: '5'
  }))
  .setTimeout(300)
  .build();
```

### Signing & Submitting

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// SIGN AND SUBMIT TRANSACTION
// ═══════════════════════════════════════════════════════════════════════════

// 1. Build transaction
const transaction = new TransactionBuilder(account, {...})
  .addOperation(...)
  .setTimeout(300)
  .build();

// 2. Sign with keypair
transaction.sign(keypair);

// 3. Submit to network
const server = new rpc.Server('https://soroban-testnet.stellar.org');
const result = await server.sendTransaction(transaction);

console.log('Transaction Hash:', result.hash);
console.log('Status:', result.status);
// Status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'NOT_FOUND'
```

---

## 8. Basic Operations (Payments)

### Send XLM Payment

```javascript
import { 
  Keypair, 
  TransactionBuilder, 
  Networks, 
  BASE_FEE, 
  Operation, 
  Asset,
  Horizon
} from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// SEND XLM FROM ONE ACCOUNT TO ANOTHER
// ═══════════════════════════════════════════════════════════════════════════

async function sendXLM(senderSecret, receiverPublicKey, amount) {
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');
  const senderKeypair = Keypair.fromSecret(senderSecret);
  
  // 1. Load sender account
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());
  
  // 2. Build transaction
  const transaction = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(Operation.payment({
      destination: receiverPublicKey,
      asset: Asset.native(),        // XLM
      amount: amount.toString()     // Amount as string
    }))
    .setTimeout(300)
    .build();
  
  // 3. Sign
  transaction.sign(senderKeypair);
  
  // 4. Submit
  const result = await server.submitTransaction(transaction);
  console.log('Success! TX Hash:', result.hash);
  
  return result;
}

// Usage:
await sendXLM('SXXX...', 'GYYY...', '100');
```

---

## 9. Soroban Contract Interaction

### The Contract Class

```javascript
import { Contract, Address } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// CREATE CONTRACT INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

// Contract address (from deployment)
const contractAddress = 'CDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// Create contract instance
const contract = new Contract(contractAddress);

// Get contract address as Address object
const address = Address.fromString(contractAddress);
```

### Invoke Contract Function

```javascript
import { 
  Keypair, 
  Contract, 
  TransactionBuilder, 
  Networks, 
  BASE_FEE,
  rpc,
  nativeToScVal
} from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE EXAMPLE: INVOKE SOROBAN CONTRACT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function invokeContract(secretKey, contractAddress, functionName, args) {
  // 1. Setup
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const keypair = Keypair.fromSecret(secretKey);
  const publicKey = keypair.publicKey();
  
  // 2. Load account
  const account = await server.getAccount(publicKey);
  
  // 3. Create contract instance
  const contract = new Contract(contractAddress);
  
  // 4. Build the contract call operation
  // The contract.call() method creates an Operation for invoking a function
  const operation = contract.call(functionName, ...args);
  
  // 5. Build transaction
  let transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();
  
  // 6. Simulate transaction (REQUIRED for Soroban!)
  const simulation = await server.simulateTransaction(transaction);
  
  // Check for errors
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }
  
  // 7. Prepare transaction (adds resource info from simulation)
  const preparedTransaction = rpc.assembleTransaction(
    transaction,
    simulation
  ).build();
  
  // 8. Sign
  preparedTransaction.sign(keypair);
  
  // 9. Submit
  const sendResponse = await server.sendTransaction(preparedTransaction);
  
  // 10. Wait for confirmation
  if (sendResponse.status === 'PENDING') {
    let getResponse = await server.getTransaction(sendResponse.hash);
    
    while (getResponse.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(sendResponse.hash);
    }
    
    if (getResponse.status === 'SUCCESS') {
      console.log('Transaction successful!');
      return getResponse.returnValue; // The contract's return value
    } else {
      throw new Error(`Transaction failed: ${getResponse.status}`);
    }
  }
  
  return sendResponse;
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLE: Call your DAO contract
// ═══════════════════════════════════════════════════════════════════════════

// Example: Call create_dao
const result = await invokeContract(
  'SXXX...',                    // Your secret key
  'CDXXX...',                   // Contract address
  'create_dao',                 // Function name
  [
    nativeToScVal('My DAO', { type: 'string' }),           // dao_name
    nativeToScVal('Description', { type: 'string' }),     // dao_des
    new Address('GXXX...').toScVal(),                      // dao_owner
    nativeToScVal(1700000000n, { type: 'u64' })           // dao_deadline
  ]
);
```

---

## 10. ScVal Type Conversions

### The Problem

Soroban smart contracts use a special type system called `ScVal` (Stellar Contract Value). You need to convert JavaScript types to ScVal before sending to contracts.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JavaScript  ←→  ScVal  ←→  Soroban Contract              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  JavaScript         │  ScVal Type        │  Rust (Contract)               │
│  ───────────────────┼────────────────────┼───────────────────────────────  │
│  "hello"            │  scvString         │  String                        │
│  true/false         │  scvBool           │  bool                          │
│  123n (BigInt)      │  scvU64/scvI64     │  u64/i64                       │
│  [1, 2, 3]          │  scvVec            │  Vec<T>                        │
│  { key: value }     │  scvMap            │  Map<K, V>                     │
│  Address object     │  scvAddress        │  Address                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### nativeToScVal - JavaScript to ScVal

```javascript
import { nativeToScVal, Address } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// CONVERT JAVASCRIPT VALUES TO ScVal
// ═══════════════════════════════════════════════════════════════════════════

// String
const strVal = nativeToScVal('Hello World', { type: 'string' });

// Symbol (short string, max 32 chars, used for function names)
const symVal = nativeToScVal('MySymbol', { type: 'symbol' });

// Boolean
const boolVal = nativeToScVal(true);

// Numbers (use BigInt for precise values)
const u32Val = nativeToScVal(123, { type: 'u32' });
const i32Val = nativeToScVal(-123, { type: 'i32' });
const u64Val = nativeToScVal(123n, { type: 'u64' });
const i64Val = nativeToScVal(-123n, { type: 'i64' });
const u128Val = nativeToScVal(BigInt('12345678901234567890'), { type: 'u128' });
const i128Val = nativeToScVal(BigInt('-12345678901234567890'), { type: 'i128' });

// Address
const addrVal = new Address('GXXXX...').toScVal();
// Or: nativeToScVal('GXXXX...', { type: 'address' });

// Bytes
const bytesVal = nativeToScVal(Buffer.from('hello'), { type: 'bytes' });

// Array/Vector
const vecVal = nativeToScVal([1, 2, 3], { type: { Vec: 'u32' } });
// Or let it auto-detect: nativeToScVal([1n, 2n, 3n]);

// Map/Object
const mapVal = nativeToScVal(
  new Map([['key1', 100n], ['key2', 200n]]),
  { type: { Map: { key: 'symbol', value: 'u64' } } }
);

// Void/null
const voidVal = nativeToScVal(null);
```

### scValToNative - ScVal to JavaScript

```javascript
import { scValToNative } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// CONVERT ScVal (from contract) TO JavaScript
// ═══════════════════════════════════════════════════════════════════════════

// After calling a contract function
const contractResult = await invokeContract(...);

// Convert the return value to JavaScript
const jsValue = scValToNative(contractResult);

console.log(jsValue);
// Might output: { dao_name: "TechDAO", yes: 5n, no: 2n, total_votes: 7n }
```

### Type Mapping Reference

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE TYPE MAPPING REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

const TYPE_MAP = {
  // Primitives
  'string':   'String in Rust',
  'symbol':   'Symbol in Rust (short string)',
  'bool':     'bool in Rust',
  'bytes':    'Bytes/BytesN in Rust',
  'address':  'Address in Rust',
  
  // Integers (use type hints!)
  'u32':      'u32 in Rust',
  'i32':      'i32 in Rust',
  'u64':      'u64 in Rust',
  'i64':      'i64 in Rust',
  'u128':     'u128 in Rust',
  'i128':     'i128 in Rust (for amounts!)',
  'u256':     'u256 in Rust',
  'i256':     'i256 in Rust',
  
  // Collections
  'Vec':      'Vec<T> in Rust',
  'Map':      'Map<K,V> in Rust',
  
  // Special
  'void':     '() in Rust',
};

// For your DAO contract:
// dao_name: String     → nativeToScVal(name, { type: 'string' })
// dao_deadline: u64    → nativeToScVal(deadline, { type: 'u64' })
// amount: i128         → nativeToScVal(amount, { type: 'i128' })
// dao_owner: Address   → new Address(pubkey).toScVal()
```

---

## 11. Contract Client

### Using Operation.invokeContractFunction

```javascript
import { Operation, Address, xdr } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// ALTERNATIVE: Use Operation.invokeContractFunction directly
// ═══════════════════════════════════════════════════════════════════════════

const operation = Operation.invokeContractFunction({
  contract: contractAddress,
  function: 'create_dao',
  args: [
    nativeToScVal('DAOName', { type: 'string' }),
    nativeToScVal('Description', { type: 'string' }),
    new Address(ownerPublicKey).toScVal(),
    nativeToScVal(1700000000n, { type: 'u64' })
  ]
});

// Add to transaction
const tx = new TransactionBuilder(account, options)
  .addOperation(operation)
  .setTimeout(300)
  .build();
```

### Reading Contract State (View Functions)

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// CALL VIEW FUNCTIONS (Read-only, no signature needed)
// ═══════════════════════════════════════════════════════════════════════════

async function readContract(contractAddress, functionName, args = []) {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const contract = new Contract(contractAddress);
  
  // For read-only calls, we can use a random account
  const tempKeypair = Keypair.random();
  
  // Need to fund this account first, or use an existing funded account
  // For simulation-only, you might be able to use any account
  
  const account = await server.getAccount(tempKeypair.publicKey());
  
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(300)
    .build();
  
  // Just simulate - no need to submit!
  const simulation = await server.simulateTransaction(tx);
  
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Read failed: ${simulation.error}`);
  }
  
  // Extract return value
  if (simulation.result) {
    return scValToNative(simulation.result.retval);
  }
  
  return null;
}

// Usage: Get all DAOs
const allDaos = await readContract('CDXXX...', 'get_all_daos');
console.log(allDaos);
```

---

## 12. Simulating Transactions

### Why Simulate?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHY SIMULATE TRANSACTIONS?                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. RESOURCE ESTIMATION                                                     │
│     • CPU instructions needed                                              │
│     • Memory/storage bytes                                                 │
│     • Calculates exact fees                                                │
│                                                                             │
│  2. ERROR DETECTION                                                         │
│     • Catch errors BEFORE paying gas                                       │
│     • See what would fail                                                  │
│                                                                             │
│  3. GET RETURN VALUE                                                        │
│     • See what the function would return                                   │
│     • Test contract logic                                                  │
│                                                                             │
│  4. AUTHORIZATION RECORDING                                                 │
│     • Determine what signatures are needed                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Simulate Transaction

```javascript
import { rpc } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATE TRANSACTION
// ═══════════════════════════════════════════════════════════════════════════

const server = new rpc.Server('https://soroban-testnet.stellar.org');

// Build transaction (without signing)
const transaction = new TransactionBuilder(account, {...})
  .addOperation(contract.call('my_function', ...args))
  .setTimeout(300)
  .build();

// Simulate
const simulation = await server.simulateTransaction(transaction);

// Check result
if (rpc.Api.isSimulationError(simulation)) {
  console.error('Simulation Error:', simulation.error);
} else if (rpc.Api.isSimulationSuccess(simulation)) {
  console.log('Simulation Success!');
  console.log('Min Fee:', simulation.minResourceFee);
  console.log('CPU Instructions:', simulation.cost?.cpuInsns);
  console.log('Memory Bytes:', simulation.cost?.memBytes);
  
  // Get return value if any
  if (simulation.result) {
    const returnValue = scValToNative(simulation.result.retval);
    console.log('Return Value:', returnValue);
  }
}
```

### Assemble Transaction

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// ASSEMBLE: Add simulation results to transaction
// ═══════════════════════════════════════════════════════════════════════════

// After successful simulation
const preparedTx = rpc.assembleTransaction(
  transaction,
  simulation
).build();

// Now sign and submit the prepared transaction
preparedTx.sign(keypair);
const result = await server.sendTransaction(preparedTx);
```

---

## 13. Freighter Wallet Integration

### Install Freighter API

```bash
npm install @stellar/freighter-api
```

### Check Freighter Connection

```javascript
import { 
  isConnected, 
  isAllowed,
  setAllowed,
  getPublicKey,
  signTransaction 
} from '@stellar/freighter-api';

// ═══════════════════════════════════════════════════════════════════════════
// CHECK IF FREIGHTER IS INSTALLED AND CONNECTED
// ═══════════════════════════════════════════════════════════════════════════

async function checkFreighter() {
  // Check if Freighter extension is installed
  const connected = await isConnected();
  if (!connected) {
    throw new Error('Freighter wallet is not installed!');
  }
  
  // Check if user has allowed this dApp
  const allowed = await isAllowed();
  if (!allowed) {
    // Request permission
    await setAllowed();
  }
  
  return true;
}
```

### Get User's Public Key

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// GET USER'S WALLET ADDRESS
// ═══════════════════════════════════════════════════════════════════════════

async function getWalletAddress() {
  await checkFreighter();
  
  const publicKey = await getPublicKey();
  console.log('Connected wallet:', publicKey);
  
  return publicKey;
}
```

### Sign Transaction with Freighter

```javascript
import { TransactionBuilder, Networks, rpc } from '@stellar/stellar-sdk';
import { signTransaction as freighterSign } from '@stellar/freighter-api';

// ═══════════════════════════════════════════════════════════════════════════
// SIGN TRANSACTION WITH FREIGHTER WALLET
// ═══════════════════════════════════════════════════════════════════════════

async function signWithFreighter(transaction, networkPassphrase) {
  // Convert transaction to XDR
  const xdr = transaction.toXDR();
  
  // Request signature from Freighter
  // This opens the Freighter popup for user approval!
  const signedXdr = await freighterSign(xdr, {
    networkPassphrase: networkPassphrase
  });
  
  // Convert back to transaction
  const signedTx = TransactionBuilder.fromXDR(
    signedXdr,
    networkPassphrase
  );
  
  return signedTx;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE FLOW: Build → Sign with Freighter → Submit
// ═══════════════════════════════════════════════════════════════════════════

async function invokeWithFreighter(contractAddress, functionName, args) {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  
  // 1. Get user's wallet address from Freighter
  const publicKey = await getPublicKey();
  
  // 2. Load account
  const account = await server.getAccount(publicKey);
  
  // 3. Build transaction
  const contract = new Contract(contractAddress);
  let transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(300)
    .build();
  
  // 4. Simulate
  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error('Simulation failed');
  }
  
  // 5. Prepare transaction
  const preparedTx = rpc.assembleTransaction(transaction, simulation).build();
  
  // 6. Sign with Freighter (opens wallet popup!)
  const signedTx = await signWithFreighter(preparedTx, Networks.TESTNET);
  
  // 7. Submit
  const result = await server.sendTransaction(signedTx);
  
  // 8. Wait for confirmation
  if (result.status === 'PENDING') {
    let response = await server.getTransaction(result.hash);
    while (response.status === 'NOT_FOUND') {
      await new Promise(r => setTimeout(r, 1000));
      response = await server.getTransaction(result.hash);
    }
    return response;
  }
  
  return result;
}
```

### Freighter Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FREIGHTER WALLET FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  YOUR DAPP                     FREIGHTER                   STELLAR          │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  1. Check isConnected() ────────▶ Is extension installed?                  │
│                                                                             │
│  2. getPublicKey() ─────────────▶ Get user's address                       │
│              ◀────────────────── Returns: GXXX...                          │
│                                                                             │
│  3. Build transaction                                                       │
│     (unsigned)                                                             │
│                                                                             │
│  4. signTransaction(xdr) ────────▶ Shows popup ┌───────────────┐           │
│                                   │            │ Approve TX?   │           │
│                                   │            │ [Reject][OK]  │           │
│                                   │            └───────────────┘           │
│              ◀────────────────── Returns signed XDR                        │
│                                                                             │
│  5. Submit signed TX ────────────────────────────────────▶ Stellar Network │
│              ◀──────────────────────────────────────────── TX Result       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Events & Streaming

### Get Contract Events

```javascript
import { rpc } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY CONTRACT EVENTS
// ═══════════════════════════════════════════════════════════════════════════

async function getContractEvents(contractAddress, startLedger) {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  
  const events = await server.getEvents({
    startLedger: startLedger,
    filters: [
      {
        type: 'contract',
        contractIds: [contractAddress]
      }
    ]
  });
  
  for (const event of events.events) {
    console.log('Event Topic:', event.topic);
    console.log('Event Value:', scValToNative(event.value));
    console.log('Ledger:', event.ledger);
    console.log('---');
  }
  
  return events;
}

// Filter by specific topics (your events!)
const daoEvents = await server.getEvents({
  startLedger: 12345,
  filters: [
    {
      type: 'contract',
      contractIds: [contractAddress],
      topics: [
        ['AAAADgAAAANkYW8='],  // "dao" in ScVal format
        ['AAAADgAAAAdjcmVhdGVk']  // "created" in ScVal format
      ]
    }
  ]
});
```

### Horizon Streaming

```javascript
import { Horizon } from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// STREAM ACCOUNT PAYMENTS (Real-time updates!)
// ═══════════════════════════════════════════════════════════════════════════

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

const closeHandler = server.payments()
  .forAccount('GXXX...')
  .cursor('now')
  .stream({
    onmessage: (payment) => {
      console.log('New Payment!');
      console.log('From:', payment.from);
      console.log('To:', payment.to);
      console.log('Amount:', payment.amount);
    },
    onerror: (error) => {
      console.error('Stream error:', error);
    }
  });

// Later, to stop streaming:
// closeHandler();
```

---

## 15. Error Handling

### Common Errors

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

async function safeContractCall(fn) {
  try {
    return await fn();
  } catch (error) {
    // Simulation errors
    if (error.message.includes('Simulation failed')) {
      console.error('Contract simulation failed:', error.message);
      // Possible causes: wrong arguments, insufficient balance, contract panic
    }
    
    // Transaction errors
    if (error.message.includes('tx_failed')) {
      console.error('Transaction failed:', error.message);
    }
    
    // Network errors
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Cannot connect to RPC server');
    }
    
    // Account not found
    if (error.message.includes('account not found')) {
      console.error('Account does not exist - needs funding');
    }
    
    throw error;
  }
}
```

### Parsing Contract Errors

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// PARSE SOROBAN CONTRACT ERRORS
// ═══════════════════════════════════════════════════════════════════════════

function parseContractError(simulation) {
  if (rpc.Api.isSimulationError(simulation)) {
    const errorMessage = simulation.error;
    
    // Contract panic messages
    if (errorMessage.includes('panic')) {
      // Extract the panic message (e.g., "DAO not found!")
      const match = errorMessage.match(/panic: (.+)/);
      if (match) {
        return `Contract Error: ${match[1]}`;
      }
    }
    
    // Host function errors
    if (errorMessage.includes('HostError')) {
      return `Soroban Host Error: ${errorMessage}`;
    }
    
    return errorMessage;
  }
  
  return null;
}
```

---

## 16. Complete Examples

### Example 1: Create DAO (Your Contract!)

```javascript
import { 
  Keypair, 
  Contract, 
  TransactionBuilder, 
  Networks, 
  BASE_FEE,
  rpc,
  nativeToScVal,
  Address
} from '@stellar/stellar-sdk';

// ═══════════════════════════════════════════════════════════════════════════
// CREATE DAO ON YOUR CONTRACT
// ═══════════════════════════════════════════════════════════════════════════

async function createDAO(secretKey, contractAddress, daoName, description, deadline) {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const keypair = Keypair.fromSecret(secretKey);
  const publicKey = keypair.publicKey();
  
  // 1. Get account
  const account = await server.getAccount(publicKey);
  
  // 2. Create contract and build call
  const contract = new Contract(contractAddress);
  
  // Convert arguments to ScVal
  const args = [
    nativeToScVal(daoName, { type: 'string' }),
    nativeToScVal(description, { type: 'string' }),
    new Address(publicKey).toScVal(),
    nativeToScVal(BigInt(deadline), { type: 'u64' })
  ];
  
  // 3. Build transaction
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(contract.call('create_dao', ...args))
    .setTimeout(300)
    .build();
  
  // 4. Simulate
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }
  
  // 5. Prepare and sign
  const preparedTx = rpc.assembleTransaction(tx, sim).build();
  preparedTx.sign(keypair);
  
  // 6. Submit
  const response = await server.sendTransaction(preparedTx);
  console.log('Submitted! Hash:', response.hash);
  
  // 7. Wait for confirmation
  if (response.status === 'PENDING') {
    let result = await server.getTransaction(response.hash);
    while (result.status === 'NOT_FOUND') {
      await new Promise(r => setTimeout(r, 2000));
      result = await server.getTransaction(response.hash);
    }
    
    if (result.status === 'SUCCESS') {
      console.log('✅ DAO Created Successfully!');
      return result;
    } else {
      throw new Error(`Transaction failed: ${result.status}`);
    }
  }
  
  return response;
}

// Usage:
await createDAO(
  'SXXX...',                    // Your secret key
  'CDXXX...',                   // Contract address
  'TechVoters DAO',             // DAO name
  'A DAO for tech enthusiasts', // Description
  Math.floor(Date.now() / 1000) + 86400 * 30  // 30 days from now
);
```

### Example 2: Vote on DAO

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// VOTE ON DAO
// ═══════════════════════════════════════════════════════════════════════════

async function voteOnDAO(secretKey, contractAddress, daoName, choice) {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  const keypair = Keypair.fromSecret(secretKey);
  const publicKey = keypair.publicKey();
  
  const account = await server.getAccount(publicKey);
  const contract = new Contract(contractAddress);
  
  // Arguments: voter (Address), dao_name (String), choice (String)
  const args = [
    new Address(publicKey).toScVal(),
    nativeToScVal(daoName, { type: 'string' }),
    nativeToScVal(choice, { type: 'string' })  // "yes" or "no"
  ];
  
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .addOperation(contract.call('vote_dao', ...args))
    .setTimeout(300)
    .build();
  
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Vote failed: ${sim.error}`);
  }
  
  const preparedTx = rpc.assembleTransaction(tx, sim).build();
  preparedTx.sign(keypair);
  
  const response = await server.sendTransaction(preparedTx);
  
  // Wait for confirmation...
  // (same pattern as above)
  
  return response;
}

// Usage:
await voteOnDAO('SXXX...', 'CDXXX...', 'TechVoters DAO', 'yes');
```

### Example 3: Get All DAOs (View Function)

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// GET ALL DAOS (Read-only)
// ═══════════════════════════════════════════════════════════════════════════

async function getAllDAOs(contractAddress) {
  const server = new rpc.Server('https://soroban-testnet.stellar.org');
  
  // Use any funded account for simulation
  const tempKeypair = Keypair.random();
  
  // For testnet, fund the account first or use an existing one
  // This is a read-only call, so we just need to simulate
  
  try {
    const account = await server.getAccount(tempKeypair.publicKey());
    const contract = new Contract(contractAddress);
    
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(contract.call('get_all_daos'))
      .setTimeout(300)
      .build();
    
    const sim = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      const daos = scValToNative(sim.result.retval);
      return daos;
    }
  } catch (error) {
    console.error('Error fetching DAOs:', error.message);
  }
  
  return [];
}

// Usage:
const allDaos = await getAllDAOs('CDXXX...');
console.log('All DAOs:', allDaos);
/*
Output:
[
  {
    dao_name: "TechVoters DAO",
    dao_des: "A DAO for tech enthusiasts",
    dao_owner: "GXXX...",
    dao_deadline: 1700000000n,
    yes: 5n,
    no: 2n,
    total_votes: 7n
  },
  ...
]
*/
```

---

## 17. Best Practices

### Security

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// SECURITY BEST PRACTICES
// ═══════════════════════════════════════════════════════════════════════════

// ❌ NEVER do this!
const secretKey = 'SXXXXXXXXXXX';  // Don't hardcode secrets!

// ✅ Use environment variables
const secretKey = process.env.STELLAR_SECRET_KEY;

// ✅ For frontend: ALWAYS use wallet (Freighter)
// Never ask users for their secret key!
const publicKey = await getPublicKey(); // From Freighter

// ✅ Validate inputs before sending to contract
function validateDAOName(name) {
  if (!name || name.length < 3 || name.length > 50) {
    throw new Error('DAO name must be 3-50 characters');
  }
  return name;
}
```

### Performance

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE BEST PRACTICES
// ═══════════════════════════════════════════════════════════════════════════

// ✅ Reuse server instance
const server = new rpc.Server('https://soroban-testnet.stellar.org');
// Use this same instance for all calls

// ✅ Cache account when making multiple calls
let cachedAccount = null;
async function getAccount(publicKey) {
  if (!cachedAccount) {
    cachedAccount = await server.getAccount(publicKey);
  }
  return cachedAccount;
}

// ✅ Batch read operations where possible
// Instead of calling get_dao 10 times, call get_all_daos once

// ✅ Use proper timeouts
.setTimeout(300) // 5 minutes is reasonable for most operations
```

### Error Messages

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// USER-FRIENDLY ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function handleContractError(error) {
  const message = error.message || String(error);
  
  // Map contract errors to user-friendly messages
  const errorMap = {
    'DAO not found': 'This DAO does not exist.',
    'already voted': 'You have already voted on this DAO.',
    'deadline passed': 'Voting period has ended for this DAO.',
    'Only admin': 'You do not have permission for this action.',
    'insufficient balance': 'You do not have enough XLM.',
  };
  
  for (const [key, friendly] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }
  
  return 'An error occurred. Please try again.';
}
```

---

## 18. Quick Reference

### Import Cheatsheet

```javascript
import {
  // Core
  Keypair,              // Key management
  TransactionBuilder,   // Build transactions
  Networks,             // Network passphrases
  BASE_FEE,             // Default fee (100 stroops)
  
  // Operations
  Operation,            // Transaction operations
  Asset,                // Stellar assets
  Memo,                 // Transaction memos
  
  // Soroban
  Contract,             // Contract interaction
  Address,              // Stellar addresses
  
  // Type Conversion
  nativeToScVal,        // JS → ScVal
  scValToNative,        // ScVal → JS
  xdr,                  // XDR types
  
  // Servers
  rpc,                  // rpc.Server for Soroban
  Horizon,              // Horizon.Server for classic
} from '@stellar/stellar-sdk';

import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';
```

### Common Patterns

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// PATTERN: Build → Simulate → Sign → Submit → Wait
// ═══════════════════════════════════════════════════════════════════════════

// 1. Build
let tx = new TransactionBuilder(account, { fee, networkPassphrase })
  .addOperation(operation)
  .setTimeout(300)
  .build();

// 2. Simulate
const sim = await server.simulateTransaction(tx);

// 3. Prepare + Sign
const prepared = rpc.assembleTransaction(tx, sim).build();
prepared.sign(keypair);

// 4. Submit
const response = await server.sendTransaction(prepared);

// 5. Wait
let result = await server.getTransaction(response.hash);
while (result.status === 'NOT_FOUND') {
  await sleep(2000);
  result = await server.getTransaction(response.hash);
}
```

### Network URLs

```javascript
const NETWORKS = {
  TESTNET: {
    rpc: 'https://soroban-testnet.stellar.org',
    horizon: 'https://horizon-testnet.stellar.org',
    passphrase: Networks.TESTNET,
    friendbot: 'https://friendbot.stellar.org'
  },
  MAINNET: {
    rpc: 'https://mainnet.sorobanrpc.com',
    horizon: 'https://horizon.stellar.org',
    passphrase: Networks.PUBLIC,
    friendbot: null  // No friendbot on mainnet!
  }
};
```

---

## 📚 Additional Resources

- **Official Docs**: https://developers.stellar.org
- **SDK GitHub**: https://github.com/stellar/js-stellar-sdk
- **API Reference**: https://stellar.github.io/js-stellar-sdk/
- **Stellar Lab**: https://laboratory.stellar.org
- **Freighter Docs**: https://docs.freighter.app

---

## 🎯 Your Learning Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STELLAR SDK MASTERY PATH                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LEVEL 1 - BASICS (You are here! ✅)                                       │
│  ├── Keypair generation                                                    │
│  ├── Network connection                                                    │
│  └── Basic transactions                                                    │
│                                                                             │
│  LEVEL 2 - SOROBAN                                                         │
│  ├── Contract invocation                                                   │
│  ├── ScVal conversions                                                     │
│  └── Simulation                                                            │
│                                                                             │
│  LEVEL 3 - DAPP DEVELOPMENT                                                │
│  ├── Freighter integration                                                 │
│  ├── Event handling                                                        │
│  └── Error handling                                                        │
│                                                                             │
│  LEVEL 4 - PRODUCTION                                                      │
│  ├── Security best practices                                               │
│  ├── Performance optimization                                              │
│  └── Mainnet deployment                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Happy Building on Stellar! 🚀**
