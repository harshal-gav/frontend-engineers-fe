import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about FrontendEngineers.com, the premier destination for remote frontend developer jobs.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-[#00ffcc] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <div className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white">
          <h1 className="text-4xl font-bold mb-6">About FrontendEngineers.com</h1>
          <p className="mb-4 text-gray-400 leading-relaxed">
            Welcome to the premier destination for <strong>remote frontend developer jobs</strong>. Whether you're a junior developer looking for <strong>remote frontend jobs for freshers</strong> or an experienced professional seeking <strong>senior remote frontend developer jobs</strong>, our highly curated job board connects you with top remote tech companies hiring frontend talent globally.
          </p>
          <p className="mb-4 text-gray-400 leading-relaxed">
            We specialize in providing <strong>fully remote developer jobs</strong> that allow you to <strong>work from anywhere</strong>. We manually vet and verify listings to bring you the best <strong>remote react developer jobs</strong>, <strong>remote vue developer jobs</strong>, and <strong>remote angular developer jobs</strong>. Say goodbye to irrelevant listings and focus exclusively on high-quality <strong>remote UI/UX engineer jobs</strong> and <strong>remote typescript jobs</strong>.
          </p>
          <h2 className="text-2xl font-semibold mt-10 mb-4 text-white">Why choose our remote tech job board?</h2>
          <p className="mb-8 text-gray-400 leading-relaxed">
            Finding genuine <strong>async remote frontend jobs</strong> and legitimate <strong>remote frontend contract jobs</strong> can be challenging. We save you time by filtering out hybrid roles disguised as remote, so you can focus on what you do best: building amazing user interfaces. If you're wondering <em>how to find remote frontend developer jobs</em> with no hassle, you're in the right place. Start browsing our curated <strong>work from anywhere frontend jobs</strong> today.
          </p>
        </div>
      </div>
    </div>
  );
}
