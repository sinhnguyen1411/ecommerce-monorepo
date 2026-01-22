"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminLogin } from "@/lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin({ email, password });
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-xs">
                Khu vực quản trị
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Đăng nhập quản trị
              </h1>
            </div>
          </div>
          <p className="mt-3 text-base text-slate-500 md:text-sm">
            Dành cho nhân viên quản trị nội bộ. Vui lòng sử dụng tài khoản được cấp.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-700 md:text-sm">
              {error}
            </div>
          ) : null}

          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className="grid gap-2 text-base font-semibold text-slate-700 md:text-sm">
              Email đăng nhập
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm"
                placeholder="admin@tam-bo.vn"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-base font-semibold text-slate-700 md:text-sm">
              Mật khẩu
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm"
                placeholder="Nhập mật khẩu"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-[var(--color-cta)] text-white hover:brightness-110 normal-case text-base md:text-sm cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-base text-slate-500 md:text-sm">
            <span>Quay lại website</span>
            <Link
              href="/"
              className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
