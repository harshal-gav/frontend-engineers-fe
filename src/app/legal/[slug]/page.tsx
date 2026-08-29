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
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#00ffcc] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <div className="prose prose-invert prose-lg max-w-none prose-a:text-[#00ffcc] prose-a:no-underline hover:prose-a:underline">
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
