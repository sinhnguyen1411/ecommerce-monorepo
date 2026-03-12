"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { buildCompleteProfileHref, normalizeNextPath } from "@/lib/onboarding";

export default function CompleteProfilePage() {
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
      <p className="text-sm text-ink/70">Đang chuyển về tài khoản của tôi...</p>
    </div>
  );
}
