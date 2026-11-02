import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

const LEGAL_METADATA: Record<string, { title: string; description: string }> = {
  "privacy-policy": {
    title: "Privacy Policy – FrontendEngineers.com Legal Center",
    description: "Read the official Privacy Policy for FrontendEngineers.com. Learn how we handle your personal data, job application information, cookies, and privacy rights.",
  },
  "terms-of-service": {
    title: "Terms of Service – FrontendEngineers.com Legal Terms",
    description: "Review the Terms of Service for using FrontendEngineers.com. Understand user rights, employer job posting rules, Pro membership billing, and platform terms.",
  },
  "refund-policy": {
    title: "Refund Policy – FrontendEngineers.com Billing Support",
    description: "Review the refund and cancellation policy for FrontendEngineers.com Pro memberships and employer job postings. Clear terms, instant access, and hassle-free.",
  },
  "disclaimer": {
    title: "Disclaimer – FrontendEngineers.com Job Board Notices",
    description: "Read the legal disclaimer for FrontendEngineers.com. Learn about third-party remote job listings, company representations, and external application policies.",
  },
};

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const meta = LEGAL_METADATA[slug] || {
    title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} – FrontendEngineers.com`,
    description: "Legal policies, terms, and regulatory compliance documents for FrontendEngineers.com, the dedicated remote frontend developer job portal.",
  };

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/legal/${slug}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://www.frontendengineers.com/legal/${slug}`,
      siteName: "FrontendEngineers.com",
      type: "website",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/og-image.jpg"],
    },
  };
}

import CancelMembershipButton from "@/components/CancelMembershipButton";

export default async function LegalPage({ params }: LegalPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const contentPath = path.join(process.cwd(), "content", "legal", `${slug}.md`);

  if (!fs.existsSync(contentPath)) {
    notFound();
  }

  const content = fs.readFileSync(contentPath, "utf-8");

  return (
    <div className="min-h-screen bg-white text-gray-700 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#2563eb] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <div className="prose prose-base md:prose-lg max-w-none break-words overflow-hidden w-full prose-p:text-gray-700 prose-headings:text-gray-900 prose-a:text-[#2563eb] prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {slug === "refund-policy" && <CancelMembershipButton />}
      </div>
    </div>
  );
}

// Generate static params for all legal pages so they are built statically
export function generateStaticParams() {
  const legalDir = path.join(process.cwd(), "content", "legal");
  
  if (!fs.existsSync(legalDir)) {
    return [];
  }

  const files = fs.readdirSync(legalDir);
  
  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(".md", ""),
    }));
}
