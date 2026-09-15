import Link from "next/link";
import { Metadata } from "next";

import { loadJobsFromFile } from "@/lib/jobs.server";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Navigate all pages, job listings, and technology categories on FrontendEngineers.com.",
  alternates: {
    canonical: "/sitemap",
  },
};

const CATEGORY_LINKS = [
  { href: "/jobs/remote/react", label: "Remote React Jobs" },
  { href: "/jobs/remote/typescript", label: "Remote TypeScript Jobs" },
  { href: "/jobs/remote/javascript", label: "Remote JavaScript Jobs" },
  { href: "/jobs/remote/vue", label: "Remote Vue Jobs" },
  { href: "/jobs/remote/angular", label: "Remote Angular Jobs" },
  { href: "/jobs/remote/node-js", label: "Remote Node.js Jobs" },
  { href: "/jobs/remote/fullstack", label: "Remote Fullstack Jobs" },
  { href: "/jobs/remote/ui-ux", label: "Remote UI/UX Jobs" },
];

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
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link></li>
            <li aria-hidden="true" className="text-gray-400">›</li>
            <li className="text-gray-700 font-medium" aria-current="page">Sitemap</li>
          </ol>
        </nav>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">HTML Sitemap</h1>

        <div className="flex flex-col gap-12">
          {/* Main Pages */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b border-[#e2e2e6] pb-2">Main Pages</h2>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-[#2563eb]">Home — Browse Remote Frontend Jobs</Link></li>
              <li><Link href="/about" className="hover:text-[#2563eb]">About FrontendEngineers.com</Link></li>
              <li><Link href="/pricing" className="hover:text-[#2563eb]">Pricing / Pro Membership</Link></li>
              <li><Link href="/employers/pricing" className="hover:text-[#2563eb]">Post a Job (Employers)</Link></li>
              <li><Link href="/blog" className="hover:text-[#2563eb]">Blog</Link></li>
            </ul>
          </div>

          {/* Technology Categories */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b border-[#e2e2e6] pb-2">Browse by Technology</h2>
            <ul className="space-y-3">
              {CATEGORY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#2563eb]">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b border-[#e2e2e6] pb-2">Legal</h2>
            <ul className="space-y-3">
              <li><Link href="/legal/terms-of-service" className="hover:text-[#2563eb]">Terms of Service</Link></li>
              <li><Link href="/legal/privacy-policy" className="hover:text-[#2563eb]">Privacy Policy</Link></li>
              <li><Link href="/legal/refund-policy" className="hover:text-[#2563eb]">Cancellation and Refund Policy</Link></li>
              <li><Link href="/legal/disclaimer" className="hover:text-[#2563eb]">Job Board Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* All Jobs List */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b border-[#e2e2e6] pb-2">Recent Remote Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {jobs.filter(j => !j.isDead).slice(0, 100).map((job) => (
              <div key={job.id} className="truncate">
                <Link href={`/jobs/${job.slug || job.id}`} className="text-sm hover:text-[#2563eb]">
                  {job.title} at {job.company?.name || "Unknown"}
                </Link>
              </div>
            ))}
          </div>
          {jobs.filter(j => !j.isDead).length > 100 && (
            <p className="mt-4 text-sm text-gray-600 italic">
              Showing the 100 most recent jobs. Please use the search function on the <Link href="/" className="text-[#2563eb] hover:underline">homepage</Link> to find more.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
