"use client";

import { WalletProvider } from "./WalletProvider";
import Nav from "./Nav";
import "./marketplace.css";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <div className="mkt">
        <Nav />
        <main>{children}</main>
        <footer className="mkt-footer">
          <div className="mkt-container">
            <span>Stellar Forge · MIT · Soroban bounty escrow on Stellar Testnet</span>
            <a href="https://github.com/rylsherdamz-rgb/stellar-forge">GitHub</a>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
