"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

interface AdUnitProps {
  slotId: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
  style?: React.CSSProperties;
}

export default function AdUnit({
  slotId,
  format = "auto",
  className = "",
  style,
}: AdUnitProps) {
  const { isSubscribed, loading } = useAuth();
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;
  const isAdsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  useEffect(() => {
    // Only push if auth is loaded, user is not subscribed, pubId exists, and ads are enabled
    if (!loading && !isSubscribed && pubId && isAdsEnabled) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [loading, isSubscribed, pubId]);

  if (loading || isSubscribed || !pubId || !isAdsEnabled) return null;

  return (
    <div className={`ad-container ${className}`}>
      <span className="text-[10px] uppercase text-gray-600 tracking-wider mb-2 block text-center">
        Advertisement
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={pubId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
