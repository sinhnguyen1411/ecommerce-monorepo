"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AuthBrandStrip from "@/components/auth/AuthBrandStrip";
import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/account";
import { ApiError } from "@/lib/api-error";
import { normalizeNextPath, resolveAuthenticatedPath } from "@/lib/onboarding";
import { requestLoginOTP, verifyLoginOTP } from "@/lib/user-auth";

type Step = "email" | "otp";

function isGmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com")
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [otpOpen, setOtpOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    []
  );
  const nextPath = useMemo(
    () => normalizeNextPath(searchParams.get("next"), "/account"),
    [searchParams]
  );

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) {
          router.replace(
            resolveAuthenticatedPath(profile.onboarding_required, nextPath, "/account")
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [nextPath, router]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

  const handleGoogleSignup = () => {
    const search = new URLSearchParams({ redirect: nextPath });
    window.location.href = `${apiBaseUrl}/api/auth/google/start?${search.toString()}`;
  };

  const handleRequestOtp = async () => {
    const trimmed = email.trim();
    setError("");
    if (!isGmail(trimmed)) {
      setError("Đăng ký OTP chỉ hỗ trợ Gmail.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestLoginOTP({ email: trimmed });
      setRequestId(result.request_id);
      setCooldown(result.cooldown_seconds || 0);
      setStep("otp");
      setOtpOpen(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể gửi OTP. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!requestId) {
      setError("Thiếu request OTP. Vui lòng gửi lại mã.");
      return;
    }
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }
    setError("");
    setVerifying(true);
    try {
      const result = await verifyLoginOTP({ request_id: requestId, code: otp.trim() });
      router.replace(
        resolveAuthenticatedPath(
          Boolean(result.user?.onboarding_required),
          nextPath,
          "/account"
        )
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Xác thực OTP thất bại.");
      }
    } finally {
      setVerifying(false);
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
                title="Tạo tài khoản"
                description="Đăng ký bằng Google hoặc OTP Gmail. Sau xác thực, hệ thống sẽ yêu cầu bổ sung hồ sơ trong Tài khoản của tôi."
              />

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

              <button
                type="button"
                className="auth-provider"
                onClick={handleGoogleSignup}
              >
                <span className="auth-provider__icon" aria-hidden="true">
                  <svg viewBox="0 0 533.5 544.3" role="img" aria-label="Google">
                    <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.4H272v95.3h146.9c-6.3 34-25 62.8-53.3 82v68h86.1c50.3-46.3 81.8-114.5 81.8-194.9z"/>
                    <path fill="#34A853" d="M272 544.3c72.7 0 133.7-24.1 178.2-65.5l-86.1-68c-24 16.1-54.7 25.6-92.1 25.6-70.9 0-130.9-47.9-152.4-112.1h-89.3v70.4C74.6 475.5 167 544.3 272 544.3z"/>
                    <path fill="#FBBC05" d="M119.6 324.3c-10.1-30.4-10.1-63.3 0-93.7v-70.4h-89.3c-39.4 78.6-39.4 171.7 0 250.3l89.3-70.2z"/>
                    <path fill="#EA4335" d="M272 107.7c39.5-.6 77.5 14 106.5 40.9l79.4-79.4C407.1 24.2 341.3-1.4 272 0 167 0 74.6 68.9 30.3 159.8l89.3 70.4c21.4-64.2 81.5-112.1 152.4-112.5z"/>
                  </svg>
                </span>
                <span>Tiếp tục với Google</span>
              </button>

              <div className="auth-divider auth-divider--with-text">
                <span>Hoặc đăng ký với OTP Gmail</span>
              </div>

              <div className="auth-method">
                <button
                  type="button"
                  className="auth-method-toggle"
                  onClick={() => {
                    setOtpOpen((prev) => !prev);
                    setError("");
                  }}
                  data-testid="signup-otp-toggle"
                  aria-expanded={otpOpen}
                >
                  Mở đăng ký OTP
                </button>

                {otpOpen ? (
                  <div className="mt-3 grid gap-3">
                    {step === "email" ? (
                      <>
                        <div>
                          <label htmlFor="signup-email" className="mb-1 block text-sm font-medium">
                            Gmail
                          </label>
                          <input
                            id="signup-email"
                            data-testid="signup-otp-email"
                            type="email"
                            className="field"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setError("");
                            }}
                            placeholder="you@gmail.com"
                          />
                        </div>
                        <Button
                          type="button"
                          data-testid="signup-otp-request"
                          disabled={loading}
                          onClick={handleRequestOtp}
                        >
                          {loading ? "Đang gửi..." : "Gửi OTP đăng ký"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-ink/70">
                          Nhập OTP đã gửi tới{" "}
                          <span className="font-semibold text-ink">{email.trim()}</span>
                        </div>
                        <div>
                          <label htmlFor="signup-otp" className="mb-1 block text-sm font-medium">
                            Mã OTP
                          </label>
                          <input
                            id="signup-otp"
                            data-testid="signup-otp-code"
                            className="field"
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="Nhập mã OTP"
                          />
                        </div>
                        <Button
                          type="button"
                          data-testid="signup-otp-verify"
                          disabled={verifying}
                          onClick={handleVerifyOtp}
                        >
                          {verifying ? "Đang xác thực..." : "Xác thực OTP"}
                        </Button>
                        <div className="text-xs text-ink/60">
                          {cooldown > 0 ? (
                            <>Gửi lại sau {cooldown}s</>
                          ) : (
                            <button
                              type="button"
                              className="cursor-pointer text-forest underline"
                              onClick={handleRequestOtp}
                            >
                              Gửi lại mã
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          className="auth-link"
                          onClick={() => {
                            setStep("email");
                            setOtp("");
                            setError("");
                          }}
                        >
                          Quay lại nhập Gmail
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="auth-method-note">
                    Dùng OTP nếu bạn chưa muốn liên kết ngay với Google.
                  </p>
                )}
              </div>

              <div className="auth-footer-links">
                <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-forest">
                  Đã có tài khoản? Đăng nhập
                </Link>
                <Link href="/" className="text-forest">
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

