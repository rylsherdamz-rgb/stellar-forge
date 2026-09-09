import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Stellar Forge — Bounty & Escrow Marketplace",
  description:
    "Fund software work in XLM held in a Soroban escrow contract, released only when a GitHub-verified submission is approved.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
