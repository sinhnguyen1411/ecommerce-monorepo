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
      ? "Chúng tôi sẽ gửi mã đến email của bạn."
      : "Chúng tôi sẽ gửi mã đến số điện thoại di động Việt Nam của bạn.";
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
        setNotice("Nếu tài khoản tồn tại, mã đã được gửi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi OTP");
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
        throw new Error("Thiếu mã yêu cầu");
      }
      const result = await verifyForgotPasswordOTP({
        request_id: requestId,
        code: otpCode.trim()
      });
      setVerificationToken(result.verification_token);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xác minh OTP");
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
      setError(err instanceof Error ? err.message : "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Quên mật khẩu"
          description="Xác minh email hoặc số điện thoại để đặt lại mật khẩu."
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
                  Số điện thoại
                </label>
              </div>
              {channel === "email" ? (
                <input
                  className="field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Địa chỉ email"
                />
              ) : (
                <input
                  className="field"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Số điện thoại Việt Nam (0xxxxxxxxx)"
                />
              )}
              <p className="text-xs text-ink/60">{helperText}</p>
              <Button type="submit" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi mã"}
              </Button>
            </form>
          ) : null}

          {step === "verify" ? (
            <form className="grid gap-4" onSubmit={handleVerify}>
              <input
                className="field"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="Mã 6 chữ số"
              />
              <div className="flex flex-wrap items-center gap-3">
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
                placeholder="Mật khẩu mới"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </Button>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="grid gap-3 text-sm">
              <p>Mật khẩu đã được đặt lại.</p>
              <Link className="text-forest" href="/login">
                Quay lại Đăng nhập
              </Link>
            </div>
          ) : null}

          <div className="mt-6 text-xs text-ink/70">
            Nhớ mật khẩu?{" "}
            <Link className="text-forest" href="/login">
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
