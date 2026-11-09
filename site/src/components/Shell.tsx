"use client";

import { WalletProvider, useWallet } from "./WalletProvider";
import Nav from "./Nav";
import { CONFIG, explorerContract } from "@/lib/config";
import "./marketplace.css";

function WalletError() {
  const { error } = useWallet();
  if (!error) return null;
  return (
    <div className="container">
      <div className="notice err" role="alert">{error}</div>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <div className="mkt">
        <Nav />
        <WalletError />
        <main>{children}</main>
        <footer className="mkt-footer">
          <div className="mkt-container">
            <span>Stellar Forge · MIT · Soroban bounty escrow on Stellar {CONFIG.network}</span>
            <span className="footer-links">
              <a href={explorerContract(CONFIG.contractId)} target="_blank" rel="noreferrer">Escrow contract</a>
              <a href="https://github.com/rylsherdamz-rgb/stellar-forge" target="_blank" rel="noreferrer">GitHub</a>
            </span>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
