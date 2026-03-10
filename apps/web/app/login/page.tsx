"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/account";
import { ApiError } from "@/lib/api-error";
import { requestLoginOTP, verifyLoginOTP } from "@/lib/user-auth";

type Step = "email" | "otp";

function isGmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com")
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    []
  );

  useEffect(() => {
    let active = true;
    getProfile()
      .then(() => {
        if (active) {
          router.replace("/account");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

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

  const handleGoogleLogin = () => {
    window.location.href = `${apiBaseUrl}/api/auth/google/start?redirect=/account`;
  };

  const handleRequestOtp = async () => {
    const trimmed = email.trim();
    setError("");
    setOtpError("");
    if (!isGmail(trimmed)) {
      setError("Chỉ hỗ trợ đăng nhập bằng Gmail.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestLoginOTP({ email: trimmed });
      setRequestId(result.request_id);
      setCooldown(result.cooldown_seconds || 0);
      setStep("otp");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể gửi mã xác thực. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!requestId) {
      setOtpError("Thiếu mã yêu cầu. Vui lòng thử lại.");
      return;
    }
    setOtpError("");
    setVerifying(true);
    try {
      await verifyLoginOTP({ request_id: requestId, code: otp.trim() });
      router.push("/account");
    } catch (err) {
      if (err instanceof ApiError) {
        setOtpError(err.message);
      } else {
        setOtpError("Xác thực thất bại. Vui lòng thử lại.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
    setOtpError("");
  };

  return (
    <div className="auth-shell">
      <section className="section-shell pb-16 pt-14">
        <div className="auth-grid auth-grid--single">
          <div className="auth-card auth-card--compact auth-card--center">
            <SectionTitle
              eyebrow="Tài khoản"
              title="Đăng nhập"
              description="Chọn tài khoản Google hoặc xác thực OTP Gmail."
            />

            <div className="grid gap-3">
              <button type="button" className="auth-provider" onClick={handleGoogleLogin}>
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
            </div>

            <div className="auth-divider" />

            {step === "email" ? (
              <div className="grid gap-3">
                {error ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {error}
                  </div>
                ) : null}
                <input
                  className="field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhập địa chỉ Gmail"
                />
                <Button type="button" disabled={loading} onClick={handleRequestOtp}>
                  {loading ? "Đang gửi..." : "Tiếp tục"}
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="text-sm text-ink/70">
                  {"Nhập mã xác thực đã gửi tới "}
                  <span className="font-semibold text-ink">{email.trim()}</span>
                </div>
                {otpError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {otpError}
                  </div>
                ) : null}
                <input
                  className="field"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Nhập mã xác thực"
                />
                <Button type="button" disabled={verifying} onClick={handleVerifyOtp}>
                  {verifying ? "Đang xác thực..." : "Xác thực & đăng nhập"}
                </Button>
                <div className="text-xs text-ink/60">
                  {cooldown > 0 ? (
                    <>Gửi lại sau {cooldown}s</>
                  ) : (
                    <button
                      type="button"
                      className="text-forest underline"
                      onClick={handleRequestOtp}
                    >
                      Gửi lại mã
                    </button>
                  )}
                </div>
                <button type="button" className="auth-link" onClick={handleBack}>
                  Quay lại
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-ink/70">
              <Link href="/" className="text-forest">
                {"Quay về trang chủ"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
