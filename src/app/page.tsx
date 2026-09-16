import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import fs from 'fs';
import path from 'path';
import JobsClientPage from "@/components/JobsClientPage";
import FaqSchema, { type FaqItem } from "@/components/FaqSchema";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// ─── Homepage FAQ for AEO ────────────────────────────────
const HOMEPAGE_FAQ: FaqItem[] = [
  {
    question: "Where can I find remote frontend developer jobs?",
    answer: "FrontendEngineers.com is a specialized job board dedicated exclusively to remote frontend and fullstack JavaScript developer jobs. We curate 100% remote positions for React, Vue, Angular, TypeScript, Next.js, and JavaScript engineers from companies worldwide. Browse our latest listings on the homepage or filter by technology.",
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
          "employmentType": "FULL_TIME",
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
          "name": "FrontendEngineers.com",
          "url": "https://frontendengineers.com",
          "logo": "https://frontendengineers.com/icon.png",
          "description": "FrontendEngineers.com is a specialized job board for remote frontend and fullstack JavaScript developer jobs. We connect frontend engineers with 100% remote opportunities at leading companies worldwide.",
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
          "url": "https://frontendengineers.com",
          "description": "Find remote frontend developer jobs. FrontendEngineers.com curates 100% remote positions for React, Vue, Angular, TypeScript, and JavaScript engineers.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://frontendengineers.com/?q={search_term_string}"
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
                  <span className="hidden sm:inline">FrontendEngineers.com</span>
                  <span className="sm:hidden">FrontendEngineers</span>
                </span>
              </div>
              <div className="w-24 h-10 skeleton rounded" />
            </div>
          </header>
          <section className="pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 text-center bg-white flex flex-col items-center">
            <div className="inline-flex items-center justify-center gap-1.5 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 shadow-sm uppercase tracking-wider">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Aggregated from 100+ job boards & company career pages
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-5 leading-tight text-gray-900 w-full">
              Every Remote Frontend Job.{" "}
              <span className="text-[#2563eb]">One Place.</span>
            </h1>
            <p className="text-sm sm:text-base max-w-2xl mx-auto mb-4 text-gray-600">
              Stop wasting hours on LinkedIn, Indeed, AngelList, WeWorkRemotely, and 100 other sites. We aggregate every remote frontend job from across the internet - so you don't have to.
            </p>

            <div className="flex flex-col items-center justify-center gap-2 mb-8 mt-2">
              <Link
                href="/pricing"
                className="w-full sm:w-auto bg-[#d97706] hover:bg-[#b45309] text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
              >
                ⭐ Unlock Full Access - $9/mo
              </Link>
              <p className="text-xs text-gray-600 font-medium px-4 text-center">Pro unlocks company details, descriptions & apply links. Plus, get daily email alerts the second new jobs drop so you can apply before the crowd!</p>
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
