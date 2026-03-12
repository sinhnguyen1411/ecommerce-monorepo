"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { clearAuthTokens } from "@/lib/auth";
import {
  Address,
  completeOnboarding,
  getProfile,
  listAddresses,
  updateProfile,
  UserProfile
} from "@/lib/account";
import { GeoDistrict, GeoProvince, getGeoDistricts, getGeoProvinces } from "@/lib/api";
import { buildLoginHref, normalizeNextPath } from "@/lib/onboarding";
import { logout, sendEmailOTP, verifyEmailOTP } from "@/lib/user-auth";

type OnboardingForm = {
  full_name: string;
  phone: string;
  birthdate: string;
  address_line: string;
  province: string;
  district: string;
  password: string;
  password_confirm: string;
};

const emptyOnboardingForm: OnboardingForm = {
  full_name: "",
  phone: "",
  birthdate: "",
  address_line: "",
  province: "",
  district: "",
  password: "",
  password_confirm: ""
};

function pickDefaultAddress(addresses: Address[]) {
  return addresses.find((item) => item.is_default) || addresses[0] || null;
}

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => normalizeNextPath(searchParams.get("next"), "/account"),
    [searchParams]
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
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

  const [onboardingForm, setOnboardingForm] = useState<OnboardingForm>(emptyOnboardingForm);
  const [onboardingErrors, setOnboardingErrors] = useState<Record<string, string>>({});
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getProfile();
        if (cancelled) {
          return;
        }

        setProfile(data);
        setEmailStatus(data.emailVerificationStatus || "");
        setIsAuthed(true);
        setRequiresOnboarding(Boolean(data.onboarding_required));

        if (!data.onboarding_required) {
          setName(data.name || "");
          setPhone(data.phone || "");
          return;
        }

        const [addressList, provinceList] = await Promise.all([
          listAddresses().catch(() => []),
          getGeoProvinces().catch(() => [])
        ]);
        if (cancelled) {
          return;
        }

        const defaultAddress = pickDefaultAddress(addressList);
        setProvinces(provinceList);
        setOnboardingForm({
          full_name: data.name || defaultAddress?.full_name || "",
          phone: data.phone || defaultAddress?.phone || "",
          birthdate: data.birthdate || "",
          address_line: defaultAddress?.address_line || "",
          province: defaultAddress?.province || "",
          district: defaultAddress?.district || "",
          password: "",
          password_confirm: ""
        });
      } catch {
        if (!cancelled) {
          setIsAuthed(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
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

  useEffect(() => {
    if (!requiresOnboarding || !onboardingForm.province || provinces.length === 0) {
      setDistricts([]);
      return;
    }
    const selected = provinces.find((item) => item.name === onboardingForm.province);
    if (!selected) {
      setDistricts([]);
      return;
    }

    let cancelled = false;
    getGeoDistricts(selected.code)
      .then((items) => {
        if (cancelled) {
          return;
        }
        setDistricts(items);
        if (
          onboardingForm.district &&
          !items.some((item) => item.name === onboardingForm.district)
        ) {
          setOnboardingForm((prev) => ({ ...prev, district: "" }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDistricts([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requiresOnboarding, onboardingForm.province, onboardingForm.district, provinces]);

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

  const validateOnboardingForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!onboardingForm.full_name.trim()) {
      nextErrors.full_name = "Vui lòng nhập họ và tên.";
    }
    if (!onboardingForm.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    }
    if (!onboardingForm.birthdate.trim()) {
      nextErrors.birthdate = "Vui lòng chọn ngày sinh.";
    }
    if (!onboardingForm.address_line.trim()) {
      nextErrors.address_line = "Vui lòng nhập địa chỉ.";
    }
    if (!onboardingForm.province) {
      nextErrors.province = "Vui lòng chọn tỉnh/thành.";
    }
    if (!onboardingForm.district) {
      nextErrors.district = "Vui lòng chọn quận/huyện.";
    }
    if (!onboardingForm.password) {
      nextErrors.password = "Vui lòng tạo mật khẩu.";
    }
    if (!onboardingForm.password_confirm) {
      nextErrors.password_confirm = "Vui lòng xác nhận mật khẩu.";
    } else if (onboardingForm.password !== onboardingForm.password_confirm) {
      nextErrors.password_confirm = "Mật khẩu xác nhận chưa khớp.";
    }
    setOnboardingErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleOnboardingSubmit = async () => {
    if (!validateOnboardingForm()) {
      return;
    }
    setOnboardingSubmitting(true);
    setError("");
    try {
      const updated = await completeOnboarding({
        full_name: onboardingForm.full_name.trim(),
        phone: onboardingForm.phone.trim(),
        birthdate: onboardingForm.birthdate.trim(),
        address_line: onboardingForm.address_line.trim(),
        province: onboardingForm.province,
        district: onboardingForm.district,
        password: onboardingForm.password,
        password_confirm: onboardingForm.password_confirm
      });
      setProfile(updated);
      setRequiresOnboarding(false);
      setName(updated.name || onboardingForm.full_name.trim());
      setPhone(updated.phone || onboardingForm.phone.trim());
      setEmailStatus(updated.emailVerificationStatus || "");
      if (nextPath !== "/account") {
        router.replace(nextPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể hoàn tất hồ sơ.");
    } finally {
      setOnboardingSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    setError("");
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng xuất.");
    } finally {
      clearAuthTokens();
      setLoggingOut(false);
      window.location.reload();
    }
  };

  const isEmailVerified =
    profile?.is_email_verified ||
    emailStatus === "VERIFIED" ||
    profile?.emailVerificationStatus === "VERIFIED";

  const emailStatusLabel = isEmailVerified ? "Đã xác minh" : "Chưa xác minh";

  if (isAuthed === null) {
    return (
      <div className="section-shell pb-16 pt-14">
        <p className="text-sm text-ink/70">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  if (!isAuthed) {
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
            <Link className="button" href={buildLoginHref("/account", "/account")}>
              Đi tới trang đăng nhập
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (requiresOnboarding) {
    return (
      <div>
        <section className="section-shell pb-6 pt-14">
          <SectionTitle
            eyebrow="Hoàn tất tài khoản"
            title="Bổ sung thông tin bắt buộc"
            description="Vui lòng hoàn tất hồ sơ và tạo mật khẩu để mở toàn bộ tính năng tài khoản."
          />
        </section>
        <section className="section-shell pb-16">
          <div className="border border-forest/10 bg-white p-6">
            {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="onboarding-email"
                  className="mb-1 block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <input id="onboarding-email" className="field" value={profile?.email || ""} readOnly />
              </div>

              <div>
                <label htmlFor="onboarding-full-name" className="mb-1 block text-sm font-medium">
                  Họ và tên
                </label>
                <input
                  id="onboarding-full-name"
                  className="field"
                  value={onboardingForm.full_name}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({ ...prev, full_name: event.target.value }));
                    setOnboardingErrors((prev) => ({ ...prev, full_name: "" }));
                  }}
                />
                {onboardingErrors.full_name ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.full_name}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="onboarding-phone" className="mb-1 block text-sm font-medium">
                  Số điện thoại
                </label>
                <input
                  id="onboarding-phone"
                  className="field"
                  value={onboardingForm.phone}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({ ...prev, phone: event.target.value }));
                    setOnboardingErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                />
                {onboardingErrors.phone ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.phone}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="onboarding-birthdate" className="mb-1 block text-sm font-medium">
                  Ngày sinh
                </label>
                <input
                  id="onboarding-birthdate"
                  className="field"
                  type="date"
                  value={onboardingForm.birthdate}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({ ...prev, birthdate: event.target.value }));
                    setOnboardingErrors((prev) => ({ ...prev, birthdate: "" }));
                  }}
                />
                {onboardingErrors.birthdate ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.birthdate}</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="onboarding-address-line"
                  className="mb-1 block text-sm font-medium"
                >
                  Địa chỉ mặc định
                </label>
                <input
                  id="onboarding-address-line"
                  className="field"
                  value={onboardingForm.address_line}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({ ...prev, address_line: event.target.value }));
                    setOnboardingErrors((prev) => ({ ...prev, address_line: "" }));
                  }}
                />
                {onboardingErrors.address_line ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.address_line}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="onboarding-province" className="mb-1 block text-sm font-medium">
                  Tỉnh / thành
                </label>
                <select
                  id="onboarding-province"
                  className="field"
                  value={onboardingForm.province}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({
                      ...prev,
                      province: event.target.value,
                      district: ""
                    }));
                    setOnboardingErrors((prev) => ({ ...prev, province: "", district: "" }));
                  }}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((item) => (
                    <option key={item.code} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {onboardingErrors.province ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.province}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="onboarding-district" className="mb-1 block text-sm font-medium">
                  Quận / huyện
                </label>
                <select
                  id="onboarding-district"
                  className="field"
                  value={onboardingForm.district}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({ ...prev, district: event.target.value }));
                    setOnboardingErrors((prev) => ({ ...prev, district: "" }));
                  }}
                  disabled={!onboardingForm.province}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((item) => (
                    <option key={item.code} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {onboardingErrors.district ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.district}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="onboarding-password" className="mb-1 block text-sm font-medium">
                  Mật khẩu
                </label>
                <input
                  id="onboarding-password"
                  className="field"
                  type="password"
                  value={onboardingForm.password}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({ ...prev, password: event.target.value }));
                    setOnboardingErrors((prev) => ({ ...prev, password: "" }));
                  }}
                />
                {onboardingErrors.password ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.password}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="onboarding-password-confirm"
                  className="mb-1 block text-sm font-medium"
                >
                  Xác nhận mật khẩu
                </label>
                <input
                  id="onboarding-password-confirm"
                  className="field"
                  type="password"
                  value={onboardingForm.password_confirm}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({
                      ...prev,
                      password_confirm: event.target.value
                    }));
                    setOnboardingErrors((prev) => ({ ...prev, password_confirm: "" }));
                  }}
                />
                {onboardingErrors.password_confirm ? (
                  <p className="mt-1 text-xs text-clay">{onboardingErrors.password_confirm}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                data-testid="onboarding-submit"
                onClick={handleOnboardingSubmit}
                disabled={onboardingSubmitting}
              >
                {onboardingSubmitting ? "Đang lưu..." : "Hoàn tất tài khoản"}
              </Button>
              <Button type="button" variant="outline" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </Button>
            </div>
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
              <Button type="button" variant="outline" onClick={handleLogout} disabled={loggingOut}>
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
