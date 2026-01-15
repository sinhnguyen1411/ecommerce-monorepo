"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getRefreshToken, getUserToken } from "@/lib/auth";
import {
  requestForgotPasswordOTP,
  resetPassword,
  verifyForgotPasswordOTP
} from "@/lib/user-auth";

type Step = "request" | "verify" | "reset" | "done";
type Channel = "email" | "sms";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [channel, setChannel] = useState<Channel>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
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
    setNotice("");
    setLoading(true);
    setRequestId(null);
    try {
      const payload =
        channel === "email"
          ? { channel, email: email.trim() }
          : { channel, phone: phone.trim() };
      const result = await requestForgotPasswordOTP(payload);
      setCooldown(result.cooldown_seconds || 0);
      if (result.request_id) {
        setRequestId(result.request_id);
        setStep("verify");
      } else {
        setNotice("N?u t?i kho?n t?n t?i, m? ?? ???c g?i.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? g?i OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (!requestId) {
        throw new Error("Thi?u m? y?u c?u");
      }
      const result = await verifyForgotPasswordOTP({
        request_id: requestId,
        code: otpCode.trim()
      });
      setVerificationToken(result.verification_token);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? x?c minh OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await resetPassword({
        verification_token: verificationToken,
        new_password: newPassword
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? ??t l?i m?t kh?u");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="T?i kho?n"
          title="Qu?n m?t kh?u"
          description="X?c minh email ho?c s? ?i?n tho?i ?? ??t l?i m?t kh?u."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8">
          {notice ? <p className="mb-4 text-sm text-ink/70">{notice}</p> : null}
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

          {step === "reset" ? (
            <form className="grid gap-4" onSubmit={handleReset}>
              <input
                className="field"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="M?t kh?u m?i"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "?ang ??t l?i..." : "??t l?i m?t kh?u"}
              </Button>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="grid gap-3 text-sm">
              <p>M?t kh?u ?? ???c ??t l?i.</p>
              <Link className="text-forest" href="/login">
                Quay l?i ??ng nh?p
              </Link>
            </div>
          ) : null}

          <div className="mt-6 text-xs text-ink/70">
            Nh? m?t kh?u?{" "}
            <Link className="text-forest" href="/login">
              ??ng nh?p
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
