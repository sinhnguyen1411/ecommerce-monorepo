"use client";


import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import AccountShell from "@/components/account/AccountShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { clearAuthTokens } from "@/lib/auth";
import {
  Address,
  OrderSummary,
  completeOnboarding,
  getProfile,
  listAddresses,
  listOrders,
  updateProfile,
  UserProfile
} from "@/lib/account";
import { GeoDistrict, GeoProvince, getGeoDistricts, getGeoProvinces } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { buildLoginHref, normalizeNextPath } from "@/lib/onboarding";
import { changePassword, logout, sendEmailOTP, verifyEmailOTP } from "@/lib/user-auth";

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

function formatOrderTime(raw: string) {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw || "-";
  }
  return parsed.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function AccountPageContent() {
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
  const [birthdate, setBirthdate] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpNotice, setOtpNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [onboardingForm, setOnboardingForm] = useState<OnboardingForm>(emptyOnboardingForm);
  const [onboardingErrors, setOnboardingErrors] = useState<Record<string, string>>({});
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);

  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);

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
          setBirthdate(data.birthdate || "");

          const [addressList, orderList] = await Promise.all([
            listAddresses().catch(() => []),
            listOrders().catch(() => [])
          ]);
          if (cancelled) {
            return;
          }
          setDefaultAddress(pickDefaultAddress(addressList));
          setRecentOrders(orderList.slice(0, 6));
          return;
        }

        const [addressList, provinceList] = await Promise.all([
          listAddresses().catch(() => []),
          getGeoProvinces().catch(() => [])
        ]);
        if (cancelled) {
          return;
        }

        const primaryAddress = pickDefaultAddress(addressList);
        setProvinces(provinceList);
        setOnboardingForm({
          full_name: data.name || primaryAddress?.full_name || "",
          phone: data.phone || primaryAddress?.phone || "",
          birthdate: data.birthdate || "",
          address_line: primaryAddress?.address_line || "",
          province: primaryAddress?.province || "",
          district: primaryAddress?.district || "",
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
        if (onboardingForm.district && !items.some((item) => item.name === onboardingForm.district)) {
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
      const updated = await updateProfile({ name, phone, birthdate });
      setProfile(updated);
      setPhone(updated.phone || phone);
      setBirthdate(updated.birthdate || birthdate);
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
      setBirthdate(updated.birthdate || onboardingForm.birthdate.trim());
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

  const resetPasswordDialogState = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError("");
  };

  const handlePasswordDialogChange = (open: boolean) => {
    setPasswordDialogOpen(open);
    if (!open) {
      resetPasswordDialogState();
    }
  };

  const handleChangePassword = async () => {
    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmNewPassword.trim();

    if (!trimmedOld || !trimmedNew || !trimmedConfirm) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin đổi mật khẩu.");
      return;
    }
    if (trimmedNew.length < 8) {
      setPasswordError("Mật khẩu mới cần tối thiểu 8 ký tự.");
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setPasswordError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setPasswordError("");
    setChangingPassword(true);
    try {
      await changePassword({ old_password: trimmedOld, new_password: trimmedNew });
      setPasswordNotice("Đổi mật khẩu thành công.");
      setPasswordDialogOpen(false);
      resetPasswordDialogState();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Không thể đổi mật khẩu lúc này.");
    } finally {
      setChangingPassword(false);
    }
  };

  const isEmailVerified =
    profile?.is_email_verified ||
    emailStatus === "VERIFIED" ||
    profile?.emailVerificationStatus === "VERIFIED";

  const emailStatusLabel = isEmailVerified ? "Đã xác minh" : "Chưa xác minh";
  const canChangePassword = Boolean(profile?.has_password);

  const accountStats = useMemo(() => {
    const activeOrderStatuses = new Set(["pending", "confirmed", "packed", "shipping"]);
    const totalOrders = recentOrders.length;
    const activeOrders = recentOrders.filter((item) =>
      activeOrderStatuses.has((item.status || "").toLowerCase())
    ).length;
    const waitingPayment = recentOrders.filter((item) =>
      ["pending", "proof_submitted"].includes((item.payment_status || "").toLowerCase())
    ).length;

    return {
      totalOrders,
      activeOrders,
      waitingPayment
    };
  }, [recentOrders]);

  if (isAuthed === null) {
    return (
      <AccountShell
        title="Không gian tài khoản"
        description="Quản lý hồ sơ, địa chỉ và theo dõi đơn hàng theo thời gian thực."
      >
        <p className="text-sm text-ink/70">Đang tải thông tin tài khoản...</p>
      </AccountShell>
    );
  }

  if (!isAuthed) {
    return (
      <AccountShell
        title="Đăng nhập để tiếp tục"
        description="Đăng nhập để quản lý tài khoản và đơn hàng của bạn."
        showTabs={false}
      >
        <div className="rounded-2xl border border-forest/10 bg-white p-8 text-center">
          <Link className="button" href={buildLoginHref("/account", "/account")}>
            Đi tới trang đăng nhập
          </Link>
        </div>
      </AccountShell>
    );
  }

  if (requiresOnboarding) {
    return (
      <AccountShell
        eyebrow="Hoàn tất tài khoản"
        title="Bổ sung thông tin bắt buộc"
        description="Vui lòng hoàn tất hồ sơ và tạo mật khẩu để mở toàn bộ tính năng tài khoản."
        showTabs={false}
      >
        <div className="rounded-2xl border border-forest/10 bg-white p-6">
            {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="onboarding-email" className="mb-1 block text-sm font-medium text-ink">
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
                {onboardingErrors.phone ? <p className="mt-1 text-xs text-clay">{onboardingErrors.phone}</p> : null}
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
                <label htmlFor="onboarding-address-line" className="mb-1 block text-sm font-medium">
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
                    setOnboardingForm((prev) => ({ ...prev, province: event.target.value, district: "" }));
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
                {onboardingErrors.password ? <p className="mt-1 text-xs text-clay">{onboardingErrors.password}</p> : null}
              </div>

              <div>
                <label htmlFor="onboarding-password-confirm" className="mb-1 block text-sm font-medium">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="onboarding-password-confirm"
                  className="field"
                  type="password"
                  value={onboardingForm.password_confirm}
                  onChange={(event) => {
                    setOnboardingForm((prev) => ({ ...prev, password_confirm: event.target.value }));
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
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="Không gian tài khoản"
      description="Quản lý hồ sơ, địa chỉ và theo dõi đơn hàng theo thời gian thực."
    >
      {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-forest/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink/60">Đơn hàng gần đây</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{accountStats.totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-forest/10 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink/60">Đơn đang xử lý</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{accountStats.activeOrders}</p>
        </div>
        <div className="rounded-2xl border border-forest/10 bg-white p-5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs uppercase tracking-wide text-ink/60">Thanh toán chờ xử lý</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{accountStats.waitingPayment}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <div className="rounded-2xl border border-forest/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Hồ sơ tài khoản</h2>
            <p className="mt-1 text-sm text-ink/60">Cập nhật thông tin liên hệ chính để đặt hàng nhanh hơn.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="account-full-name" className="mb-1 block text-sm font-medium text-ink">
                  Họ và tên
                </label>
                <input
                  id="account-full-name"
                  className="field"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Họ và tên"
                />
              </div>
              <div>
                <label htmlFor="account-birthdate" className="mb-1 block text-sm font-medium text-ink">
                  Ngày sinh
                </label>
                <input
                  id="account-birthdate"
                  className="field"
                  type="date"
                  value={birthdate}
                  onChange={(event) => setBirthdate(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="account-phone" className="mb-1 block text-sm font-medium text-ink">
                  Số điện thoại
                </label>
                <input
                  id="account-phone"
                  className="field"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Số điện thoại"
                />
                <p className="mt-1 text-xs text-ink/60">Bạn có thể cập nhật số điện thoại dùng để liên hệ.</p>
              </div>
              <div>
                <label
                  htmlFor="account-username"
                  className="mb-1 flex items-center gap-1 text-sm font-medium text-ink"
                >
                  <span>Tên tài khoản</span>
                  <span className="text-clay">*</span>
                  <span
                    className="cursor-help text-xs font-normal text-ink/60"
                    title="Tên tài khoản được tạo theo email đăng ký và không thể thay đổi."
                  >
                    (!)
                  </span>
                </label>
                <input
                  id="account-username"
                  className="field cursor-not-allowed bg-[#ececec] text-ink/55"
                  value={profile?.email || ""}
                  disabled
                  aria-disabled="true"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-forest/10 bg-forest/5 p-4 text-sm">
              <p className="font-semibold text-ink">Xác minh email</p>
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

            <div className="mt-4 rounded-2xl border border-forest/10 bg-white p-4 text-sm">
              <p className="font-semibold text-ink">Bảo mật tài khoản</p>
              {canChangePassword ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="account-change-password-trigger"
                    onClick={() => {
                      setPasswordNotice("");
                      handlePasswordDialogChange(true);
                    }}
                  >
                    Đổi mật khẩu
                  </Button>
                  <p className="text-xs text-ink/60">Khuyến nghị thay đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink/60">
                  Tài khoản chưa có mật khẩu. Vui lòng dùng{" "}
                  <Link href="/forgot-password" className="font-semibold text-forest hover:underline">
                    Quên mật khẩu
                  </Link>{" "}
                  để thiết lập.
                </p>
              )}
              {passwordNotice ? <p className="mt-2 text-xs font-semibold text-forest">{passwordNotice}</p> : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </Button>
            </div>
          </div>

        <div className="space-y-6">
            <div className="rounded-2xl border border-forest/10 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink">Địa chỉ mặc định</h3>
              {defaultAddress ? (
                <div className="mt-3 space-y-1 text-sm text-ink/70">
                  <p className="font-semibold text-ink">{defaultAddress.full_name}</p>
                  <p>{defaultAddress.phone}</p>
                  <p>{defaultAddress.address_line}</p>
                  <p>{[defaultAddress.district, defaultAddress.province].filter(Boolean).join(", ")}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink/60">Bạn chưa lưu địa chỉ giao hàng.</p>
              )}
              <Link
                className="mt-4 inline-flex text-sm font-semibold text-forest hover:underline"
                href="/account/addresses"
              >
                Quản lý địa chỉ
              </Link>
            </div>

            <div className="rounded-2xl border border-forest/10 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink">Tác vụ nhanh</h3>
              <div className="mt-3 space-y-2 text-sm">
                <Link
                  className="block rounded-xl border border-forest/10 px-3 py-2 font-medium text-forest transition hover:bg-forest/5"
                  href="/account/orders"
                >
                  Xem đơn hàng của tôi
                </Link>
                <Link
                  className="block rounded-xl border border-forest/10 px-3 py-2 font-medium text-forest transition hover:bg-forest/5"
                  href="/account/addresses"
                >
                  Cập nhật sổ địa chỉ
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-forest/10 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink">Đơn gần đây</h3>
              {recentOrders.length ? (
                <div className="mt-3 space-y-2">
                  {recentOrders.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      className="block rounded-xl border border-forest/10 px-3 py-2 text-sm transition hover:bg-forest/5"
                      href={`/account/orders?orderId=${item.id}`}
                    >
                      <p className="font-semibold text-ink">{item.order_number}</p>
                      <p className="text-ink/70">{formatOrderTime(item.created_at)}</p>
                      <p className="mt-1 font-semibold text-ink">{formatCurrency(item.total)}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink/60">Chưa có đơn hàng gần đây.</p>
              )}
            </div>
        </div>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={handlePasswordDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu hiện tại và mật khẩu mới để tăng bảo mật cho tài khoản.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3">
            <div>
              <label htmlFor="account-old-password" className="mb-1 block text-sm font-medium text-ink">
                Mật khẩu hiện tại
              </label>
              <input
                id="account-old-password"
                className="field"
                type="password"
                value={oldPassword}
                onChange={(event) => {
                  setOldPassword(event.target.value);
                  setPasswordError("");
                }}
              />
            </div>

            <div>
              <label htmlFor="account-new-password" className="mb-1 block text-sm font-medium text-ink">
                Mật khẩu mới
              </label>
              <input
                id="account-new-password"
                className="field"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setPasswordError("");
                }}
              />
            </div>

            <div>
              <label htmlFor="account-new-password-confirm" className="mb-1 block text-sm font-medium text-ink">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="account-new-password-confirm"
                className="field"
                type="password"
                value={confirmNewPassword}
                onChange={(event) => {
                  setConfirmNewPassword(event.target.value);
                  setPasswordError("");
                }}
              />
            </div>
          </div>

          {passwordError ? <p className="mt-3 text-sm text-clay">{passwordError}</p> : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePasswordDialogChange(false)}
              disabled={changingPassword}
            >
              Hủy
            </Button>
            <Button
              type="button"
              data-testid="account-change-password-submit"
              onClick={() => void handleChangePassword()}
              disabled={changingPassword}
            >
              {changingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AccountShell>
  );
}
export default function AccountPage() {
  return (
    <Suspense fallback={<div className="section-shell pb-16 pt-6 text-sm text-ink/70">Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  );
}

