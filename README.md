# PrivateFill

PrivateFill is a privacy-preserving dark-pool trading prototype built for encrypted order submission, oracle-constrained matching, and escrow-based settlement on EVM testnets.

Live App: https://privatefill-flow.vercel.app/  
Demo Video: https://youtu.be/0ewscDISP_g

## Overview

PrivateFill is designed to reduce intent leakage in on-chain trading. Instead of exposing user size and pricing strategy in the mempool, the protocol accepts encrypted order parameters, validates settlement pricing against a Chainlink reference feed, and only reveals the final fill needed for settlement.

This repository includes:

- a React frontend for submitting orders, viewing orders, fills, and vault balances
- Foundry contracts for order entry, matching, oracle validation, and settlement
- deployment and ABI export scripts for keeping the frontend in sync with deployed contracts
- Foundry tests with local mocks for escrow, oracle, and CoFHE task handling

## Core Capabilities

- Encrypted order flow: traders submit encrypted amount and price inputs to the protocol
- Oracle-guarded matching: settlement prices are checked against a Chainlink feed and an allowed price band
- Escrowed settlement: token balances are held in a dedicated vault and transferred only during protocol settlement
- Live interface: the frontend surfaces protocol stats, order activity, settlement history, and vault interactions
- Multi-network deployment flow: deployment scripts support Arbitrum Sepolia and Base Sepolia

## Architecture

### Frontend

The frontend is a Vite + React application with wagmi and viem for wallet and contract integration. It includes:

- order submission
- wallet-aware order history
- fill history from contract events
- protocol stats from on-chain reads
- a settlement vault deposit and withdrawal panel

### Contracts

- `contracts/PrivateFill.sol`: encrypted order intake, matching, fill publication, and settlement logic
- `contracts/OracleGuard.sol`: Chainlink freshness and price-band enforcement
- `contracts/SettlementVault.sol`: escrow ledger for trader balances and protocol-driven transfers
- `contracts/interfaces/IPrivateFill.sol`: protocol interface and event definitions

### Tooling

- `script/DeployPrivateFill.s.sol`: deploys the vault and protocol, then wires protocol permissions
- `script/export-abis.sh`: exports compiled ABIs into the frontend contract directory
- `script/post-deploy.sh`: updates frontend address mappings from the latest Forge broadcast output

## Important Implementation Note

The current frontend integration is structured for demo and testnet workflows. The contract hooks currently send placeholder encrypted input payloads so the full client-side CoFHE encryption experience can be demonstrated in development. A production deployment should replace that path with real client-side encryption using the intended Fhenix tooling.

## Repository Structure

```text
.
├── contracts/               # Solidity contracts
├── script/                  # Deployment and ABI export scripts
├── test/foundry/            # Foundry tests and mocks
├── src/components/          # UI components
├── src/hooks/               # Frontend hooks for protocol interaction
└── src/lib/contracts/       # Frontend contract config, ABI, and addresses
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Foundry
- `jq` for ABI export and post-deploy helpers

### Install Dependencies

Install frontend dependencies:

```bash
npm install
```

If `lib/` is not present, install Solidity dependencies:

```bash
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std FhenixProtocol/cofhe-contracts --no-git
```

### Environment Setup

Create a local environment file from the example:

```bash
cp .env.example .env
```

Set the following values:

```bash
PRIVATE_KEY=
ARB_SEPOLIA_RPC_URL=
BASE_SEPOLIA_RPC_URL=
BASE_TOKEN=
QUOTE_TOKEN=
PRICE_FEED=
```

## Local Development

Run the frontend:

```bash
npm run dev
```

Lint the app:

```bash
npm run lint
```

Run frontend tests:

```bash
npm run test
```

Build the contracts:

```bash
npm run contracts:build
```

Run Foundry tests:

```bash
npm run contracts:test
```

Export ABIs for the frontend:

```bash
npm run contracts:export-abi
```

This writes ABI files into `src/lib/contracts/abi/`.

## Deployment

Deploy to Arbitrum Sepolia:

```bash
source .env && npm run contracts:deploy:arb
```

Deploy to Base Sepolia:

```bash
source .env && npm run contracts:deploy:base
```

The deployment flow:

1. deploys `SettlementVault`
2. deploys `PrivateFill`
3. assigns the protocol role on the vault
4. updates frontend addresses from the latest broadcast output

## Testing

The Foundry test suite covers:

- encrypted order submission metadata
- match execution and fill publication
- escrow settlement transfers
- oracle price-band rejection paths
- cancellation protection for matched orders

## Networks

PrivateFill is currently configured for:

- Arbitrum Sepolia
- Base Sepolia

## License

This project is provided for demo and evaluation purposes unless a separate license is specified by the repository owner.
