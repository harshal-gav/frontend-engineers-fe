import type { Metadata } from "next";
import { Suspense } from "react";
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
          "baseSalary": (job.salaryMin || job.salaryMax) ? {
            "@type": "MonetaryAmount",
            "currency": job.currency || "USD",
            "value": {
              "@type": "QuantitativeValue",
              ...(job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax
                ? { minValue: job.salaryMin, maxValue: job.salaryMax }
                : { value: job.salaryMin || job.salaryMax }),
              "unitText": "YEAR"
            }
          } : undefined
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
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
          <header className="border-b border-[#333] bg-[#0a0a0a] sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold text-sm bg-[#00ffcc]">
                  FE
                </div>
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  <span className="hidden sm:inline">Best Remote Frontend Jobs</span>
                  <span className="sm:hidden">Best Frontend Jobs</span>
                </span>
              </div>
              <div className="w-24 h-10 skeleton rounded" />
            </div>
          </header>
          <section className="pt-8 sm:pt-12 pb-6 sm:pb-8 px-4 text-center bg-[#0a0a0a]">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight text-white">
              The Best{" "}
              <span className="text-[#00ffcc]">Remote Frontend Jobs</span>
              <span className="block mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl text-gray-300 font-bold">
                Work from anywhere, earn in dollars, and spend in local currency.
              </span>
            </h1>
            <p className="text-sm sm:text-base max-w-2xl mx-auto mb-6 sm:mb-8 text-gray-400">
              No other platform gives you this amount of remote frontend jobs at one place. Discover curated premium 100% remote roles for React, Vue, Angular, Node.js, TypeScript, and Fullstack Engineers.
            </p>
            <div className="flex justify-center w-full max-w-2xl mx-auto mb-4 sm:mb-6">
              <div className="w-full bg-[#111] border border-[#333] rounded-full h-12 sm:h-[54px] skeleton" />
            </div>
          </section>
        </div>
      }>
        <JobsClientPage />
      </Suspense>


    </>
  );
}
