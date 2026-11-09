import Shell from "@/components/Shell";

// One shell (wallet provider + nav + footer) for every page, so the connected
// wallet survives client-side navigation.
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}
