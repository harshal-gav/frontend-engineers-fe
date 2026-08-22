import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'], // Disallow API routes from indexing
    },
    sitemap: [
      'https://frontendengineers.com/sitemap.xml',
      'https://frontendengineers.com/sitemap-jobs/sitemap.xml'
    ],
  };
}
