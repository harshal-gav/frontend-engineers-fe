import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ALL_LANDING_PAGES, getLandingPageConfig } from "@/lib/landing-pages";
import { loadJobsFromFile, filterActiveJobs } from "@/lib/jobs.server";
import FaqSchema from "@/components/FaqSchema";
import LandingJobList from "@/components/LandingJobList";

export const revalidate = 3600; // 1-hour ISR for programmatic landing pages

// ─── Static Params ────────────────────────────────────────

export function generateStaticParams() {
  return ALL_LANDING_PAGES.map((page) => ({
    slug: page.slug,
  }));
}

// ─── Metadata ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = getLandingPageConfig(slug);

  if (!config) {
    return { title: "Not Found" };
  }

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: `/${config.slug}`,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: `https://www.frontendengineers.com/${config.slug}`,
      siteName: "FrontendEngineers.com",
      type: "website",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: config.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: ["/og-image.jpg"],
    },
  };
}

// ─── Breadcrumb Component ─────────────────────────────────

function Breadcrumbs({ label, slug }: { label: string; slug: string }) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.frontendengineers.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: `https://www.frontendengineers.com/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link>
          </li>
          <li aria-hidden="true" className="text-gray-400">›</li>
          <li className="text-gray-700 font-medium" aria-current="page">
            {label}
          </li>
        </ol>
      </nav>
    </>
  );
}

// ─── Page Component ───────────────────────────────────────

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getLandingPageConfig(slug);

  if (!config) {
    notFound();
  }

  // Canonical redirect for aliases (e.g. /europe -> /remote-frontend-jobs-europe)
  if (config.slug !== slug) {
    permanentRedirect(`/${config.slug}`);
  }

  // Filter jobs for this landing page
  const allJobs = loadJobsFromFile();
  const activeJobs = filterActiveJobs(allJobs);
  const filteredJobs = activeJobs.filter(config.filterFn);

  // If zero jobs, return notFound (as requested: don't create pages with zero jobs)
  if (filteredJobs.length === 0) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs label={config.h1} slug={config.slug} />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-10 sm:pb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-1.5 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 shadow-sm uppercase tracking-wider">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {filteredJobs.length}+ Curated Remote Roles • Updated Daily
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight text-gray-900">
              {config.h1}
            </h1>
            <p className="text-sm sm:text-base max-w-3xl mx-auto text-gray-600 leading-relaxed">
              {config.intro}
            </p>
          </div>
        </section>

        {/* Job List */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Latest {config.h1} ({filteredJobs.length} positions)
          </h2>
          <LandingJobList jobs={filteredJobs.slice(0, 50)} />

          {filteredJobs.length > 50 && (
            <div className="text-center mt-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#2563eb] text-white px-6 py-3 rounded-full font-bold hover:bg-[#1d4ed8] transition-colors"
              >
                View All {filteredJobs.length} Jobs →
              </Link>
            </div>
          )}
        </section>

        {/* Related Pages */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse Related Job Categories</h2>
          <div className="flex flex-wrap gap-2">
            {config.relatedPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="inline-flex items-center bg-gray-100 hover:bg-[#2563eb] hover:text-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {page.label}
              </Link>
            ))}
            <Link
              href="/"
              className="inline-flex items-center bg-gray-100 hover:bg-[#2563eb] hover:text-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              All Remote Frontend Jobs
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <FaqSchema items={config.faq} title={`FAQ: ${config.h1}`} />
        </section>
      </div>
    </>
  );
}
