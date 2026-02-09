"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/account";
import { login } from "@/lib/user-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile()
      .then(() => {
        if (active) {
          router.replace("/account");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="section-shell pb-16 pt-14">
        <div className="auth-grid auth-grid--single">
          <div className="auth-card auth-card--compact auth-card--center">
            <SectionTitle
              eyebrow="Tài khoản"
              title="Đăng nhập"
              description="Đăng nhập bằng email và mật khẩu."
            />
            {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <input
                className="field"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
              />
              <div className="auth-password">
                <input
                  className="field"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" disabled={loading} className="font-semibold">
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
            <Link className="auth-link" href="/forgot-password">
              {"Quên mật khẩu?"}
            </Link>
            <div className="auth-divider" />
            <Link href="/signup" className="button auth-secondary">
              {"Tạo tài khoản mới"}
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

