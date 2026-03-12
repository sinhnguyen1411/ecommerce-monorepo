"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import AuthBrandStrip from "@/components/auth/AuthBrandStrip";
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

  const handleRequest = async (event?: FormEvent<HTMLFormElement>) => {
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
        setNotice("Nếu tài khoản tồn tại, mã OTP đã được gửi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (!requestId) {
        throw new Error("Thiếu yêu cầu OTP");
      }
      const result = await verifyForgotPasswordOTP({
        request_id: requestId,
        code: otpCode.trim()
      });
      setVerificationToken(result.verification_token);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xác minh OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
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
      setError(err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell auth-shell--focused">
      <section className="section-shell pb-16 pt-10 md:pt-14">
        <div className="auth-grid auth-grid--single">
          <div className="auth-page-stack">
            <AuthBrandStrip />
            <div className="auth-card auth-card--compact auth-card--center">
              <SectionTitle
                eyebrow="Tài khoản"
                title="Quên mật khẩu"
                description="Xác minh email và đặt lại mật khẩu trong 3 bước."
              />

              {notice ? <p className="auth-global-notice">{notice}</p> : null}
              {error ? (
                <div
                  className="auth-global-error"
                  role="alert"
                  aria-live="polite"
                  data-testid="auth-global-error"
                >
                  {error}
                </div>
              ) : null}

              {step === "request" ? (
                <form className="grid gap-3" onSubmit={handleRequest}>
                  <div>
                    <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      className="field"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@gmail.com"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi OTP"}
                  </Button>
                </form>
              ) : null}

              {step === "verify" ? (
                <form className="grid gap-3" onSubmit={handleVerify}>
                  <div>
                    <label htmlFor="forgot-otp" className="mb-1 block text-sm font-medium">
                      Mã OTP
                    </label>
                    <input
                      id="forgot-otp"
                      className="field"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      placeholder="Nhập mã OTP"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Đang xác minh..." : "Xác minh OTP"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || cooldown > 0}
                    onClick={() => handleRequest()}
                  >
                    {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại"}
                  </Button>
                </form>
              ) : null}

              {step === "reset" ? (
                <form className="grid gap-3" onSubmit={handleReset}>
                  <div>
                    <label htmlFor="forgot-password" className="mb-1 block text-sm font-medium">
                      Mật khẩu mới
                    </label>
                    <input
                      id="forgot-password"
                      className="field"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                  </Button>
                </form>
              ) : null}

              {step === "done" ? (
                <div className="grid gap-3 text-sm">
                  <p>Đặt lại mật khẩu thành công.</p>
                  <Link className="text-forest" href="/login">
                    Quay lại đăng nhập
                  </Link>
                </div>
              ) : null}

              <div className="auth-footer-links">
                <Link className="text-forest" href="/login">
                  Nhớ mật khẩu rồi? Đăng nhập
                </Link>
                <Link className="text-forest" href="/">
                  Quay về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

