#!/usr/bin/env bash
# deploy-bounty-escrow.sh — test, build, deploy, initialize and configure the
# bounty-escrow contract (v0.2+) on a Stellar network.
#
# Usage:
#   STELLAR_DEPLOYER=<identity> ./scripts/deploy-bounty-escrow.sh [network]
#
# Env (all optional):
#   STELLAR_DEPLOYER     stellar CLI identity that pays + becomes admin (default: deployer)
#   FEE_BPS              platform fee in bps, 0..1000 (default: 0 = no fee)
#   FEE_RECIPIENT        G... address receiving fees (required when FEE_BPS > 0)
#   REVIEW_PERIOD        review window in ledgers, 17280..1555200 (default: contract default, 7 days)
#   DRY_RUN=1            print the commands instead of sending transactions
#
# No secrets live in this repo: signing uses the named identity from
# `stellar keys` (create one with `stellar keys generate <name> --fund`).
# The script prints a JSON entry for data/deployments/<network>.json; the
# deployment registry is kernel-owned, so it is NOT written automatically.

set -euo pipefail

NETWORK="${1:-testnet}"
SOURCE="${STELLAR_DEPLOYER:-deployer}"
FEE_BPS="${FEE_BPS:-0}"
FEE_RECIPIENT="${FEE_RECIPIENT:-}"
REVIEW_PERIOD="${REVIEW_PERIOD:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT/contracts/Cargo.toml"
WASM="$ROOT/contracts/target/wasm32v1-none/release/bounty_escrow.wasm"

die() { echo "✗ $*" >&2; exit 1; }
run() {
  if [ "${DRY_RUN:-0}" = "1" ]; then echo "[dry-run] $*" >&2; echo "DRY_RUN"; else "$@"; fi
}

command -v stellar >/dev/null || die "stellar CLI not found (https://developers.stellar.org/docs/tools/cli)"
command -v cargo   >/dev/null || die "cargo not found"
[[ "$NETWORK" =~ ^(testnet|futurenet|mainnet)$ ]] || die "unknown network: $NETWORK"
if [ "$NETWORK" = "mainnet" ] && [ "${I_UNDERSTAND_MAINNET:-}" != "yes" ]; then
  die "refusing mainnet without I_UNDERSTAND_MAINNET=yes"
fi

ADMIN="$(stellar keys address "$SOURCE" 2>/dev/null)" \
  || die "identity '$SOURCE' not found — run: stellar keys generate $SOURCE --network $NETWORK --fund"

if [[ ! "$FEE_BPS" =~ ^[0-9]+$ ]] || [ "$FEE_BPS" -gt 1000 ]; then die "FEE_BPS must be 0..1000"; fi
if [ "$FEE_BPS" -gt 0 ] && [ -z "$FEE_RECIPIENT" ]; then die "FEE_RECIPIENT required when FEE_BPS > 0"; fi

echo "→ cargo test (deploy is gated on a green suite)"
cargo test --quiet --manifest-path "$MANIFEST" -p bounty-escrow >/dev/null || die "tests failed — aborting"

echo "→ building release wasm"
cargo build --quiet --release --target wasm32v1-none --manifest-path "$MANIFEST" -p bounty-escrow
[ -f "$WASM" ] || die "wasm not produced at $WASM"
WASM_SIZE="$(wc -c < "$WASM" | tr -d ' ')"
WASM_HASH="$(sha256sum "$WASM" | cut -d' ' -f1)"
echo "  wasm: ${WASM_SIZE} B, sha256 ${WASM_HASH}"

echo "→ deploying to ${NETWORK} as ${SOURCE} (${ADMIN})"
CONTRACT_ID="$(run stellar contract deploy --wasm "$WASM" --source "$SOURCE" --network "$NETWORK")"
echo "  contract: ${CONTRACT_ID}"

invoke() { run stellar contract invoke --id "$CONTRACT_ID" --source "$SOURCE" --network "$NETWORK" -- "$@"; }

echo "→ initialize(admin)"
invoke initialize --admin "$ADMIN" >/dev/null

XLM_SAC="$(run stellar contract id asset --asset native --network "$NETWORK")"
echo "→ allowlisting native XLM SAC ${XLM_SAC}"
invoke set_token_allowed --token "$XLM_SAC" --allowed true >/dev/null

if [ "$FEE_BPS" -gt 0 ]; then
  echo "→ set_fee(${FEE_BPS} bps → ${FEE_RECIPIENT})"
  invoke set_fee --fee_bps "$FEE_BPS" --recipient "$FEE_RECIPIENT" >/dev/null
fi
if [ -n "$REVIEW_PERIOD" ]; then
  echo "→ set_review_period(${REVIEW_PERIOD})"
  invoke set_review_period --ledgers "$REVIEW_PERIOD" >/dev/null
fi

VERSION="$(sed -n 's/^version = "\(.*\)"/\1/p' "$ROOT/contracts/bounty-escrow/Cargo.toml" | head -1)"
cat <<JSON

✓ deployed. Add this entry to data/deployments/${NETWORK}.json and set
  BOUNTY_ESCROW_CONTRACT_ID / NEXT_PUBLIC_CONTRACT_ID to the new id:

{
  "name": "bounty-escrow",
  "version": "${VERSION}",
  "contract_id": "${CONTRACT_ID}",
  "wasm_hash": "${WASM_HASH}",
  "wasm_size_bytes": ${WASM_SIZE},
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "source": "contracts/bounty-escrow",
  "admin": "${ADMIN}",
  "allowed_tokens": ["${XLM_SAC}"],
  "fee_bps": ${FEE_BPS},
  "initialized": true
}
JSON
