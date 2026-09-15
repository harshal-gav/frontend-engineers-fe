import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/auth/',           // Login/signup pages — low SEO value
        '/employers/post/', // Private employer job posting flow
        '/pricing/success/', // Post-payment confirmation page
      ],
    },
    sitemap: [
      'https://frontendengineers.com/sitemap.xml',
      'https://frontendengineers.com/sitemap-jobs/sitemap.xml'
    ],
  };
}
