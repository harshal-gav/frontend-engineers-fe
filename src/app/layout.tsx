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
    default: "Remote Frontend Developer Jobs | FrontendEngineers.com",
    template: "%s | FrontendEngineers.com"
  },
  description: "Find the best remote frontend developer jobs aggregated from 100+ job boards. We curate premium, 100% remote positions for React, Vue, Angular, and Next.js engineers.",
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
    title: "Remote Frontend Developer Jobs | FrontendEngineers.com",
    description: "Find the best remote frontend developer jobs aggregated from 100+ job boards. We curate premium, 100% remote positions for React, Vue, Angular, and Next.js engineers.",
    url: "https://frontendengineers.com",
    siteName: "FrontendEngineers.com",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1456, height: 816, alt: "FrontendEngineers.com — Remote Frontend Developer Jobs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remote Frontend Developer Jobs | FrontendEngineers.com",
    description: "Find the best remote frontend developer jobs aggregated from 100+ job boards. We curate premium, 100% remote positions for React, Vue, Angular, and Next.js engineers.",
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
