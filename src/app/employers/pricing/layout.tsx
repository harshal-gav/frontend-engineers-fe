import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Frontend Developer Job | Hire Frontend Engineers",
  description: "Post your remote frontend job on FrontendEngineers.com. Reach thousands of active React, Vue, Angular, and TypeScript engineers looking for remote work.",
  alternates: {
    canonical: "/employers/pricing",
  },
  openGraph: {
    title: "Post a Frontend Developer Job | Hire Frontend Engineers",
    description: "Post your remote frontend job on FrontendEngineers.com. Reach thousands of active React, Vue, Angular, and TypeScript engineers looking for remote work.",
    type: "website",
    url: "https://www.frontendengineers.com/employers/pricing",
    siteName: "FrontendEngineers.com",
    images: [{ url: "/og-image.jpg", width: 1456, height: 816, alt: "Post a Frontend Job on FrontendEngineers.com" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Post a Frontend Developer Job | Hire Frontend Engineers",
    description: "Post your remote frontend job on FrontendEngineers.com. Reach thousands of active React, Vue, Angular, and TypeScript engineers looking for remote work.",
    images: ["/og-image.jpg"],
  },
};

export default function EmployerPricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
