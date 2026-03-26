#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ABI_DIR="$ROOT_DIR/src/lib/contracts/abi"

mkdir -p "$ABI_DIR"

forge build --root "$ROOT_DIR" >/dev/null

jq '.abi' "$ROOT_DIR/out/PrivateFill.sol/PrivateFill.json" > "$ABI_DIR/PrivateFill.json"
jq '.abi' "$ROOT_DIR/out/SettlementVault.sol/SettlementVault.json" > "$ABI_DIR/SettlementVault.json"
jq '.abi' "$ROOT_DIR/out/OracleGuard.sol/OracleGuard.json" > "$ABI_DIR/OracleGuard.json"

echo "Exported ABIs to $ABI_DIR"

