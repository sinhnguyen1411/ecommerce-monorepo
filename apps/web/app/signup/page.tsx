"use client";

import Link from "next/link";

import SectionTitle from "@/components/common/SectionTitle";

export default function SignupPage() {
  return (
    <div className="auth-shell">
      <section className="section-shell pb-16 pt-14">
        <div className="auth-grid auth-grid--single">
          <div className="auth-card auth-card--compact auth-card--center">
            <SectionTitle
              eyebrow="Tài khoản"
              title="Đăng ký"
              description="Tài khoản mới chỉ hỗ trợ đăng nhập bằng Google hoặc OTP Gmail."
            />
            <Link href="/login" className="button">
              {"Đến trang đăng nhập"}
            </Link>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-ink/70">
              <Link href="/" className="text-forest">
                {"Quay về trang chủ"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
