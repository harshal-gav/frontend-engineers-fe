import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about FrontendEngineers.com, the premier destination for remote frontend and fullstack JavaScript developer jobs.",
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Frontend Engineers",
    "url": "https://frontendengineers.com",
    "logo": "https://frontendengineers.com/icon.png",
    "description": "The premier job board for remote frontend and fullstack JavaScript developers."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white text-gray-700 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-[#2563eb] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <div className="prose prose-lg max-w-none prose-p:text-gray-700 prose-headings:text-gray-900">
          <h1 className="text-4xl font-bold mb-6">About FrontendEngineers.com</h1>
          <p className="text-gray-700 leading-relaxed mb-4">
            FrontendEngineers.com is the #1 job board dedicated exclusively to 
            Frontend and Fullstack JavaScript Developers. Our mission is to connect top-tier 
            engineering talent with the best remote opportunities worldwide. Unlike generic job boards, 
            we focus 100% on frontend, React, Vue, Angular, Node.js, and Fullstack JavaScript roles.
          </p>
          <p className="mb-4 text-gray-600 leading-relaxed">
            We specialize in providing <strong>fully remote frontend and JavaScript developer jobs</strong> that allow you to <strong>work from anywhere</strong>. We manually vet and verify listings to bring you the best <strong>remote react developer jobs</strong>, <strong>remote vue developer jobs</strong>, and <strong>remote angular developer jobs</strong>. Say goodbye to irrelevant listings and focus exclusively on high-quality <strong>remote UI/UX engineer jobs</strong> and <strong>remote typescript jobs</strong>.
          </p>
          <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">Why choose our remote tech job board?</h2>
          <p className="mb-8 text-gray-600 leading-relaxed">
            Finding genuine <strong>async remote frontend and JavaScript jobs</strong> and legitimate <strong>remote frontend and JavaScript contract jobs</strong> can be challenging. We save you time by filtering out hybrid roles disguised as remote, so you can focus on what you do best: building amazing user interfaces. If you're wondering <em>how to find remote frontend and JavaScript developer jobs</em> with no hassle, you're in the right place. Start browsing our curated <strong>work from anywhere frontend and JavaScript jobs</strong> today.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
