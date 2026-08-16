import Link from "next/link";
import fs from "fs";
import path from "path";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Navigate all pages and job listings on FrontendEngineers.com.",
};

export default function HTMLSitemapPage() {
  let jobs: any[] = [];
  try {
    const jobsPath = path.join(process.cwd(), "data", "jobs.json");
    if (fs.existsSync(jobsPath)) {
      const raw = fs.readFileSync(jobsPath, "utf-8");
      jobs = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load jobs for sitemap", e);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-[#00ffcc] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-white mb-8">HTML Sitemap</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Main Pages */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-[#333] pb-2">Main Pages</h2>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-[#00ffcc]">Home</Link></li>
              <li><Link href="/about" className="hover:text-[#00ffcc]">About Us</Link></li>
              <li><Link href="/pricing" className="hover:text-[#00ffcc]">Pricing / Pro Membership</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#00ffcc]">Log In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-[#00ffcc]">Sign Up</Link></li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4 border-b border-[#333] pb-2">Legal</h2>
            <ul className="space-y-3">
              <li><Link href="/terms" className="hover:text-[#00ffcc]">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#00ffcc]">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Job Categories (Placeholder for SEO) */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-[#333] pb-2">Browse by Tech Stack</h2>
            <ul className="space-y-3">
              <li><Link href="/?framework=React" className="hover:text-[#00ffcc]">Remote React Jobs</Link></li>
              <li><Link href="/?framework=Vue" className="hover:text-[#00ffcc]">Remote Vue Jobs</Link></li>
              <li><Link href="/?framework=Angular" className="hover:text-[#00ffcc]">Remote Angular Jobs</Link></li>
              <li><Link href="/?q=TypeScript" className="hover:text-[#00ffcc]">Remote TypeScript Jobs</Link></li>
              <li><Link href="/?q=UI/UX" className="hover:text-[#00ffcc]">Remote UI/UX Design Jobs</Link></li>
            </ul>
          </div>
        </div>

        {/* All Jobs List */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-white mb-4 border-b border-[#333] pb-2">Recent Remote Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {jobs.slice(0, 100).map((job) => (
              <div key={job.id} className="truncate">
                <Link href={`/jobs/${job.slug}`} className="text-sm hover:text-[#00ffcc]">
                  {job.title} at {job.company?.name || "Unknown"}
                </Link>
              </div>
            ))}
          </div>
          {jobs.length > 100 && (
            <p className="mt-4 text-sm text-gray-500 italic">
              Showing the 100 most recent jobs. Please use the search function on the homepage to find more.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
