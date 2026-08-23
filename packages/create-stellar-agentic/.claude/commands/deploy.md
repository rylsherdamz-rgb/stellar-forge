# /deploy

Deploy Stellar contracts to a target network.

## Usage
```
/deploy <project-path> [network] [component]
```
- `network`: `testnet` (default), `mainnet`, `local`
- `component`: `contracts` (default), `frontend`, `backend`, `all`

## Steps
### Contracts
1. Build: `stellar contract build --manifest-path <project>/contracts/<name>/Cargo.toml`
2. Generate or use existing key: `stellar keys generate deployer --network <network> --fund` (testnet/local)
3. Deploy: `stellar contract deploy --wasm target/wasm32v1-none/release/<name>.wasm --source-account deployer --network <network>`
4. Record contract IDs in `data/projects/<name>-deployment.md`

### Frontend
1. Build: `npm --prefix <project>/frontend run build`
2. Deploy to Vercel: `npx vercel --prod` (requires VERCEL_TOKEN)
3. Or deploy to Cloudflare Pages/Docker

### Backend
1. Docker build: `docker build -t <name>-backend <project>/backend/`
2. Push and deploy to target (fly.io, railway, etc.)

## Post-Deploy
1. Write deployment record to `data/decisions/<date>-deploy-<network>.md`
2. Run `/graphify <project> --no-viz` to graph the deployed project
3. Report contract IDs and URLs

## Warnings
- **Never** use `--network mainnet` without explicit user confirmation
- **Never** commit deployed contract IDs without user review
- Testnet resets quarterly — always verify before relying on testnet state
