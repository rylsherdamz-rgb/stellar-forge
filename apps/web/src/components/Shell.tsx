"use client";

import { WalletProvider } from "./WalletProvider";
import Nav from "./Nav";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <Nav />
      <main>{children}</main>
      <footer>
        <div className="container">
          <span>Stellar Forge · MIT · Soroban bounty escrow on Stellar Testnet</span>
          <a href="https://github.com/rylsherdamz-rgb/stellar-forge">GitHub</a>
        </div>
      </footer>
    </WalletProvider>
  );
}
