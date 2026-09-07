"use client";

import Script from "next/script";

export default function GlobalAdSense() {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  // We MUST render this script unconditionally so Google's crawler can see it in the raw HTML.
  // Pro users are protected from ads because the inner AdUnits (in JobsClientPage/JobDetail) are hidden via auth checks.
  if (!pubId) return null;

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
    />
  );
}
