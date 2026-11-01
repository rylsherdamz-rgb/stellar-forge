#!/usr/bin/env bash
# deploy-bounty-escrow.sh — Reproducible build, deployment, initialization, and SAC allowlisting
#
# Requirements (Issue #37):
# - Build the release WASM using stellar contract build
# - stellar contract deploy using a named stellar CLI identity (no secrets in repo)
# - initialize(admin) with admin address
# - Allowlist the native XLM SAC (CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC on testnet)
# - Print a JSON snippet suitable for data/deployments/testnet.json
# - Idempotent-safe and fails clearly if identity is missing or unreachable

set -euo pipefail

IDENTITY="${1:-${STELLAR_IDENTITY:-}}"
NETWORK="${2:-testnet}"
MANIFEST_PATH="contracts/bounty-escrow/Cargo.toml"
WASM_PATH="contracts/target/wasm32v1-none/release/bounty_escrow.wasm"
DEPLOY_FILE="data/deployments/${NETWORK}.json"

# Native XLM SAC addresses
NATIVE_XLM_SAC_TESTNET="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
NATIVE_XLM_SAC_MAINNET="CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA"

# 1. Validation: Identity must be provided and registered in stellar keys
if [ -z "$IDENTITY" ]; then
  echo "ERROR: Missing named Stellar CLI identity."
  echo "Usage: ./scripts/deploy-bounty-escrow.sh <identity-name> [network]"
  echo "Example: ./scripts/deploy-bounty-escrow.sh alice testnet"
  exit 1
fi

echo "--> Verifying Stellar CLI identity: ${IDENTITY} on network: ${NETWORK}..."

if ! command -v stellar >/dev/null 2>&1; then
  echo "ERROR: 'stellar' CLI binary is not installed or not in PATH."
  exit 1
fi

ADMIN_ADDRESS=$(stellar keys address "$IDENTITY" 2>/dev/null || true)
if [ -z "$ADMIN_ADDRESS" ]; then
  echo "ERROR: Identity '${IDENTITY}' not found in 'stellar keys list'."
  echo "Generate and fund it first:"
  echo "  stellar keys generate ${IDENTITY} && stellar keys fund ${IDENTITY} --network ${NETWORK}"
  exit 1
fi

echo "    Admin / Deployer address: ${ADMIN_ADDRESS}"

# 2. Build release WASM
echo "--> Building optimized release WASM for bounty-escrow..."
stellar contract build --manifest-path "$MANIFEST_PATH"

if [ ! -f "$WASM_PATH" ]; then
  echo "ERROR: Expected WASM output not found at ${WASM_PATH}."
  exit 1
fi

WASM_HASH=$(sha256sum "$WASM_PATH" | cut -d' ' -f1)
WASM_SIZE=$(wc -c < "$WASM_PATH" | tr -d ' ')
echo "    WASM built: ${WASM_PATH} (${WASM_SIZE} bytes, sha256: ${WASM_HASH})"

# 3. Deploy contract
echo "--> Deploying bounty-escrow to ${NETWORK}..."
DEPLOY_OUTPUT=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$IDENTITY" \
  --network "$NETWORK" 2>&1)

CONTRACT_ID=$(echo "$DEPLOY_OUTPUT" | tail -1 | tr -d '[:space:]')

if [ -z "$CONTRACT_ID" ] || [ "${#CONTRACT_ID}" -lt 10 ]; then
  echo "ERROR: Contract deployment failed. Output:"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "    Contract deployed: ${CONTRACT_ID}"

# 4. Initialize contract
echo "--> Initializing contract with admin: ${ADMIN_ADDRESS}..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- \
  initialize --admin "$ADMIN_ADDRESS"
echo "    Initialization complete."

# 5. Allowlist native XLM SAC
SAC_ADDRESS="$NATIVE_XLM_SAC_TESTNET"
if [ "$NETWORK" = "mainnet" ]; then
  SAC_ADDRESS="$NATIVE_XLM_SAC_MAINNET"
fi

echo "--> Allowlisting native XLM SAC (${SAC_ADDRESS})..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- \
  set_token_allowed --token "$SAC_ADDRESS" --allowed true
echo "    Native XLM SAC allowlisted."

# 6. Generate JSON snippet and display deployment summary
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EXPLORER_URL="https://stellar.expert/explorer/${NETWORK}/contract/${CONTRACT_ID}"

echo ""
echo "=================================================================="
echo "DEPLOYMENT SUCCESSFUL"
echo "=================================================================="
echo "Network:     ${NETWORK}"
echo "Contract ID: ${CONTRACT_ID}"
echo "Admin:       ${ADMIN_ADDRESS}"
echo "Wasm Hash:   ${WASM_HASH}"
echo "Explorer:    ${EXPLORER_URL}"
echo "=================================================================="
echo ""
echo "JSON snippet for ${DEPLOY_FILE}:"

JSON_SNIPPET=$(cat <<EOF
{
  "name": "bounty-escrow",
  "contract_id": "${CONTRACT_ID}",
  "wasm_hash": "${WASM_HASH}",
  "deployed_at": "${TIMESTAMP}",
  "source": "contracts/bounty-escrow",
  "wasm_size_bytes": ${WASM_SIZE},
  "admin": "${ADMIN_ADDRESS}",
  "initialized": true,
  "allowlisted_tokens": [
    "${SAC_ADDRESS}"
  ],
  "explorer": "${EXPLORER_URL}"
}
EOF
)

echo "$JSON_SNIPPET"

# If deploy file exists and jq is available, offer to record or update
if [ -f "$DEPLOY_FILE" ] && command -v jq >/dev/null 2>&1; then
  echo ""
  echo "Updating ${DEPLOY_FILE}..."
  tmp=$(mktemp)
  jq --argjson newContract "$JSON_SNIPPET" \
     '.contracts = [.contracts[] | select(.name != "bounty-escrow")] + [$newContract]' \
     "$DEPLOY_FILE" > "$tmp" && mv "$tmp" "$DEPLOY_FILE"
  echo "Updated ${DEPLOY_FILE} with fresh deployment."
fi
