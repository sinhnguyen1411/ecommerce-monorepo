"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import {
  clearAuthTokens,
  getRefreshToken,
  getUserToken,
  setAuthTokens
} from "@/lib/auth";
import { getProfile, updateProfile, UserProfile } from "@/lib/account";
import { logout, sendEmailOTP, verifyEmailOTP } from "@/lib/user-auth";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpNotice, setOtpNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const refreshToken = hash
        ? new URLSearchParams(hash.replace(/^#/, "")).get("refresh_token")
        : "";
      setAuthTokens(token, refreshToken || undefined);
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.hash = "";
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    const token = getUserToken();
    const refreshToken = getRefreshToken();
    if (!token && !refreshToken) {
      return;
    }

    getProfile()
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setEmailStatus(data.emailVerificationStatus || "");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Không thể tải hồ sơ.")
      );
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setOtpCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile({ name, phone });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendOTP = async () => {
    if (sendingOtp) {
      return;
    }
    setError("");
    setOtpNotice("");
    setSendingOtp(true);
    try {
      const result = await sendEmailOTP();
      if (result.emailVerificationStatus) {
        setEmailStatus(result.emailVerificationStatus);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_email_verified: result.emailVerificationStatus === "VERIFIED",
                emailVerificationStatus: result.emailVerificationStatus
              }
            : prev
        );
      }
      if (result.sent) {
        setOtpNotice("Đã gửi mã OTP tới email của bạn.");
        setOtpCooldown(result.cooldown_seconds || 0);
      } else if (result.emailVerificationStatus === "VERIFIED") {
        setOtpNotice("Email đã được xác minh.");
      } else {
        setOtpNotice("Không thể gửi OTP lúc này.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (verifyingOtp) {
      return;
    }
    if (!otpCode.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }
    setError("");
    setOtpNotice("");
    setVerifyingOtp(true);
    try {
      const result = await verifyEmailOTP({ otp: otpCode.trim() });
      setEmailStatus(result.emailVerificationStatus || "VERIFIED");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_email_verified: true,
              emailVerificationStatus: result.emailVerificationStatus
            }
          : prev
      );
      setOtpNotice("Xác minh email thành công.");
      setOtpCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xác minh OTP thất bại.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const isEmailVerified =
    profile?.is_email_verified ||
    emailStatus === "VERIFIED" ||
    profile?.emailVerificationStatus === "VERIFIED";

  const emailStatusLabel = isEmailVerified ? "Đã xác minh" : "Chưa xác minh";

  if (!getUserToken() && !getRefreshToken()) {
    return (
      <div>
        <section className="section-shell pb-10 pt-14">
          <SectionTitle
            eyebrow="Tài khoản"
            title="Đăng nhập để tiếp tục"
            description="Đăng nhập để quản lý tài khoản và đơn hàng."
          />
        </section>
        <section className="section-shell pb-16">
          <div className="border border-forest/10 bg-white p-8 text-center">
            <Link className="button" href="/login">
              Đi tới trang đăng nhập
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Thông tin tài khoản"
          description="Cập nhật thông tin cá nhân và quản lý đơn hàng."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.4fr]">
          <div className="border border-forest/10 bg-white p-6">
            <h2 className="text-lg font-semibold">Hồ sơ</h2>
            {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Họ và tên"
              />
              <input
                className="field"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Số điện thoại"
              />
              <input className="field" value={profile?.email || ""} readOnly />
            </div>

            <div className="mt-4 rounded-2xl border border-forest/10 bg-forest/5 p-4 text-sm">
              <p className="font-semibold">Xác minh email</p>
              <p className="mt-1 text-ink/70">Trạng thái: {emailStatusLabel}</p>
              {otpNotice ? <p className="mt-2 text-xs text-ink/60">{otpNotice}</p> : null}
              {!isEmailVerified ? (
                <div className="mt-3 grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOTP}
                      disabled={sendingOtp || otpCooldown > 0}
                    >
                      {otpCooldown > 0
                        ? `Gửi lại sau ${otpCooldown}s`
                        : sendingOtp
                          ? "Đang gửi..."
                          : "Gửi mã OTP"}
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <input
                      className="field"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      placeholder="Nhập mã OTP"
                    />
                    <Button type="button" onClick={handleVerifyOTP} disabled={verifyingOtp}>
                      {verifyingOtp ? "Đang xác minh..." : "Xác minh"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (loggingOut) {
                    return;
                  }
                  setLoggingOut(true);
                  setError("");
                  try {
                    const refreshToken = getRefreshToken();
                    if (refreshToken) {
                      await logout(refreshToken);
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Không thể đăng xuất.");
                  } finally {
                    clearAuthTokens();
                    setLoggingOut(false);
                    window.location.reload();
                  }
                }}
              >
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </Button>
            </div>
          </div>

          <div className="border border-forest/10 bg-white p-6">
            <h3 className="text-lg font-semibold">Quản lý</h3>
            <div className="mt-4 space-y-2 text-sm text-ink/70">
              <Link className="block text-forest" href="/account/addresses">
                Địa chỉ giao hàng
              </Link>
              <Link className="block text-forest" href="/account/orders">
                Đơn hàng của tôi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
