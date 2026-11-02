import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { generateSlug, type Job, getEffectiveJobDescription } from "@/lib/jobs";
import { loadJobsFromFile } from "@/lib/jobs.server";
import JobDetail from "@/components/JobDetail";
import Link from "next/link";

export const revalidate = 3600; // 1-hour ISR for job detail pages

// ─── Static Params (build-time) ──────────────────────────

export async function generateStaticParams() {
  const jobs = loadJobsFromFile();
  return jobs.map((job) => ({
    slug: job.slug || generateSlug(job),
  }));
}

// ─── Skills extraction from title for schema enrichment ──

function extractSkills(title: string): string[] {
  const skills: string[] = [];
  const titleLower = title.toLowerCase();
  const skillMap: Record<string, string> = {
    "react": "React",
    "vue": "Vue.js",
    "angular": "Angular",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node": "Node.js",
    "svelte": "Svelte",
    "css": "CSS",
    "html": "HTML",
    "tailwind": "Tailwind CSS",
    "graphql": "GraphQL",
    "redux": "Redux",
    "webpack": "Webpack",
    "python": "Python",
    "aws": "AWS",
  };
  for (const [keyword, label] of Object.entries(skillMap)) {
    if (titleLower.includes(keyword) && !skills.includes(label)) {
      skills.push(label);
    }
  }
  return skills;
}

