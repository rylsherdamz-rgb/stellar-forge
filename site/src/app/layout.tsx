import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellar Agentic Framework — Build Stellar dApps with AI Agents",
  description:
    "An open-source reference implementation for AI-assisted Stellar development. Install the Skill, scaffold a project with the create-stellar-agentic CLI, and build Soroban contracts + Stellar SDK apps verified by structured evals.",
  keywords: [
    "stellar", "soroban", "smart contracts", "dapp", "ai agents",
    "claude code", "open code", "x402", "stellar wallets kit", "blockchain",
    "create-stellar-agentic", "stellar forge",
  ],
  openGraph: {
    title: "Stellar Agentic Framework",
    description: "Installable Skill + scaffolding CLI for AI-assisted Stellar development, validated on Stellar Testnet.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
