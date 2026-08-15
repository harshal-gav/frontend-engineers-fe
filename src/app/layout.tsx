import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    default: "FrontendEngineers.com — Premium Remote Frontend Jobs",
    template: "%s | FrontendEngineers.com"
  },
  description: "The #1 premium job board for remote frontend developers. Discover hand-curated React, Vue, Angular, and UI/UX engineering jobs at top tech companies.",
  keywords: [
    "frontend jobs",
    "remote frontend jobs",
    "react developer jobs",
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
    "nextjs jobs"
  ],
  authors: [{ name: "FrontendEngineers.com" }],
  creator: "FrontendEngineers.com",
  publisher: "FrontendEngineers.com",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FrontendEngineers.com — Premium Remote Frontend Jobs",
    description: "The #1 premium job board for remote frontend developers. Discover hand-curated React, Vue, Angular, and UI/UX engineering jobs at top tech companies.",
    url: "https://frontendengineers.com",
    siteName: "FrontendEngineers.com",
    locale: "en_US",
    type: "website",
    // images: [{ url: "/og-image.png", width: 1200, height: 630 }], // Note: upload an og-image.png to /public for this to work
  },
  twitter: {
    card: "summary_large_image",
    title: "FrontendEngineers.com — Premium Remote Frontend Jobs",
    description: "The #1 premium job board for remote frontend developers. Discover hand-curated React, Vue, Angular, and UI/UX engineering jobs at top tech companies.",
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
      </body>
    </html>
  );
}
