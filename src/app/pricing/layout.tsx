import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Membership Pricing — Early Access to Remote Frontend Jobs",
  description: "Get 7-day early access to remote frontend developer jobs on FrontendEngineers.com. Pro members apply before the crowd for React, TypeScript, Vue, and Angular positions.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pro Membership — FrontendEngineers.com",
    description: "Get 7-day early access to remote frontend developer jobs. Apply before the crowd for React, TypeScript, Vue, and Angular positions.",
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