// ─── Metadata ────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jobs = loadJobsFromFile();
  let job = jobs.find((j) => j.slug === slug || j.id === slug);

  if (!job) {
    // Check Firestore (employer posted jobs)
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const db = getAdminDb();
      // Since we don't know the exact ID (it could be a slug), let's query both
      // Wait, employer jobs might not have a slug generated if they are just saved in Firestore. 
      // The API saves them with `id` and no `slug`. The JobCard links to `/jobs/${job.id}`.
      const doc = await db.collection('jobs').doc(slug).get();
      if (doc.exists) {
        job = doc.data() as Job;
      }
    } catch (e) {
      console.error("Firestore lookup error in metadata:", e);
    }
  }

  if (!job) {
    return { title: "Job Not Found" };
  }

  if (job.isDead) {
    return {
      title: "Job No Longer Available",
      robots: { index: false, follow: true }
    };
  }

  const companyName = job.company?.name || "Company";

  // Build a title strictly within 50-60 chars
  let pageTitle = `${job.title} at ${companyName} – Remote Job`;
  if (pageTitle.length > 60) {
    pageTitle = `${job.title} at ${companyName} – Remote`;
  }
  if (pageTitle.length > 60) {
    pageTitle = `${job.title} – Remote Frontend Job`;
  }
  if (pageTitle.length > 60) {
    pageTitle = `${job.title} – Remote Job`;
  }
  if (pageTitle.length > 60) {
    pageTitle = pageTitle.slice(0, 57) + "...";
  }
  if (pageTitle.length < 50) {
    pageTitle = `${pageTitle} | FE`;
  }
  if (pageTitle.length < 50) {
    pageTitle = pageTitle.padEnd(50, ".");
  }
  if (pageTitle.length > 60) {
    pageTitle = pageTitle.slice(0, 57) + "...";
  }

  // Build description strictly 150-160 chars
  let description = `Apply for ${job.title} at ${companyName}. 100% remote frontend developer position. Find verified React, TypeScript & Next.js roles on FrontendEngineers.com.`;
  if (description.length > 160) {
    description = `Apply for ${job.title} at ${companyName}. Remote frontend developer role. Find verified React, TypeScript & Next.js jobs on FrontendEngineers.com.`;
  }
  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }
  if (description.length < 150) {
    description = description.padEnd(152, " ");
  }

  return {
    title: pageTitle,
    description: description.substring(0, 160),
    alternates: {
      canonical: `/jobs/${slug}`,
    },
    openGraph: {
      title: `${job.title} at ${companyName} - Remote Frontend Job`,
      description: description.substring(0, 160),
      type: "website",
      url: `https://www.frontendengineers.com/jobs/${slug}`,
      siteName: "FrontendEngineers.com",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${job.title} at ${companyName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} at ${companyName} - Remote`,
      description: description.substring(0, 160),
      images: ["/og-image.jpg"],
    },
  };
}

// ─── Breadcrumb Component ────────────────────────────────

function Breadcrumbs({ jobTitle }: { jobTitle: string }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-1">
      <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <li>
          <Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link>
        </li>
        <li aria-hidden="true" className="text-gray-400">›</li>
        <li>
          <Link href="/" className="hover:text-[#2563eb] transition-colors">Jobs</Link>
        </li>
        <li aria-hidden="true" className="text-gray-400">›</li>
        <li className="text-gray-700 font-medium truncate max-w-[250px] sm:max-w-[400px]" aria-current="page">
          {jobTitle}
        </li>
      </ol>
    </nav>
  );
}

// ─── Page Component ──────────────────────────────────────

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jobs = loadJobsFromFile();
  let job = jobs.find((j) => j.slug === slug || j.id === slug);

  if (!job) {
    // Check Firestore for employer posted jobs
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const db = getAdminDb();
      const doc = await db.collection('jobs').doc(slug).get();
      if (doc.exists) {
        job = doc.data() as Job;
      }
    } catch (e) {
      console.error("Firestore lookup error:", e);
    }
  }

  if (!job) {
    const match = slug.match(/-([a-f0-9]{8})$/i);
    if (match) {
      const idSuffix = match[1];
      const foundJob = jobs.find((j) => j.id.startsWith(idSuffix));
      if (foundJob && foundJob.slug && foundJob.slug !== slug) {
        permanentRedirect(`/jobs/${foundJob.slug}`);
      }
    }
    notFound();
  }

  if (job.isDead) {
    // Find similar active jobs for the "closed" notice
    const currentStack = new Set(job.aiTags?.stack || []);
    const similarJobs = jobs
      .filter((j) => j.slug !== slug && j.id !== job.id && !j.isDead && j.title && j.company?.name)
      .map((j) => {
        let score = 0;
        if (j.aiTags?.stack?.some((s) => currentStack.has(s))) score += 3;
        if (j.company?.name && j.company.name === job.company?.name) score += 2;
        return { job: j, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.job);

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-full px-4 py-1.5 text-xs font-bold mb-6 uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            Position Closed
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Job No Longer Available</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            This <strong>{job.title}</strong> position at {job.company?.name || "the company"} has been filled or is no longer active.
          </p>

          {similarJobs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Similar Remote Jobs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {similarJobs.map((sj) => (
                  <Link
                    key={sj.id}
                    href={`/jobs/${sj.slug || sj.id}`}
                    className="block p-3 rounded-lg border border-[#e2e2e6] hover:border-[#2563eb] hover:bg-blue-50/50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900 truncate">{sj.title}</p>
                    <p className="text-xs text-gray-500 truncate">{sj.company?.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <Link href="/" className="px-6 py-3 bg-[#2563eb] text-white font-bold rounded-lg hover:scale-105 transition-transform">
              Browse All Remote Jobs
            </Link>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <Link href="/remote-react-jobs" className="text-sm text-[#2563eb] hover:underline">React Jobs</Link>
              <Link href="/remote-typescript-jobs" className="text-sm text-[#2563eb] hover:underline">TypeScript Jobs</Link>
              <Link href="/remote-vue-jobs" className="text-sm text-[#2563eb] hover:underline">Vue Jobs</Link>
              <Link href="/remote-angular-jobs" className="text-sm text-[#2563eb] hover:underline">Angular Jobs</Link>
              <Link href="/remote-nextjs-jobs" className="text-sm text-[#2563eb] hover:underline">Next.js Jobs</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Build JobPosting JSON-LD structured data for SEO
  // Note: we include public info (title, remote type, employment type)
  // but NOT gated info (apply URL, salary) - those are premium.
  const skills = extractSkills(job.title);

  // Map employment type to Schema.org standard
  const empTypeMap: Record<string, string> = {
    contract: "CONTRACTOR",
    parttime: "PART_TIME",
    internship: "INTERN",
    b2b: "CONTRACTOR",
    fulltime: "FULL_TIME",
  };
  const schemaEmploymentType = job.aiTags?.employmentType 
    ? (empTypeMap[job.aiTags.employmentType] || "FULL_TIME")
    : "FULL_TIME";

  const postedDate = job.postedAt ? new Date(job.postedAt) : new Date();
  const validThroughDate = new Date(postedDate.getTime() + 60 * 24 * 60 * 60 * 1000);

  const isGlobalLocation = !job.country || ["global", "worldwide", "remote", "anywhere"].includes(job.country.trim().toLowerCase());

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: getEffectiveJobDescription(job),
    datePosted: job.postedAt || postedDate.toISOString(),
    validThrough: validThroughDate.toISOString(),
    employmentType: schemaEmploymentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company?.name || "Company",
      ...(job.company?.logoUrl && { logo: job.company.logoUrl }),
      ...(job.company?.website && { sameAs: job.company.website }),
    },
    jobLocationType: "TELECOMMUTE",
    ...(!isGlobalLocation && {
      applicantLocationRequirements: {
        "@type": "Country",
        name: job.country,
      },
    }),
    ...(skills.length > 0 && { skills: skills }),
    ...(job.company?.industry && { industry: job.company.industry }),
  };

  // Only add baseSalary when real salary data exists in the job
  // NEVER invent salary data
  if (job.salaryMin && job.salaryMax) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "YEAR",
      },
    };
  } else if (job.salary) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "USD",
      value: {
        "@type": "QuantitativeValue",
        value: job.salary,
        unitText: "YEAR",
      },
    };
  }

  // Google paywalled content: isAccessibleForFree + hasPart for gated content
  // Job title, company, location, and tech tags are free. Full description is gated.
  jsonLd.isAccessibleForFree = false;
  jsonLd.hasPart = {
    "@type": "WebPageElement",
    "isAccessibleForFree": false,
    "cssSelector": ".paywalled-content",
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.frontendengineers.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Jobs",
        "item": "https://www.frontendengineers.com"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": job.title,
        "item": `https://www.frontendengineers.com/jobs/${slug}`
      }
    ]
  };

  // Find related active remote jobs (same tech stack or company, excluding current)
  const currentStack = new Set(job.aiTags?.stack || []);
  const relatedJobs = jobs
    .filter((j) => (j.slug !== slug && j.id !== job.id) && !j.isDead)
    .map((j) => {
      let score = 0;
      if (j.aiTags?.stack?.some((s) => currentStack.has(s))) score += 3;
      if (j.company?.name && j.company.name === job.company?.name) score += 2;
      return { job: j, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.job);

  // NEW BUSINESS MODEL:
  // The SSR page renders the FULL job data in the HTML for SEO crawlers.
  // The client-side JobDetail component handles gating (blur) for non-Pro users.
  // This means Google indexes the full description, but regular users see it blurred
  // unless they have Pro.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs jobTitle={job.title} />
      <JobDetail job={job} relatedJobs={relatedJobs} />
    </>
  );
}
