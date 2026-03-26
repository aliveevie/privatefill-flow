# PrivateFill

PrivateFill now includes a Foundry-based contract workspace alongside the existing React UI.

## Contracts

- `contracts/PrivateFill.sol`: encrypted order entry, matching, and settlement publishing
- `contracts/OracleGuard.sol`: Chainlink price freshness and price-band enforcement
- `contracts/SettlementVault.sol`: escrowed token balances and protocol-controlled settlement transfers
- `script/DeployPrivateFill.s.sol`: Foundry deployment script
- `test/foundry/`: local tests with CoFHE task-manager mocks

## Install deps

If `lib/` is not present on your machine, install the Solidity dependencies with:

```bash
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std FhenixProtocol/cofhe-contracts --no-git
```

## Build and test

```bash
npm run contracts:build
npm run contracts:test
```

## Export ABIs for the frontend

```bash
npm run contracts:export-abi
```

This writes ABI JSON files into `src/lib/contracts/abi/`.

## Deploy

Create a `.env` from `.env.example`, set:

```bash
PRIVATE_KEY=
ARB_SEPOLIA_RPC_URL=
BASE_SEPOLIA_RPC_URL=
BASE_TOKEN=
QUOTE_TOKEN=
PRICE_FEED=
```

Arbitrum Sepolia:

```bash
source .env && npm run contracts:deploy:arb
```

Base Sepolia:

```bash
source .env && npm run contracts:deploy:base
```

The deployment script deploys `SettlementVault`, deploys `PrivateFill`, then wires the vault protocol to the deployed `PrivateFill` instance.
