import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Membership Pricing – Frontend Developer Job Portal",
  description: "Unlock exclusive 1-click apply links, verified community referrals, and daily alerts. Land your remote frontend engineering role faster for just $9 per month.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pro Membership Pricing – Frontend Developer Job Portal",
    description: "Unlock exclusive 1-click apply links, verified community referrals, and daily alerts. Land your remote frontend engineering role faster for just $9 per month.",
    type: "website",
    url: "https://www.frontendengineers.com/pricing",
    siteName: "FrontendEngineers.com",
    images: [{ url: "/og-image.jpg", width: 1456, height: 816, alt: "FrontendEngineers.com Pro Pricing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Membership Pricing – Frontend Developer Job Portal",
    description: "Unlock exclusive 1-click apply links, verified community referrals, and daily alerts. Land your remote frontend engineering role faster for just $9 per month.",
    images: ["/og-image.jpg"],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
