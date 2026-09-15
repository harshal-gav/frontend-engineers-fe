import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Frontend Developer Job | Hire Frontend Engineers",
  description: "Post your remote frontend developer job on FrontendEngineers.com and reach a targeted audience of qualified React, TypeScript, Vue, Angular, and JavaScript engineers. Start hiring today.",
  alternates: {
    canonical: "/employers/pricing",
  },
  openGraph: {
    title: "Post a Frontend Developer Job | FrontendEngineers.com",
    description: "Post your remote frontend developer job and reach thousands of qualified frontend engineers. React, TypeScript, Vue, Angular, and JavaScript specialists.",
    type: "website",
    url: "https://frontendengineers.com/employers/pricing",
  },
};

export default function EmployerPricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
