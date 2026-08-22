import "dotenv/config";
import express from "express";
import { horizon, rpc, config } from "./services/stellar.js";
import { x402Middleware } from "./middleware/x402.js";

const app = express();
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", network: process.env.STELLAR_NETWORK || "testnet" });
});

// Account balance lookup
app.get("/api/accounts/:address/balance", async (req, res) => {
  try {
    const account = await horizon.loadAccount(req.params.address);
    const native = account.balances.find((b: any) => b.asset_type === "native");
    res.json({ address: req.params.address, balance: native?.balance || "0" });
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.json({ address: req.params.address, balance: "0" });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// Contract state query via RPC
app.post("/api/contracts/:id/query", async (req, res) => {
  try {
    const { method, args } = req.body;
    const account = await rpc.getAccount(req.params.id);
    const sim = await rpc.simulateTransaction({} as any);
    res.json({ result: sim });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// x402-paid endpoint
app.get("/api/paid/data", x402Middleware, (_req, res) => {
  res.json({
    result: "paid content",
    price: "$0.001 USDC",
    timestamp: Date.now(),
  });
});

// Submit transaction (signed XDR)
app.post("/api/transactions", async (req, res) => {
  try {
    const { signedXdr } = req.body;
    const tx = (await import("@stellar/stellar-sdk")).TransactionBuilder.fromXDR(
      signedXdr,
      config.networkPassphrase
    );
    const result = await rpc.sendTransaction(tx as any);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = parseInt(process.env.PORT || "3001");
app.listen(PORT, () => {
  console.log(`Stellar backend running on :${PORT} (${config.networkPassphrase})`);
});
