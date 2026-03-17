"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { shouldTrackStorefrontPath } from "@/lib/auth-route";

const analyticsBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(
  /\/$/,
  ""
);
const disableStorefrontTracker = process.env.NEXT_PUBLIC_DISABLE_STOREFRONT_TRACKER === "1";

export default function StorefrontAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (disableStorefrontTracker) {
      return;
    }

    if (!shouldTrackStorefrontPath(pathname)) {
      return;
    }

    void fetch(`${analyticsBaseUrl}/api/analytics/pageview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pathname }),
      keepalive: true,
    }).catch(() => {
      // Tracking must never block rendering or navigation.
    });
  }, [pathname]);

  return null;
}
