import { MetadataRoute } from 'next';
import { loadJobsFromFile } from '@/lib/jobs.server';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.frontendengineers.com';
  const jobs = loadJobsFromFile();

  // Filter out dead/expired jobs — they shouldn't be in the sitemap
  const activeJobs = jobs.filter((job) => !job.isDead);

  const jobsPages: MetadataRoute.Sitemap = activeJobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug || job.id}`,
    lastModified: job.postedAt ? new Date(job.postedAt) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return jobsPages;
}
