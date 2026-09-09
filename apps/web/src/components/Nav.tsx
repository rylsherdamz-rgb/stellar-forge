"use client";

import Link from "next/link";
import { useWallet } from "./WalletProvider";

function short(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export default function Nav() {
  const { address, connect, connecting } = useWallet();
  return (
    <nav>
      <div className="container">
        <Link href="/" className="brand">
          Stellar <em>Forge</em>
        </Link>
        <div className="links">
          <Link href="/bounties">Bounties</Link>
          <Link href="/create">Create</Link>
          <button className="btn btn-primary" onClick={connect} disabled={connecting}>
            {address ? short(address) : connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </div>
      </div>
    </nav>
  );
}
