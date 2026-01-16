"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getRefreshToken, getUserToken, setAuthTokens } from "@/lib/auth";
import { login } from "@/lib/user-auth";

export default function LoginPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (getUserToken() || getRefreshToken()) {
      router.replace("/account");
    }
  }, [router]);

  const loginUrl = useMemo(() => {
    if (!origin) {
      return "";
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const redirect = encodeURIComponent(`${origin}/account`);
    return `${apiBase.replace(/\/$/, "")}/api/auth/google/login?redirect=${redirect}`;
  }, [origin]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ identifier, password });
      setAuthTokens(result.access_token, result.refresh_token);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Đăng nhập"
          description="Đăng nhập bằng email hoặc số điện thoại và mật khẩu."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8">
          {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <input
              className="field"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email hoặc số điện thoại"
            />
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink/70">
            <Link className="text-forest" href="/signup">
              Tạo tài khoản
            </Link>
            <span className="text-ink/40">|</span>
            <Link className="text-forest" href="/forgot-password">
              Quên mật khẩu
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild disabled={!loginUrl}>
              <a href={loginUrl || "#"}>Đăng nhập bằng Google</a>
            </Button>
            <Link href="/" className="button btnlight">
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
