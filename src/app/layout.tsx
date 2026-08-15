import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
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
  title: "FrontendEngineers.com — Remote Frontend Jobs",
  description:
    "Discover the best remote frontend jobs for React, Vue, Angular, and UI/UX Engineers. Work from anywhere.",
  keywords: [
    "frontend jobs",
    "remote jobs",
    "react jobs",
    "vue jobs",
    "angular jobs",
    "frontend developer",
    "remote frontend",
  ],
  openGraph: {
    title: "FrontendEngineers.com — Remote Frontend Jobs",
    description:
      "Discover the best remote frontend jobs for React, Vue, Angular, and UI/UX Engineers.",
    type: "website",
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
      </body>
    </html>
  );
}
