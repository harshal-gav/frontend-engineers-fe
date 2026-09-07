"use client";

import { useAuth } from "@/context/AuthContext";
import Script from "next/script";

export default function GlobalAdSense() {
  const { isSubscribed, loading } = useAuth();
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;
  const isAdsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  // Do not render AdSense scripts for Pro members, if Publisher ID is missing, or if ads are disabled pending approval
  if (loading || isSubscribed || !pubId || !isAdsEnabled) return null;

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
    />
  );
}
