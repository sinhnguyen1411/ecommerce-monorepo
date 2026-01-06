"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import SectionTitle from "@/components/common/SectionTitle";

export default function LoginPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const loginUrl = useMemo(() => {
    if (!origin) {
      return "";
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const redirect = encodeURIComponent(`${origin}/account`);
    return `${apiBase.replace(/\/$/, "")}/api/auth/google/login?redirect=${redirect}`;
  }, [origin]);

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="Tai khoan"
          title="Dang nhap"
          description="Su dung Google de truy cap tai khoan mua hang cua ban."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="rounded-[28px] border border-forest/10 bg-white/90 p-8 text-center">
          <p className="text-sm text-ink/70">
            Nhap vao Google de quan ly don hang, dia chi va uu dai.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild disabled={!loginUrl}>
              <a href={loginUrl || "#"}>Dang nhap bang Google</a>
            </Button>
            <Link href="/" className="btn-ghost">
              Quay ve trang chu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
