"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { adminLogin } from "@/lib/admin";

function formatRetryAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const now = new Date();
  const timeText = parsed.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sameDay = parsed.toDateString() === now.toDateString();
  if (sameDay) {
    return `Hãy thử lại vào ${timeText}.`;
  }
  const dateText = parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
  return `Hãy thử lại vào ${timeText} ngày ${dateText}.`;
}

function mapAdminLoginError(err: ApiError) {
  if (err.code === "account_locked") {
    return "Tài khoản quản trị đang bị khóa tạm thời.";
  }
  if (err.code === "login_rate_limited" || err.code === "rate_limited") {
    return "Bạn đã thử đăng nhập quá nhiều lần.";
  }
  if (
    err.code === "invalid_credentials" ||
    err.message === "Invalid credentials"
  ) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (err.message.includes("Too many failed attempts")) {
    return "Sai thông tin đăng nhập. Nhiều lần sai có thể khóa tài khoản tạm thời.";
  }
  return err.message;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [retryAt, setRetryAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setRetryAt(null);
    setLoading(true);
    try {
      await adminLogin({ email, password });
      router.push("/admin");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(mapAdminLoginError(err));
        if (err.retryAt) {
          setRetryAt(err.retryAt);
        }
      } else {
        setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
      }
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
            Dành cho nhân viên quản trị nội bộ. Vui lòng sử dụng tài khoản được
            cấp.
          </p>

          {error ? (
            <div
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-900 md:text-sm"
              aria-live="polite"
            >
              <div className="font-semibold">{error}</div>
              {retryAt ? (
                <p className="mt-1 text-xs text-amber-800">
                  {formatRetryAt(retryAt)}
                </p>
              ) : null}
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
