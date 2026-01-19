"use client";

import { useEffect, useState } from "react";
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
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

  const handleRequest = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    setRequestId(null);
    try {
      const result = await requestForgotPasswordOTP({ email: email.trim() });
      setCooldown(result.cooldown_seconds || 0);
      if (result.request_id) {
        setRequestId(result.request_id);
        setStep("verify");
      } else {
        setNotice("If the account exists, an OTP was sent.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
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
        throw new Error("Missing request");
      }
      const result = await verifyForgotPasswordOTP({
        request_id: requestId,
        code: otpCode.trim()
      });
      setVerificationToken(result.verification_token);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
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
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="Account"
          title="Forgot password"
          description="Verify email and reset your password."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="border border-forest/10 bg-white p-8">
          {notice ? <p className="mb-4 text-sm text-ink/70">{notice}</p> : null}
          {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}

          {step === "request" ? (
            <form className="grid gap-4" onSubmit={handleRequest}>
              <input
                className="field"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : null}

          {step === "verify" ? (
            <form className="grid gap-4" onSubmit={handleVerify}>
              <input
                className="field"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="OTP"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || cooldown > 0}
                  onClick={() => handleRequest()}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
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
                placeholder="New password"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="grid gap-3 text-sm">
              <p>Password reset successful.</p>
              <Link className="text-forest" href="/login">
                Back to login
              </Link>
            </div>
          ) : null}

          <div className="mt-6 text-xs text-ink/70">
            Remember your password?{" "}
            <Link className="text-forest" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
