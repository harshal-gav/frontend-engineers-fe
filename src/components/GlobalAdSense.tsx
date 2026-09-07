"use client";

import { useAuth } from "@/context/AuthContext";
import Script from "next/script";

export default function GlobalAdSense() {
  const { isSubscribed, loading } = useAuth();
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  // Do not render AdSense scripts for Pro members or if Publisher ID is missing
  // We MUST render this script even if ADS_ENABLED is false so Google can verify the site!
  if (loading || isSubscribed || !pubId) return null;

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
    />
  );
}
