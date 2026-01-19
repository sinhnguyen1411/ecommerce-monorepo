"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getRefreshToken, getUserToken, setAuthTokens } from "@/lib/auth";
import { register } from "@/lib/user-auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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
      const result = await register({
        email: email.trim(),
        name: name.trim(),
        dob: dob.trim(),
        phone: phone.trim() || undefined,
        address: address.trim(),
        password,
        password_confirm: passwordConfirm
      });
      setAuthTokens(result.access_token, result.refresh_token);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="Account"
          title="Create account"
          description="Register with email and password."
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
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
            />
            <input
              className="field"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
              placeholder="DOB (YYYY-MM-DD)"
            />
            <input
              className="field"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone (optional)"
            />
            <input
              className="field"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Address"
            />
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
            <input
              className="field"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="Confirm password"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-ink/70">
            Already have an account? <Link className="text-forest" href="/login">Sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
