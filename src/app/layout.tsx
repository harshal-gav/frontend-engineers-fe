import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    default: "Best Remote Frontend Jobs | Premium JavaScript & TypeScript Roles",
    template: "%s | Best Remote Frontend Jobs"
  },
  description: "Discover the best remote frontend jobs and fullstack JavaScript & TypeScript roles. We curate premium, 100% remote positions for React, Vue, Angular, and Node.js engineers.",
  keywords: [
    "best remote frontend jobs",
    "remote frontend jobs",
    "frontend jobs",
    "remote react jobs",
    "vue developer jobs",
    "angular developer jobs",
    "ui engineer jobs",
    "ux engineer jobs",
    "software engineer remote",
    "web developer jobs remote",
    "front end engineering",
    "remote tech jobs",
    "typescript jobs",
    "javascript jobs",
    "nextjs jobs",
    "best remote jobs"
  ],
  authors: [{ name: "Best Remote Frontend Jobs" }],
  creator: "Best Remote Frontend Jobs",
  publisher: "Best Remote Frontend Jobs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "your-google-verification-code-here",
  },
  openGraph: {
    title: "Best Remote Frontend Jobs | Premium JavaScript & TypeScript Roles",
    description: "Discover the best remote frontend jobs and fullstack JavaScript & TypeScript roles. We curate premium, 100% remote positions for React, Vue, Angular, and Node.js engineers.",
    url: "https://frontendengineers.com",
    siteName: "Best Remote Frontend Jobs",
    locale: "en_US",
    type: "website",
    // images: [{ url: "/og-image.png", width: 1200, height: 630 }], // Note: upload an og-image.png to /public for this to work
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Remote Frontend Jobs | Premium JavaScript & TypeScript Roles",
    description: "Discover the best remote frontend jobs and fullstack JavaScript & TypeScript roles. We curate premium, 100% remote positions for React, Vue, Angular, and Node.js engineers.",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased bg-[#0a0a0a] text-white">
        <div className="bg-mesh" aria-hidden="true" />
        <AuthProvider>
          <div className="relative z-10 flex flex-col min-h-full">
            {children}
          </div>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
