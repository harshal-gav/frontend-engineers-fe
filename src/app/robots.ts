import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/account/',
        '/checkout/',
        '/pricing/success/',
        '/auth/',
        '/admin/',
        '/employers/post/',
        '/referrals/',
      ],
    },
    sitemap: 'https://www.frontendengineers.com/sitemap.xml',
  };
}
