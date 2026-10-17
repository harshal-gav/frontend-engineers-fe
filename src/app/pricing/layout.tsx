import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Membership Pricing - Get Hired Faster",
  description: "Curated remote frontend jobs from 100+ sources. Unlock 1-click apply links, exclusive community referrals, and daily alerts for $9/mo.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pro Membership - FrontendEngineers.com",
    description: "Curated remote frontend jobs from 100+ sources. Unlock 1-click apply links, exclusive community referrals, and daily alerts for $9/mo.",
    type: "website",
    url: "https://www.frontendengineers.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
