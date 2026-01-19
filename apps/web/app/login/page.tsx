"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getRefreshToken, getUserToken, setAuthTokens } from "@/lib/auth";
import { login } from "@/lib/user-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getUserToken() || getRefreshToken()) {
      router.replace("/account");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });
      setAuthTokens(result.access_token, result.refresh_token);
      router.push("/account");
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
          eyebrow="Account"
          title="Sign in"
          description="Login with email and password."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8">
          {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <input
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
            />
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink/70">
            <Link className="text-forest" href="/signup">
              Create account
            </Link>
            <span className="text-ink/40">|</span>
            <Link className="text-forest" href="/forgot-password">
              Forgot password
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/" className="button btnlight">
              Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
