"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { adminLogin } from "@/lib/admin";
import { setAdminToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await adminLogin({ email, password });
      setAdminToken(response.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="Admin"
          title="Đăng nhập quản trị"
          description="Chỉ dành cho nhân viên quản lý nội bộ."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8">
          {error ? <p className="text-sm text-clay">{error}</p> : null}
          <div className="mt-4 grid gap-3">
            <input
              className="field"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="field"
              placeholder="Mật khẩu"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleLogin} disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
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
