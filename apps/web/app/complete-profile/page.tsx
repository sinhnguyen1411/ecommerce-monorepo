"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

import { buildCompleteProfileHref, normalizeNextPath } from "@/lib/onboarding";

function CompleteProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => normalizeNextPath(searchParams.get("next"), "/account"),
    [searchParams]
  );

  useEffect(() => {
    router.replace(buildCompleteProfileHref(nextPath, "/account"));
  }, [nextPath, router]);

  return (
    <div className="section-shell pb-16 pt-14">
      <p className="text-sm text-ink/70">Redirecting to your account...</p>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="section-shell pb-16 pt-14 text-sm text-ink/70">Loading...</div>}>
      <CompleteProfilePageContent />
    </Suspense>
  );
}
