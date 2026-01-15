"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getRefreshToken, getUserToken, setAuthTokens } from "@/lib/auth";
import {
  completeSignup,
  requestSignupOTP,
  verifySignupOTP
} from "@/lib/user-auth";

type Step = "request" | "verify" | "complete";

type Channel = "email" | "sms";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [channel, setChannel] = useState<Channel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getUserToken() || getRefreshToken()) {
      router.replace("/account");
    }
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const helperText = useMemo(() => {
    return channel === "email"
      ? "Ch?ng t?i s? g?i m? ??n email c?a b?n."
      : "Ch?ng t?i s? g?i m? ??n s? ?i?n tho?i di ??ng Vi?t Nam c?a b?n.";
  }, [channel]);

  const handleRequest = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload =
        channel === "email"
          ? { channel, email: email.trim() }
          : { channel, phone: phone.trim() };
      const result = await requestSignupOTP(payload);
      setRequestId(result.request_id);
      setCooldown(result.cooldown_seconds || 0);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? g?i OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!requestId) {
        throw new Error("Thi?u m? y?u c?u");
      }
      const result = await verifySignupOTP({ request_id: requestId, code: otpCode.trim() });
      setVerificationToken(result.verification_token);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? x?c minh OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await completeSignup({
        verification_token: verificationToken,
        password,
        full_name: fullName.trim() || undefined,
        address: address.trim() || undefined
      });
      setAuthTokens(result.access_token, result.refresh_token);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? ho?n t?t ??ng k?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="T?i kho?n"
          title="T?o t?i kho?n"
          description="X?c minh email ho?c s? ?i?n tho?i ?? ho?n t?t ??ng k?."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8">
          {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
          {step === "request" ? (
            <form className="grid gap-4" onSubmit={handleRequest}>
              <div className="flex flex-wrap gap-3 text-xs font-semibold">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="channel"
                    value="email"
                    checked={channel === "email"}
                    onChange={() => setChannel("email")}
                  />
                  Email
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="channel"
                    value="sms"
                    checked={channel === "sms"}
                    onChange={() => setChannel("sms")}
                  />
                  S? ?i?n tho?i
                </label>
              </div>
              {channel === "email" ? (
                <input
                  className="field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="??a ch? email"
                />
              ) : (
                <input
                  className="field"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="S? ?i?n tho?i Vi?t Nam (0xxxxxxxxx)"
                />
              )}
              <p className="text-xs text-ink/60">{helperText}</p>
              <Button type="submit" disabled={loading}>
                {loading ? "?ang g?i..." : "G?i m?"}
              </Button>
            </form>
          ) : null}

          {step === "verify" ? (
            <form className="grid gap-4" onSubmit={handleVerify}>
              <input
                className="field"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="M? 6 ch? s?"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "?ang x?c minh..." : "X?c minh OTP"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || cooldown > 0}
                  onClick={() => handleRequest()}
                >
                  {cooldown > 0 ? `G?i l?i sau ${cooldown}s` : "G?i l?i"}
                </Button>
              </div>
            </form>
          ) : null}

          {step === "complete" ? (
            <form className="grid gap-4" onSubmit={handleComplete}>
              <input
                className="field"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="H? v? t?n"
              />
              <input
                className="field"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="M?t kh?u"
              />
              <input
                className="field"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="??a ch? (t?y ch?n)"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "?ang t?o t?i kho?n..." : "Ho?n t?t ??ng k?"}
              </Button>
            </form>
          ) : null}

          <div className="mt-6 text-xs text-ink/70">
            ?? c? t?i kho?n? <Link className="text-forest" href="/login">??ng nh?p</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
