import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About FrontendEngineers.com — Remote Frontend Developer Job Board",
  description: "FrontendEngineers.com is the ultimate aggregator for remote frontend jobs. We scrape and source from 100+ job boards to bring every React, Vue, and Angular role into one place.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FrontendEngineers.com",
    "url": "https://www.frontendengineers.com",
    "logo": "https://www.frontendengineers.com/icon.png",
    "description": "FrontendEngineers.com is a specialized job board for remote frontend developer jobs. We connect frontend engineers with 100% remote opportunities at leading companies worldwide.",
    "email": "frontendengineersupport@gmail.com",
    "sameAs": [
      "https://www.linkedin.com/company/frontend-engineers-fe/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "frontendengineersupport@gmail.com",
      "contactType": "customer support",
      "availableLanguage": "English"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white text-gray-700 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link></li>
            <li aria-hidden="true" className="text-gray-400">›</li>
            <li className="text-gray-700 font-medium" aria-current="page">About</li>
          </ol>
        </nav>

        <div className="prose prose-base md:prose-lg max-w-none break-words overflow-hidden w-full prose-p:text-gray-700 prose-headings:text-gray-900">
          <h1 className="text-4xl font-bold mb-6">About FrontendEngineers.com</h1>

          {/* What we are — Entity SEO */}
          <p className="text-gray-700 leading-relaxed mb-4">
            FrontendEngineers.com aggregates 2,400+ remote frontend developer jobs from 100+ sources - including LinkedIn, WeWorkRemotely, AngelList, and direct company career pages - into one searchable platform. Updated every 24 hours.
          </p>
          <p className="mb-6 text-gray-600 leading-relaxed">
            Save 20+ hours a week checking 10 different job boards. We check 100+ sources for you, every single day. One search. Every remote React, Vue, Angular, TypeScript, and Next.js job in one place.
          </p>

          {/* Who we serve */}
          <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">Who We Serve</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-xl border border-[#e2e2e6] bg-[#f9fafb]">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Frontend Developers</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Browse 2,400+ remote frontend jobs for free. Pro members unlock search, filters, full descriptions, 1-click apply links, and 10+ fresh jobs in their inbox every morning.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[#e2e2e6] bg-[#f9fafb]">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Employers &amp; Hiring Managers</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Reach 5,000+ frontend engineers directly. Post your remote frontend developer 
                jobs and connect with React, TypeScript, and JavaScript specialists who are actively looking. Unlimited posts for $99/mo.
              </p>
            </div>
          </div>

          {/* What problem we solve */}
          <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">Why a Specialized Frontend Job Board?</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            Generic job boards are noisy. Frontend developers save 20+ hours a week by avoiding irrelevant 
            backend, DevOps, and non-technical listings. Employers compete with thousands of unrelated 
            postings for developer attention. FrontendEngineers.com solves this: every job listed is a remote frontend role. Nothing else.
          </p>
          <p className="mb-8 text-gray-600 leading-relaxed">
            We vet listings to filter out hybrid roles disguised as remote, ensuring you find 
            genuine <strong>work-from-anywhere frontend developer jobs</strong>. Whether you&apos;re looking for 
            <strong>remote React jobs</strong>, <strong>remote TypeScript jobs</strong>, or <strong>remote 
            Vue jobs</strong>, our 2,400+ curated listings save you 20+ hours a week.
          </p>

          {/* How it works */}
          <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">How It Works</h2>
          <div className="space-y-4 mb-8">
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
              <div>
                <h3 className="font-semibold text-gray-900">Browse or Search</h3>
                <p className="text-gray-600 text-sm">Find remote frontend jobs by technology, company, or keyword. Filter by React, TypeScript, Vue, Angular, seniority, and 15+ other criteria.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
              <div>
                <h3 className="font-semibold text-gray-900">Review &amp; Apply</h3>
                <p className="text-gray-600 text-sm">Read full job descriptions, requirements, and salary info. Apply directly through the company&apos;s career page with 1-click links.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
              <div>
                <h3 className="font-semibold text-gray-900">Get Pro to Unlock Everything</h3>
                <p className="text-gray-600 text-sm">Upgrade to Pro for $9/mo to unlock full descriptions, 1-click apply links, and 10+ fresh jobs delivered to your inbox every morning.</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">Contact Us</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            Have questions, feedback, or partnership inquiries? We&apos;d love to hear from you.
          </p>
          <ul className="space-y-2 text-gray-600 mb-8 list-none pl-0">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <a href="mailto:frontendengineersupport@gmail.com" className="text-[#2563eb] hover:underline">frontendengineersupport@gmail.com</a>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <a href="https://www.linkedin.com/company/frontend-engineers-fe/" target="_blank" rel="noopener noreferrer" className="text-[#2563eb] hover:underline">Follow us on LinkedIn</a>
            </li>
          </ul>


        </div>
      </div>
    </div>
    </>
  );
}
