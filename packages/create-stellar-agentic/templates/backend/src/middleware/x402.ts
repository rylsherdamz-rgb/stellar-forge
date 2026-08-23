import { Request, Response, NextFunction } from "express";

const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
const RECIPIENT = process.env.STELLAR_RECIPIENT;
const OZ_API_KEY = process.env.OZ_API_KEY;

export function x402Middleware(req: Request, res: Response, next: NextFunction) {
  const paymentHeader = req.headers["x-payment"] as string | undefined;

  if (!paymentHeader) {
    // No payment provided — return 402 with payment requirements
    res.status(402).json({
      error: "payment_required",
      scheme: "exact",
      network: NETWORK,
      price: "$0.001",
      payTo: RECIPIENT,
      description: "Pay USDC to access this resource",
    });
    return;
  }

  // Payment header provided — validate via OZ Channels
  if (!OZ_API_KEY) {
    res.status(500).json({ error: "OZ_API_KEY not configured" });
    return;
  }

  // Payment verification would go here
  // For now, pass through to the route handler
  next();
}
