import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import fs from 'fs';
import path from 'path';
import JobsClientPage from "@/components/JobsClientPage";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  let jsonLd = null;
  try {
    const jobsPath = path.join(process.cwd(), 'data', 'jobs.json');
    if (fs.existsSync(jobsPath)) {
      const raw = fs.readFileSync(jobsPath, 'utf-8');
      const jobs = JSON.parse(raw).slice(0, 50); // limit to top 50 for page speed/SEO size limits

      const itemListElements = jobs.map((job: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "JobPosting",
          "title": job.title,
          "description": job.description || job.title,
          "datePosted": job.postedAt || new Date().toISOString(),
          "validThrough": new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          "employmentType": job.employmentType === 'CONTRACT' ? 'CONTRACTOR' : 'FULL_TIME',
          "hiringOrganization": {
            "@type": "Organization",
            "name": job.company?.name || "Unknown Company",
            "logo": job.company?.logoUrl || "https://frontendengineers.com/logo.png"
          },
          "jobLocationType": "TELECOMMUTE",
          "applicantLocationRequirements": {
            "@type": "Country",
            "name": job.country || "Worldwide"
          },

        }
      }));

      jsonLd = [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Frontend Engineers",
          "url": "https://frontendengineers.com",
          "logo": "https://frontendengineers.com/icon.png", // Assuming icon.png is available based on app/icon.tsx
          "description": "The premier job board for remote frontend and fullstack JavaScript developers."
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Best Remote Frontend Jobs",
          "url": "https://frontendengineers.com",
          "description": "Discover the best remote frontend jobs and fullstack JavaScript & TypeScript roles.",
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": itemListElements
        }
      ];
    }
  } catch (e) {
    console.error("Failed to generate JSON-LD", e);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={
        <div className="min-h-screen bg-white flex flex-col">
          <header className="border-b border-[#e2e2e6] bg-white sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-[#2563eb]">
                  FE
                </div>
                <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  <span className="hidden sm:inline">Best Remote Frontend Jobs</span>
                  <span className="sm:hidden">Best Frontend Jobs</span>
                </span>
              </div>
              <div className="w-24 h-10 skeleton rounded" />
            </div>
          </header>
          <section className="pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 text-center bg-white">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-5 leading-tight text-gray-900">
              The Best{" "}
              <span className="text-[#2563eb]">Remote Frontend Jobs</span>
              <span className="block mt-2 text-lg sm:text-xl lg:text-2xl text-gray-700 font-bold">
                Work from anywhere, earn in dollars, and spend in local currency.
              </span>
            </h1>
            <p className="text-sm sm:text-base max-w-2xl mx-auto mb-6 text-gray-600">
              Curated 100% remote roles for React, Vue, Angular, Svelte, Next.js, UI/UX, and TypeScript Engineers. Pro members get 7-day early access, apply before the crowd.
            </p>

            <div className="flex flex-col items-center justify-center gap-2 mb-8 mt-2">
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
              >
                ⭐ Get Pro Membership
              </Link>
              <p className="text-xs text-gray-600 font-medium px-4 text-center">Unlock early access and daily new job alerts before the crowd. Apply before anyone else with Pro.</p>
            </div>
            <div className="flex justify-center w-full max-w-2xl mx-auto mb-4 sm:mb-6">
              <div className="w-full bg-white border border-[#e2e2e6] rounded-full h-12 sm:h-[54px] skeleton" />
            </div>
          </section>
        </div>
      }>
        <JobsClientPage />
      </Suspense>


    </>
  );
}
