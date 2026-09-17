import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const title = resolvedParams.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${title} | FrontendEngineers.com`,
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
