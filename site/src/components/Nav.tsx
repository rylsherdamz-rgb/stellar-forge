"use client";

import Link from "next/link";
import { useWallet } from "./WalletProvider";

function short(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export default function Nav() {
  const { address, connect, disconnect, connecting, restoring, error } = useWallet();
  return (
    <nav>
      <div className="container">
        <Link href="/" className="brand">
          Stellar <em>Forge</em>
        </Link>
        <div className="links">
          <Link href="/bounties">Bounties</Link>
          <Link href="/create">Create</Link>
          <Link href="/dashboard">Dashboard</Link>
          {address ? (
            <button
              className="btn btn-secondary wallet-btn"
              onClick={disconnect}
              title={`Signed in as ${address}. Click to disconnect.`}
            >
              {short(address)} · Disconnect
            </button>
          ) : (
            <button
              className="btn btn-primary wallet-btn"
              onClick={connect}
              disabled={connecting || restoring}
              title={error ?? undefined}
            >
              {connecting ? "Check your wallet…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="container">
          <div className="notice err" role="alert" style={{ margin: "8px 0 0" }}>{error}</div>
        </div>
      )}
    </nav>
  );
}
