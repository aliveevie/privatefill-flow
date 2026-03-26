#!/usr/bin/env bash
set -euo pipefail

# Post-deploy script: extracts deployed addresses from Forge broadcast
# and updates src/lib/contracts/addresses.ts
#
# Usage: ./script/post-deploy.sh <chain-id>
# Example: ./script/post-deploy.sh 421614   (Arbitrum Sepolia)
#          ./script/post-deploy.sh 84532    (Base Sepolia)

CHAIN_ID="${1:?Usage: $0 <chain-id>}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ADDRESSES_FILE="$ROOT_DIR/src/lib/contracts/addresses.ts"

# Find the latest broadcast file
BROADCAST_DIR="$ROOT_DIR/broadcast/DeployPrivateFill.s.sol/$CHAIN_ID"
if [[ ! -d "$BROADCAST_DIR" ]]; then
  echo "No broadcast directory found at $BROADCAST_DIR"
  echo "Deploy first with: source .env && npm run contracts:deploy:arb"
  exit 1
fi

RUN_FILE=$(ls -t "$BROADCAST_DIR"/run-latest.json 2>/dev/null | head -1)
if [[ -z "$RUN_FILE" ]]; then
  echo "No run-latest.json found in $BROADCAST_DIR"
  exit 1
fi

echo "Reading deployment from: $RUN_FILE"

# Extract contract addresses from the broadcast
VAULT_ADDR=$(jq -r '.transactions[] | select(.contractName == "SettlementVault") | .contractAddress' "$RUN_FILE" | head -1)
FILL_ADDR=$(jq -r '.transactions[] | select(.contractName == "PrivateFill") | .contractAddress' "$RUN_FILE" | head -1)

if [[ -z "$VAULT_ADDR" || -z "$FILL_ADDR" ]]; then
  echo "Could not find deployed addresses in broadcast file"
  exit 1
fi

echo "SettlementVault: $VAULT_ADDR"
echo "PrivateFill:     $FILL_ADDR"
echo "BaseToken:       $BASE_TOKEN"
echo "QuoteToken:      $QUOTE_TOKEN"
echo "PriceFeed:       $PRICE_FEED"

# Determine which chain section to update
if [[ "$CHAIN_ID" == "421614" ]]; then
  SECTION="ARB_SEPOLIA"
elif [[ "$CHAIN_ID" == "84532" ]]; then
  SECTION="BASE_SEPOLIA"
else
  echo "Unknown chain ID: $CHAIN_ID"
  exit 1
fi

# Update the addresses file using sed
sed -i.bak "/$SECTION/,/};/{
  s|privateFill: \"0x[0-9a-fA-F]*\"|privateFill: \"$FILL_ADDR\"|
  s|settlementVault: \"0x[0-9a-fA-F]*\"|settlementVault: \"$VAULT_ADDR\"|
  s|baseToken: \"0x[0-9a-fA-F]*\"|baseToken: \"$BASE_TOKEN\"|
  s|quoteToken: \"0x[0-9a-fA-F]*\"|quoteToken: \"$QUOTE_TOKEN\"|
  s|priceFeed: \"0x[0-9a-fA-F]*\"|priceFeed: \"$PRICE_FEED\"|
}" "$ADDRESSES_FILE"

rm -f "${ADDRESSES_FILE}.bak"

echo ""
echo "Updated $ADDRESSES_FILE with $SECTION deployment addresses"
echo "Run 'npm run build' to rebuild the frontend with new addresses"
