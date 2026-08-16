import { Suspense } from "react";
import fs from 'fs';
import path from 'path';
import JobsClientPage from "@/components/JobsClientPage";

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
          "baseSalary": job.salaryMin ? {
            "@type": "MonetaryAmount",
            "currency": job.currency || "USD",
            "value": {
              "@type": "QuantitativeValue",
              "value": job.salaryMin,
              "unitText": "YEAR"
            }
          } : undefined
        }
      }));

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": itemListElements
      };
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
      <Suspense fallback={<div className="min-h-screen" />}>
        <JobsClientPage />
      </Suspense>
    </>
  );
}
