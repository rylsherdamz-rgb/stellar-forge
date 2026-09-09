import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Stellar Forge — Developer Bounty & Escrow Marketplace",
  description:
    "Fund software work in XLM held in a Soroban escrow contract, released only when a GitHub-verified submission is approved. The blockchain controls the money, not the frontend.",
  keywords: [
    "stellar", "soroban", "bounty", "escrow", "marketplace", "xlm",
    "smart contracts", "stellar wallets kit", "github", "web3",
  ],
  openGraph: {
    title: "Stellar Forge",
    description:
      "A Stellar-native developer bounty & escrow marketplace. Fund software work, held in a Soroban contract, settled on Stellar.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
