import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://frontendengineers.com"),
  title: {
    default: "2,400+ Remote Frontend Jobs in One Place | FrontendEngineers.com",
    template: "%s | FrontendEngineers.com"
  },
  description: "2,400+ remote frontend jobs from 100+ sources in one place. React, Vue, Angular, TypeScript & Next.js - updated daily. Stop wasting 20+ hours a week searching.",
  keywords: [
    "remote frontend developer jobs",
    "frontend engineer jobs",
    "remote react jobs",
    "remote typescript jobs",
    "remote javascript jobs",
    "vue developer jobs",
    "angular developer jobs",
    "nextjs jobs",
    "frontend jobs remote",
    "remote frontend engineer",
    "ui engineer jobs",
    "web developer jobs remote",
    "fullstack javascript jobs",
    "frontend developer job board",
  ],
  authors: [{ name: "FrontendEngineers.com" }],
  creator: "FrontendEngineers.com",
  publisher: "FrontendEngineers.com",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "your-google-verification-code-here",
  },
  openGraph: {
    title: "2,400+ Remote Frontend Jobs. One Place. | FrontendEngineers.com",
    description: "Stop checking 10 different job boards. We aggregate 2,400+ remote React, Vue, Angular & TypeScript jobs from 100+ sources - updated daily.",
    url: "https://frontendengineers.com",
    siteName: "FrontendEngineers.com",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1456, height: 816, alt: "2,400+ Remote Frontend Jobs in One Place - FrontendEngineers.com" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "2,400+ Remote Frontend Jobs. One Place. | FrontendEngineers.com",
    description: "Stop checking 10 different job boards. We aggregate 2,400+ remote React, Vue, Angular & TypeScript jobs from 100+ sources - updated daily.",
    images: ["/og-image.jpg"],
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col antialiased bg-white text-gray-900 overflow-x-hidden w-full max-w-full">
        <AuthProvider>

          <div className="relative z-10 flex flex-col min-h-full">
            {children}
          </div>
          <Footer />
          <CookieConsent />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
