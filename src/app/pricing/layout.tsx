import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Membership Pricing — Unlock Full Remote Frontend Job Details",
  description: "Unlock company names, full descriptions, and direct apply links for remote frontend developer jobs on FrontendEngineers.com. Browse titles free, Pro unlocks everything.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pro Membership — FrontendEngineers.com",
    description: "Unlock company names, full descriptions, and direct apply links for remote frontend developer jobs. Browse titles free, unlock everything with Pro.",
    type: "website",
    url: "https://frontendengineers.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
