import Link from "next/link";
import fs from "fs";
import path from "path";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Navigate all pages and job listings on FrontendEngineers.com.",
};

import { loadJobsFromFile } from "@/lib/jobs.server";

export default function HTMLSitemapPage() {
  let jobs: any[] = [];
  try {
    jobs = loadJobsFromFile();
  } catch (e) {
    console.error("Failed to load jobs for sitemap", e);
  }

  return (
    <div className="min-h-screen bg-white text-gray-700 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-[#2563eb] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">HTML Sitemap</h1>

        <div className="flex flex-col gap-12">
          {/* Main Pages */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b border-[#e2e2e6] pb-2">Main Pages</h2>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-[#2563eb]">Home</Link></li>
              <li><Link href="/about" className="hover:text-[#2563eb]">About Us</Link></li>
              <li><Link href="/pricing" className="hover:text-[#2563eb]">Pricing / Pro Membership</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#2563eb]">Log In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-[#2563eb]">Sign Up</Link></li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4 border-b border-[#e2e2e6] pb-2">Legal</h2>
            <ul className="space-y-3">
              <li><Link href="/terms" className="hover:text-[#2563eb]">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#2563eb]">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* All Jobs List */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b border-[#e2e2e6] pb-2">Recent Remote Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {jobs.slice(0, 100).map((job) => (
              <div key={job.id} className="truncate">
                <Link href={`/jobs/${job.slug || job.id}`} className="text-sm hover:text-[#2563eb]">
                  {job.title} at {job.company?.name || "Unknown"}
                </Link>
              </div>
            ))}
          </div>
          {jobs.length > 100 && (
            <p className="mt-4 text-sm text-gray-600 italic">
              Showing the 100 most recent jobs. Please use the search function on the homepage to find more.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
