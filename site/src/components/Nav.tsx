"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "./WalletProvider";
import { shortAddr } from "@/lib/lifecycle";
import { CONFIG } from "@/lib/config";

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="6" r="2.4" fill="currentColor" />
      <circle cx="19" cy="6" r="2.4" fill="currentColor" opacity=".7" />
      <circle cx="12" cy="18" r="2.8" fill="currentColor" />
      <path d="M5 6 12 18 19 6" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".55" />
    </svg>
  );
}

export default function Nav() {
  const { address, connect, disconnect, connecting } = useWallet();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (path === href || path.startsWith(`${href}/`) ? "active" : undefined);

  return (
    <nav>
      <div className="container">
        <Link href="/" className="brand">
          <Mark /> Stellar <em>Forge</em>
        </Link>
        <div className="links">
          <Link href="/bounties" className={active("/bounties")}>Bounties</Link>
          <Link href="/create" className={active("/create")}>Create</Link>
          <span className="net-chip" title={`Contract ${CONFIG.contractId}`}>
            <span className="live" /> {CONFIG.network}
          </span>
          {address ? (
            <div className="wallet-menu">
              <button className="btn btn-secondary wallet-btn mono" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                {shortAddr(address)}
              </button>
              {open && (
                <div className="menu" role="menu">
                  <button
                    role="menuitem"
                    onClick={() => {
                      navigator.clipboard?.writeText(address);
                      setOpen(false);
                    }}
                  >
                    Copy address
                  </button>
                  <a role="menuitem" href={`${CONFIG.explorerBase}/account/${address}`} target="_blank" rel="noreferrer">
                    View on explorer
                  </a>
                  <button
                    role="menuitem"
                    onClick={() => {
                      disconnect();
                      setOpen(false);
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary wallet-btn" onClick={connect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
