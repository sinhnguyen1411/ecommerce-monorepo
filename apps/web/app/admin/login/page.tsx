"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
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
      setError(err instanceof Error ? err.message : "??ng nh?p th?t b?i");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="section-shell pb-16 pt-14">
        <div className="auth-grid auth-grid--single">
          <div className="auth-card auth-card--wide auth-card--center">
            <SectionTitle
              eyebrow="Admin"
              title="??ng nh?p qu?n tr?"
              description="Ch? d?nh cho nh?n vi?n qu?n tr? n?i b?."
            />
            {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
            <form className="grid gap-4" onSubmit={handleLogin}>
              <input
                className="field"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                className="field"
                placeholder="M?t kh?u"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "?ang x? l?..." : "??ng nh?p"}
              </Button>
            </form>
            <div className="mt-5 text-xs text-ink/70 text-center">
              <Link href="/" className="text-forest">
                V? trang ch?
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
