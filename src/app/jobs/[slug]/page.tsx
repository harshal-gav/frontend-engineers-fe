import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { generateSlug, type Job } from "@/lib/jobs";
import { loadJobsFromFile } from "@/lib/jobs.server";
import JobDetail from "@/components/JobDetail";
import Link from "next/link";

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
  const locationStr = job.country ? ` in ${job.country}` : "";

  return {
    title: `${job.title} at ${companyName} — Remote${locationStr}`,
    description:
      job.description?.substring(0, 155).replace(/\n/g, ' ').trim() ||
      `Apply for ${job.title} at ${companyName} — remote frontend developer position on FrontendEngineers.com.`,
    alternates: {
      canonical: `/jobs/${slug}`,
    },
    openGraph: {
      title: `${job.title} at ${companyName} — Remote Frontend Job`,
      description:
        job.description?.substring(0, 155).replace(/\n/g, ' ').trim() ||
        `Apply for ${job.title} at ${companyName} — remote position.`,
      type: "website",
      url: `https://frontendengineers.com/jobs/${slug}`,
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
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Job No Longer Available</h1>
        <p className="text-gray-600 mb-6 max-w-md text-center">
          This position at {job.company?.name || "the company"} has been filled or is no longer active.
        </p>
        <div className="flex flex-col items-center gap-4">
          <a href="/" className="px-6 py-3 bg-[#2563eb] text-white font-bold rounded-lg hover:scale-105 transition-transform">
            Browse Similar Remote Jobs
          </a>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <Link href="/jobs/remote/react" className="text-sm text-[#2563eb] hover:underline">React Jobs</Link>
            <Link href="/jobs/remote/typescript" className="text-sm text-[#2563eb] hover:underline">TypeScript Jobs</Link>
            <Link href="/jobs/remote/javascript" className="text-sm text-[#2563eb] hover:underline">JavaScript Jobs</Link>
            <Link href="/jobs/remote/vue" className="text-sm text-[#2563eb] hover:underline">Vue Jobs</Link>
            <Link href="/jobs/remote/angular" className="text-sm text-[#2563eb] hover:underline">Angular Jobs</Link>
          </div>
        </div>
      </div>
    );
  }

  // Build JobPosting JSON-LD structured data for SEO
  // Note: we include public info (title, remote type, employment type)
  // but NOT gated info (apply URL, salary) — those are premium.
  const skills = extractSkills(job.title);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.postedAt || new Date().toISOString(),
    validThrough: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company?.name || "Company",
      ...(job.company?.logoUrl && { logo: job.company.logoUrl }),
      ...(job.company?.website && { sameAs: job.company.website }),
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: job.country || "Worldwide",
    },
    ...(skills.length > 0 && { skills: skills }),
    ...(job.company?.industry && { industry: job.company.industry }),
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
        "item": "https://frontendengineers.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Jobs",
        "item": "https://frontendengineers.com"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": job.title,
        "item": `https://frontendengineers.com/jobs/${slug}`
      }
    ]
  };

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
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]"></div>}>
        <JobDetail job={job} />
      </Suspense>
    </>
  );
}
