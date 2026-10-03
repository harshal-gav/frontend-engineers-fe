import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Membership Pricing — Get Hired Faster",
  description: "Skip the noise and get hired faster. Unlock full descriptions and 1-click apply links for exclusive remote frontend jobs with less competition.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pro Membership — FrontendEngineers.com",
    description: "Skip the noise and get hired faster. Unlock full descriptions and 1-click apply links for exclusive remote frontend jobs with less competition.",
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
