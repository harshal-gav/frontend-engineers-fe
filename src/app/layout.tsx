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
  metadataBase: new URL("https://www.frontendengineers.com"),
  title: {
    default: "Remote Frontend Developer Jobs | FrontendEngineers.com",
    template: "%s"
  },
  description: "Discover curated remote frontend developer jobs with less competition. Find verified React, TypeScript, Vue, Angular, and Next.js roles. Updated daily.",
  authors: [{ name: "FrontendEngineers.com" }],
  creator: "FrontendEngineers.com",
  publisher: "FrontendEngineers.com",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || "",
  },
  openGraph: {
    title: "Remote Frontend Developer Jobs | FrontendEngineers.com",
    description: "Discover curated remote frontend developer jobs with less competition. Find verified React, TypeScript, Vue, Angular, and Next.js roles. Updated daily.",
    url: "https://www.frontendengineers.com",
    siteName: "FrontendEngineers.com",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1456, height: 816, alt: "FrontendEngineers.com - Remote Frontend Developer Jobs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remote Frontend Developer Jobs | FrontendEngineers.com",
    description: "Discover curated remote frontend developer jobs with less competition. Find verified React, TypeScript, Vue, Angular, and Next.js roles. Updated daily.",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full overflow-x-clip`}
    >
      <body className="min-h-full flex flex-col antialiased bg-white text-gray-900 overflow-x-clip w-full max-w-full">
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
