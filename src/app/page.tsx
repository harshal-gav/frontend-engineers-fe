import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import fs from 'fs';
import path from 'path';
import JobsClientPage from "@/components/JobsClientPage";
import FaqSchema, { type FaqItem } from "@/components/FaqSchema";

import { loadJobsFromFile, filterActiveJobs } from "@/lib/jobs.server";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// ─── Homepage FAQ for AEO ────────────────────────────────
const HOMEPAGE_FAQ: FaqItem[] = [
  {
    question: "Where can I find remote frontend developer jobs?",
    answer: "FrontendEngineers.com is a specialized job portal dedicated exclusively to remote frontend and fullstack JavaScript developer jobs. We curate 100% remote positions for React, Vue, Angular, TypeScript, Next.js, and JavaScript engineers from companies worldwide. Browse our latest listings on the homepage or filter by technology.",
  },
  {
    question: "Does FrontendEngineers.com focus only on frontend jobs?",
    answer: "Yes. Unlike generic job boards, FrontendEngineers.com specializes exclusively in frontend engineering and fullstack JavaScript roles. Every job listed is relevant to frontend developers, UI/UX engineers, and JavaScript/TypeScript engineers. This specialization means you never have to sift through irrelevant backend-only or non-technical listings.",
  },
  {
    question: "Can I find React, TypeScript, or Vue jobs here?",
    answer: "Absolutely. FrontendEngineers.com features remote jobs across all major frontend technologies including React, TypeScript, JavaScript, Vue, Angular, Next.js, Svelte, and Node.js. You can filter jobs by technology using the category filters on the homepage.",
  },
  {
    question: "Are all jobs on FrontendEngineers.com remote?",
    answer: "We focus primarily on 100% remote positions that allow you to work from anywhere. Our listings are curated to include genuine remote opportunities, filtering out hybrid roles disguised as remote. Some positions may specify regional availability requirements.",
  },
  {
    question: "Can companies post jobs on FrontendEngineers.com?",
    answer: "Yes. Employers, startups, and hiring managers can post frontend developer jobs on FrontendEngineers.com to reach a targeted audience of qualified frontend engineers. Visit our employer pricing page to learn about posting options and reach thousands of specialized frontend developers.",
  },
  {
    question: "How often are new jobs added?",
    answer: "New remote frontend developer jobs are added daily. We continuously source and curate positions from leading companies, startups, and tech teams worldwide. Pro members can see full company details, descriptions, and apply links for every job.",
  },
];

export default async function HomePage() {
  let jsonLd = null;
  try {
    const allJobs = loadJobsFromFile();
    const jobs = filterActiveJobs(allJobs).slice(0, 50); // limit to top 50 active deduplicated jobs for SEO

      const itemListElements = jobs.map((job: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": `${job.title} at ${job.company?.name || "Company"}`,
        "url": `https://www.frontendengineers.com/jobs/${job.slug || job.id}`,
      }));

      jsonLd = [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "FrontendEngineers.com",
          "url": "https://www.frontendengineers.com",
          "logo": "https://www.frontendengineers.com/icon.png",
          "description": "Get hired faster with less competition. FrontendEngineers.com is an exclusive job portal featuring 100% remote positions for React, Vue, Angular, and Next.js engineers.",
          "email": "frontendengineersupport@gmail.com",
          "sameAs": [
            "https://www.linkedin.com/company/frontend-engineers-fe/"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "frontendengineersupport@gmail.com",
            "contactType": "customer support"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FrontendEngineers.com",
          "url": "https://www.frontendengineers.com",
          "description": "Get hired faster with less competition. FrontendEngineers.com is an exclusive job portal featuring 100% remote positions for React, Vue, Angular, and Next.js engineers.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.frontendengineers.com/?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": itemListElements
        }
      ];
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
              <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm bg-[#2563eb] shrink-0">
                  FE
                </div>
                <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  FrontendEngineers.com
                </span>
              </Link>
              <div className="w-24 h-10 skeleton rounded" />
            </div>
          </header>
          <section className="pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 text-center bg-white flex flex-col items-center">
            <div className="inline-flex items-center justify-center gap-1.5 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 shadow-sm uppercase tracking-wider">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Curated Remote Roles • Updated Daily
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-5 leading-tight text-gray-900 w-full">
              The Remote Job Board for{" "}
              <span className="text-[#2563eb]">Frontend Developers</span>
            </h1>
            <p className="text-sm sm:text-base max-w-2xl mx-auto mb-3 text-gray-600">
              Zero hybrid fluff. Zero non-technical spam. Verified React, TypeScript, Next.js, Vue, and Angular jobs from remote-first companies worldwide.
            </p>

            <div className="flex flex-col items-center justify-center gap-2 mb-8 mt-2">
              <Link
                href="/pricing"
                className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
              >
                ⭐ Unlock All Jobs & Referrals - $9/mo
              </Link>
            </div>
            <div className="flex justify-center w-full max-w-2xl mx-auto mb-4 sm:mb-6">
              <div className="w-full bg-white border border-[#e2e2e6] rounded-full h-12 sm:h-[54px] skeleton" />
            </div>
          </section>
        </div>
      }>
        <JobsClientPage />
      </Suspense>

      {/* ─── Homepage FAQ for AEO/SEO ─────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <FaqSchema items={HOMEPAGE_FAQ} title="Frequently Asked Questions About FrontendEngineers.com" />
      </section>

    </>
  );
}
