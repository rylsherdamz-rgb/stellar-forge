#!/usr/bin/env bash
# deploy-contract.sh — Build, deploy, and track a Stellar smart contract
#
# Usage:
#   ./scripts/deploy-contract.sh <wasm-path> <contract-name> [network]
#
# If deploy file data/deployments/<network>.json does not exist (first deploy),
# auto-deploys without prompting. Otherwise asks for confirmation.
#
# Updates .env and data/deployments/<network>.json with the new contract ID.

set -euo pipefail

WASM_PATH="${1:?Usage: deploy-contract.sh <wasm-path> <contract-name> [network]}"
CONTRACT_NAME="${2:?Usage: deploy-contract.sh <wasm-path> <contract-name> [network]}"
NETWORK="${3:-testnet}"
DEPLOY_FILE="data/deployments/${NETWORK}.json"
ENV_FILE=".env"
SOURCE_ACCOUNT="${STELLAR_DEPLOYER:-deployer}"

if [ ! -f "$WASM_PATH" ]; then
  echo "✗ WASM not found: $WASM_PATH"
  echo "  Run 'cargo build --release --target wasm32v1-none' first."
  exit 1
fi

# Run tests first — only deploy if all pass
if [ -f "Cargo.toml" ]; then
  echo "→ Running cargo test... (gating deploy on all tests passing)"
  if ! cargo test 2>&1; then
    echo "✗ Tests failed — deploy aborted. Fix tests and try again."
    exit 1
  fi
  echo "  ✓ All tests passed"
fi

# Check first-deploy (no prior deployment file)
if [ ! -f "$DEPLOY_FILE" ]; then
  echo "→ First deploy on ${NETWORK} — auto-deploying ${CONTRACT_NAME}..."
else
  echo "→ Prior ${NETWORK} deployment found at ${DEPLOY_FILE}"
  echo -n "? Deploy ${CONTRACT_NAME} to ${NETWORK}? [Y/n] "
  read -r REPLY
  if [[ "$REPLY" =~ ^[Nn] ]]; then
    echo "  ↪ Skipped."
    exit 0
  fi
fi

# Deploy
echo "  Deploying ${CONTRACT_NAME} to ${NETWORK}..."
OUTPUT=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$NETWORK" 2>&1)

# Parse contract ID from output (last line = contract ID)
CONTRACT_ID=$(echo "$OUTPUT" | tail -1 | tr -d '[:space:]')

if [ -z "$CONTRACT_ID" ] || [ "${#CONTRACT_ID}" -lt 10 ]; then
  echo "✗ Deploy failed. Output:"
  echo "$OUTPUT"
  exit 1
fi

echo "  ✓ Deployed as ${CONTRACT_ID}"

# Record deployment
mkdir -p "$(dirname "$DEPLOY_FILE")"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
WASM_HASH=$(sha256sum "$WASM_PATH" | cut -d' ' -f1)

if [ -f "$DEPLOY_FILE" ]; then
  # Append to existing
  # shellcheck disable=SC2094
  tmp=$(mktemp)
  jq --arg name "$CONTRACT_NAME" \
     --arg id "$CONTRACT_ID" \
     --arg hash "$WASM_HASH" \
     --arg ts "$TIMESTAMP" \
     '.contracts += [{"name": $name, "contract_id": $id, "wasm_hash": $hash, "deployed_at": $ts}]' \
     "$DEPLOY_FILE" > "$tmp" && mv "$tmp" "$DEPLOY_FILE"
else
  cat > "$DEPLOY_FILE" <<JSON
{
  "network": "${NETWORK}",
  "deployer": "${SOURCE_ACCOUNT}",
  "contracts": [
    {
      "name": "${CONTRACT_NAME}",
      "contract_id": "${CONTRACT_ID}",
      "wasm_hash": "${WASM_HASH}",
      "deployed_at": "${TIMESTAMP}"
    }
  ]
}
JSON
fi

echo "  ✓ Recorded to ${DEPLOY_FILE}"

# Update .env with contract address
ENV_VAR="NEXT_PUBLIC_${CONTRACT_NAME^^}_CONTRACT_ID"
if grep -q "^${ENV_VAR}=" "$ENV_FILE" 2>/dev/null; then
  # Update existing
  sed -i.bak "s|^${ENV_VAR}=.*|${ENV_VAR}=${CONTRACT_ID}|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
else
  # Append
  echo "${ENV_VAR}=${CONTRACT_ID}" >> "$ENV_FILE"
fi

echo "  ✓ Updated ${ENV_FILE}: ${ENV_VAR}=${CONTRACT_ID}"
echo ""
echo "  Done."
