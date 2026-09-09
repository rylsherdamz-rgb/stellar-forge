import Shell from "@/components/Shell";

// Applies the marketplace chrome (wallet nav + footer) to /bounties and /create
// only. The marketing landing page at "/" keeps its own layout untouched.
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}
