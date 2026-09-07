import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { generateSlug, type Job } from "@/lib/jobs";
import { loadJobsFromFile } from "@/lib/jobs.server";
import JobDetail from "@/components/JobDetail";

// ─── Static Params (build-time) ──────────────────────────

export async function generateStaticParams() {
  const jobs = loadJobsFromFile();
  return jobs.map((job) => ({
    slug: job.slug || generateSlug(job),
  }));
}

// ─── Metadata ────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jobs = loadJobsFromFile();
  const job = jobs.find((j) => j.slug === slug || j.id === slug);

  if (!job) {
    return { title: "Job Not Found" };
  }

  if (job.isDead) {
    return {
      title: "Job No Longer Available",
      robots: { index: false, follow: true }
    };
  }

  // Dynamically generate keywords based on title
  const keywords = ["remote", "job", "frontend", "engineer", "developer"];
  if (job.title.toLowerCase().includes("react")) keywords.push("react", "react.js");
  if (job.title.toLowerCase().includes("vue")) keywords.push("vue", "vue.js");
  if (job.title.toLowerCase().includes("node")) keywords.push("node.js", "backend");

  return {
    title: `${job.title} at ${job.company?.name || "Company"} — Remote`,
    description:
      job.description?.substring(0, 155) ||
      `Apply for ${job.title} — remote ${job.employmentType.toLowerCase()} position.`,
    keywords: keywords.join(", "),
    alternates: {
      canonical: `https://frontendengineers.com/jobs/${slug}`,
    },
    openGraph: {
      title: `${job.title} — Remote Frontend & JavaScript Job`,
      description:
        job.description?.substring(0, 155) ||
        `Apply for ${job.title} — remote position.`,
      type: "website",
      url: `https://frontendengineers.com/jobs/${slug}`,
    },
  };
}

// ─── Page Component ──────────────────────────────────────

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jobs = loadJobsFromFile();
  const job = jobs.find((j) => j.slug === slug || j.id === slug);

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
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-white mb-4">Job No Longer Available</h1>
        <p className="text-gray-400 mb-8 max-w-md text-center">
          This position at {job.company?.name || "the company"} has been filled or is no longer active.
        </p>
        <a href="/" className="px-6 py-3 bg-[#00ffcc] text-black font-bold rounded-lg hover:scale-105 transition-transform">
          Browse Similar Remote Jobs
        </a>
      </div>
    );
  }

  // Build JobPosting JSON-LD structured data for SEO
  // Note: we include public info (title, remote type, employment type)
  // but NOT gated info (apply URL, salary) — those are premium.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.postedAt || new Date().toISOString(),
    validThrough: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    employmentType:
      job.employmentType === "CONTRACT" ? "CONTRACTOR" : "FULL_TIME",
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
    ...( (job.salaryMin || job.salaryMax) && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: job.currency || "USD",
        value: {
          "@type": "QuantitativeValue",
          ...(job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax
            ? { minValue: job.salaryMin, maxValue: job.salaryMax }
            : { value: job.salaryMin || job.salaryMax }),
          unitText: "YEAR",
        },
      },
    }),
  };

  // Server-side: we don't know if the user is premium (no auth headers in SSR).
  // We render the page with isPremium=false — the client-side JobDetail
  // component will hydrate with the real subscription state from useAuth().
  // This means the initial HTML never contains gated data.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobDetail job={job} isPremium={false} />
    </>
  );
}
