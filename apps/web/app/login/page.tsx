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
import { login, requestLoginOTP, verifyLoginOTP } from "@/lib/user-auth";

type OtpStep = "email" | "otp";

function isGmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com")
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    []
  );
  const nextPath = useMemo(
    () => normalizeNextPath(searchParams.get("next"), "/account"),
    [searchParams]
  );
  const signupHref = useMemo(() => {
    return `/signup?next=${encodeURIComponent(nextPath)}`;
  }, [nextPath]);

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

  const clearFormErrors = () => {
    setEmailError("");
    setPasswordError("");
    setAuthError("");
  };

  const handleGoogleLogin = () => {
    const search = new URLSearchParams({ redirect: nextPath });
    window.location.href = `${apiBaseUrl}/api/auth/google/start?${search.toString()}`;
  };

  const handlePasswordLogin = async (input?: { email: string; password: string }) => {
    const trimmedEmail = (input?.email || email).trim();
    const passwordValue = input?.password || password;
    const nextErrors = {
      email: trimmedEmail ? "" : "Vui lòng nhập email.",
      password: passwordValue ? "" : "Vui lòng nhập mật khẩu."
    };
    setEmailError(nextErrors.email);
    setPasswordError(nextErrors.password);
    setAuthError("");
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await login({ email: trimmedEmail, password: passwordValue });
      router.replace(
        resolveAuthenticatedPath(
          Boolean(result.user?.onboarding_required),
          nextPath,
          "/account"
        )
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleOtp = () => {
    setOtpOpen((prev) => !prev);
    setAuthError("");
  };

  const handleRequestOtp = async () => {
    const trimmed = email.trim();
    clearFormErrors();
    if (!isGmail(trimmed)) {
      setAuthError("OTP chỉ hỗ trợ Gmail.");
      return;
    }
    setOtpLoading(true);
    try {
      const result = await requestLoginOTP({ email: trimmed });
      setRequestId(result.request_id);
      setCooldown(result.cooldown_seconds || 0);
      setOtpStep("otp");
      setOtpOpen(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError("Không thể gửi OTP. Vui lòng thử lại.");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!requestId) {
      setAuthError("Thiếu request OTP. Vui lòng gửi lại mã.");
      return;
    }
    if (!otp.trim()) {
      setAuthError("Vui lòng nhập mã OTP.");
      return;
    }
    setAuthError("");
    setOtpVerifying(true);
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
        setAuthError(err.message);
      } else {
        setAuthError("Xác thực OTP thất bại.");
      }
    } finally {
      setOtpVerifying(false);
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
                title="Đăng nhập"
                description="Đăng nhập nhanh bằng Email + Mật khẩu, Google hoặc OTP Gmail."
              />

              {authError ? (
                <div
                  className="auth-global-error"
                  role="alert"
                  aria-live="polite"
                  data-testid="auth-global-error"
                >
                  {authError}
                </div>
              ) : null}

              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  void handlePasswordLogin({
                    email: String(formData.get("email") || ""),
                    password: String(formData.get("password") || "")
                  });
                }}
              >
                <div>
                  <label htmlFor="login-email" className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    data-testid="login-email"
                    type="email"
                    className="field"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError("");
                      setAuthError("");
                    }}
                    placeholder="you@gmail.com"
                  />
                  {emailError ? <p className="auth-field-error">{emailError}</p> : null}
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-1 block text-sm font-medium">
                    Mật khẩu
                  </label>
                  <input
                    id="login-password"
                    name="password"
                    data-testid="login-password"
                    type="password"
                    className="field"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError("");
                      setAuthError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === "NumpadEnter") {
                        event.preventDefault();
                        void handlePasswordLogin();
                      }
                    }}
                    onKeyUp={(event) => {
                      if (event.key === "Enter" || event.key === "NumpadEnter") {
                        event.preventDefault();
                        void handlePasswordLogin({
                          email,
                          password: event.currentTarget.value
                        });
                      }
                    }}
                    placeholder="Nhập mật khẩu"
                  />
                  {passwordError ? <p className="auth-field-error">{passwordError}</p> : null}
                </div>
                <Button
                  type="submit"
                  data-testid="login-password-submit"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>

              <p className="auth-trust-note">
                Phiên đăng nhập được bảo vệ bằng rate-limit, OTP cooldown và cookie bảo mật.
              </p>

              <div className="auth-divider auth-divider--with-text">
                <span>Hoặc tiếp tục với</span>
              </div>

              <button
                type="button"
                className="auth-provider"
                onClick={handleGoogleLogin}
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

              <div className="auth-divider" />

              <div className="auth-method">
                <button
                  type="button"
                  className="auth-method-toggle"
                  onClick={handleToggleOtp}
                  data-testid="login-otp-toggle"
                  aria-expanded={otpOpen}
                >
                  Đăng nhập bằng OTP Gmail
                </button>

                {otpOpen ? (
                  <div className="mt-3 grid gap-3">
                    {otpStep === "email" ? (
                      <>
                        <div>
                          <label htmlFor="otp-email" className="mb-1 block text-sm font-medium">
                            Gmail
                          </label>
                          <input
                            id="otp-email"
                            data-testid="login-otp-email"
                            type="email"
                            className="field"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setAuthError("");
                            }}
                            placeholder="you@gmail.com"
                          />
                        </div>
                        <Button
                          type="button"
                          data-testid="login-otp-request"
                          disabled={otpLoading}
                          onClick={handleRequestOtp}
                        >
                          {otpLoading ? "Đang gửi..." : "Gửi OTP"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-ink/70">
                          Nhập OTP đã gửi tới{" "}
                          <span className="font-semibold text-ink">{email.trim()}</span>
                        </div>
                        <div>
                          <label htmlFor="otp-code" className="mb-1 block text-sm font-medium">
                            Mã OTP
                          </label>
                          <input
                            id="otp-code"
                            data-testid="login-otp-code"
                            className="field"
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="Nhập mã OTP"
                          />
                        </div>
                        <Button
                          type="button"
                          data-testid="login-otp-verify"
                          disabled={otpVerifying}
                          onClick={handleVerifyOtp}
                        >
                          {otpVerifying ? "Đang xác thực..." : "Xác thực OTP"}
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
                            setOtpStep("email");
                            setOtp("");
                            setAuthError("");
                          }}
                        >
                          Quay lại nhập Gmail
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="auth-method-note">
                    Dùng Gmail để nhận OTP và đăng nhập không cần mật khẩu.
                  </p>
                )}
              </div>

              <div className="auth-footer-links">
                <Link href={signupHref} className="text-forest">
                  Tạo tài khoản
                </Link>
                <Link href="/forgot-password" className="text-forest">
                  Quên mật khẩu
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
