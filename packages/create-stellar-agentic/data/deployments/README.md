# Contract Deployments

Tracks deployed contracts per network. Each network has a JSON file
recording contract IDs, WASM hashes, and deploy timestamps.

## Files

- `testnet.json` — deployed contracts on Stellar testnet
- `mainnet.json` — deployed contracts on Stellar mainnet (requires explicit opt-in)
- `local.json` — deployed contracts on local/standalone network

## Format

```json
{
  "network": "testnet",
  "deployer": "GA...",
  "contracts": [
    {
      "name": "hello_world",
      "contract_id": "CA...",
      "wasm_hash": "...",
      "deployed_at": "2026-07-29T12:00:00Z"
    }
  ]
}
```

## Auto-Deploy Rule

If no deploy file exists for the target network, the contract agent
auto-deploys without prompting (first-time setup). On subsequent
deploys, the agent asks for confirmation.
