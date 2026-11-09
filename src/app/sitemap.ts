import { MetadataRoute } from 'next';
import { loadJobsFromFile, filterActiveJobs } from '@/lib/jobs.server';
import { ALL_LANDING_PAGES } from '@/lib/landing-pages';

export const revalidate = 86400; // Revalidate sitemap every 24 hours

/**
 * Main sitemap: includes home, pricing, about, legal pages,
 * blog posts, all programmatic landing pages, and all active job pages.
 * Under 50,000 URLs total (~1,000 URLs), all served via /sitemap.xml.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.frontendengineers.com';
  const now = new Date();

  // ─── 1. Core Static Pages ─────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/employers/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/how-to-get-remote-frontend-job-2026`,
      lastModified: new Date('2026-08-30'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Legal pages
    {
      url: `${baseUrl}/legal/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/terms-of-service`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/refund-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/disclaimer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ─── 2. Programmatic Landing Pages ────────────────────
  const landingPages: MetadataRoute.Sitemap = ALL_LANDING_PAGES.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // ─── 3. Active Job Detail Pages ───────────────────────
  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const allJobs = loadJobsFromFile();
    const activeJobs = filterActiveJobs(allJobs);

    jobPages = activeJobs.map((job) => ({
      url: `${baseUrl}/jobs/${job.slug || job.id}`,
      lastModified: job.postedAt ? new Date(job.postedAt) : now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error generating job sitemap entries:', error);
  }

  return [...staticPages, ...landingPages, ...jobPages];
}
