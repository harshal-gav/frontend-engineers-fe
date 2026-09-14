import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
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

  // Dynamically generate keywords based on title
  const keywords = ["remote", "job", "frontend", "engineer", "developer"];
  if (job.title.toLowerCase().includes("react")) keywords.push("react", "react.js");
  if (job.title.toLowerCase().includes("vue")) keywords.push("vue", "vue.js");
  if (job.title.toLowerCase().includes("node")) keywords.push("node.js", "backend");

  return {
    title: `${job.title} at ${job.company?.name || "Company"} — Remote`,
    description:
      job.description?.substring(0, 155) ||
      `Apply for ${job.title} — remote position.`,
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
        <p className="text-gray-600 mb-8 max-w-md text-center">
          This position at {job.company?.name || "the company"} has been filled or is no longer active.
        </p>
        <a href="/" className="px-6 py-3 bg-[#2563eb] text-white font-bold rounded-lg hover:scale-105 transition-transform">
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
    }
  };

  // STRIP GATED DATA FOR INITIAL HTML PAYLOAD
  // The server renders the initial HTML for all users without knowing their auth status.
  // We explicitly delete sensitive fields so they don't leak in the network tab / view source.
  const publicJob = { ...job };

  if (publicJob.isEarlyAccess) {
    delete (publicJob as any).applyUrl;
  }

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
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)]"></div>}>
        <JobDetail job={publicJob} isPremium={false} />
      </Suspense>
    </>
  );
}
