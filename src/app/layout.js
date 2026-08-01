import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  metadataBase: new URL('https://frontendengineers.fe'),
  title: {
    default: 'Frontend Engineers FE | Custom Web Development Agency',
    template: '%s | Frontend Engineers FE',
  },
  description: 'Award-winning web development agency specializing in custom websites, e-commerce, web applications & UI/UX design. React & Next.js experts. Get a free quote today.',
  keywords: [
    'web development agency',
    'custom website development',
    'frontend development company',
    'hire web developers',
    'professional web design services',
    'react development agency',
    'next.js development company',
    'e-commerce website development',
    'web application development services',
    'UI/UX design agency',
    'responsive web design company',
    'SEO optimized website development',
    'custom web solutions',
    'full stack web development',
    'best web development agency for startups',
    'affordable custom website design',
    'website redesign services',
    'website maintenance and support services',
  ],
  authors: [{ name: 'Frontend Engineers FE' }],
  creator: 'Frontend Engineers FE',
  publisher: 'Frontend Engineers FE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://frontendengineers.fe',
    siteName: 'Frontend Engineers FE',
    title: 'Frontend Engineers FE | Custom Web Development Agency',
    description: 'Award-winning web development agency specializing in custom websites, e-commerce, web applications & UI/UX design. React & Next.js experts.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Frontend Engineers FE - Custom Web Development Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frontend Engineers FE | Custom Web Development Agency',
    description: 'Award-winning web development agency specializing in custom websites, e-commerce, web applications & UI/UX design.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://frontendengineers.fe',
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: 'your-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <OrganizationJsonLd />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-20" role="main">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
