import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact FrontendEngineers.com – Support & Inquiries",
  description: "Have questions about FrontendEngineers.com? Contact our support team for help with job listings, Pro membership, employer postings, or partnership inquiries.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact FrontendEngineers.com – Support & Inquiries",
    description: "Have questions about FrontendEngineers.com? Contact our support team for help with job listings, Pro membership, employer postings, or partnership inquiries.",
    url: "https://www.frontendengineers.com/contact",
    siteName: "FrontendEngineers.com",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1456, height: 816, alt: "Contact FrontendEngineers.com" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact FrontendEngineers.com – Support & Inquiries",
    description: "Have questions about FrontendEngineers.com? Contact our support team for help with job listings, Pro membership, employer postings, or partnership inquiries.",
    images: ["/og-image.jpg"],
  },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact FrontendEngineers.com",
    url: "https://www.frontendengineers.com/contact",
    mainEntity: {
      "@type": "Organization",
      name: "FrontendEngineers.com",
      email: "frontendengineersupport@gmail.com",
      url: "https://www.frontendengineers.com",
      contactPoint: {
        "@type": "ContactPoint",
        email: "frontendengineersupport@gmail.com",
        contactType: "customer support",
        availableLanguage: "English",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white text-gray-700 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link>
              </li>
              <li aria-hidden="true" className="text-gray-400">›</li>
              <li className="text-gray-700 font-medium" aria-current="page">
                Contact
              </li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold mb-6 text-gray-900">Contact Us</h1>
          <p className="text-gray-600 leading-relaxed mb-8 max-w-2xl">
            Have questions about FrontendEngineers.com? Whether you need help with your Pro
            membership, want to report a job listing, have a partnership inquiry, or just want to
            say hello — we&apos;d love to hear from you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Email */}
            <div className="p-6 rounded-xl border border-[#e2e2e6] bg-[#f9fafb]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#2563eb] text-white flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Email Support</h2>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                For all inquiries including membership support, job reports, and general questions.
              </p>
              <a
                href="mailto:frontendengineersupport@gmail.com"
                className="text-[#2563eb] hover:underline font-medium text-sm"
              >
                frontendengineersupport@gmail.com
              </a>
            </div>

            {/* LinkedIn */}
            <div className="p-6 rounded-xl border border-[#e2e2e6] bg-[#f9fafb]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">LinkedIn</h2>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Follow us for job highlights, frontend engineering tips, and company updates.
              </p>
              <a
                href="https://www.linkedin.com/company/frontend-engineers-fe/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563eb] hover:underline font-medium text-sm"
              >
                Follow on LinkedIn →
              </a>
            </div>
          </div>

          {/* Common topics */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Topics</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#e2e2e6]">
                <h3 className="font-semibold text-gray-900 mb-1">Pro Membership & Billing</h3>
                <p className="text-gray-600 text-sm">
                  Questions about your subscription, cancellation, or payment issues? Email us with your
                  account email and we&apos;ll respond within 24 hours.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-[#e2e2e6]">
                <h3 className="font-semibold text-gray-900 mb-1">Employer Job Posting</h3>
                <p className="text-gray-600 text-sm">
                  Want to post a remote frontend developer job? Visit our{" "}
                  <Link href="/employers/pricing" className="text-[#2563eb] hover:underline">
                    employer pricing page
                  </Link>{" "}
                  or email us for bulk posting inquiries.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-[#e2e2e6]">
                <h3 className="font-semibold text-gray-900 mb-1">Report a Job Listing</h3>
                <p className="text-gray-600 text-sm">
                  Found a listing that&apos;s expired, misleading, or not remote? Use the &quot;Report&quot; button on any
                  job page, or email us with the job URL.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-[#e2e2e6]">
                <h3 className="font-semibold text-gray-900 mb-1">Partnerships & Press</h3>
                <p className="text-gray-600 text-sm">
                  Interested in partnering with FrontendEngineers.com? Reach out via email with details
                  about your proposal.
                </p>
              </div>
            </div>
          </div>

          {/* Response time */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 text-center">
            <p className="text-[#166534] font-semibold text-sm">
              💬 Average response time: within 24 hours on business days
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
