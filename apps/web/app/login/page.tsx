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
          eyebrow="Tài khoản"
          title="Đăng nhập"
          description="Sử dụng Google để truy cập tài khoản mua hàng của bạn."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8 text-center">
          <p className="text-sm text-ink/70">
            Nhập vào Google để quản lý đơn hàng, địa chỉ và ưu đãi.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild disabled={!loginUrl}>
              <a href={loginUrl || "#"}>Đăng nhập bằng Google</a>
            </Button>
            <Link href="/" className="button btnlight">
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
