import { MetadataRoute } from 'next';
import { loadJobsFromFile, filterActiveJobs } from '@/lib/jobs.server';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.frontendengineers.com';
  const jobs = loadJobsFromFile();

  // Deduplicate and filter out dead/expired/unpublished jobs
  const activeJobs = filterActiveJobs(jobs);

  const jobsPages: MetadataRoute.Sitemap = activeJobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug || job.id}`,
    lastModified: job.postedAt ? new Date(job.postedAt) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return jobsPages;
}
