import { MetadataRoute } from 'next';
import { loadJobsFromFile } from '@/lib/jobs.server';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.frontendengineers.com';
  const jobs = loadJobsFromFile();

  const jobsPages: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug || job.id}`,
    lastModified: job.postedAt ? new Date(job.postedAt) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return jobsPages;
}
