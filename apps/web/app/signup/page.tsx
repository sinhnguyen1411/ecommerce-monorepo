"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/account";
import { register } from "@/lib/user-auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        name: name.trim(),
        dob: dob.trim(),
        phone: phone.trim() || undefined,
        address: address.trim(),
        password,
        password_confirm: passwordConfirm
      });
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="section-shell pb-16 pt-14">
        <div className="auth-grid auth-grid--single">
          <div className="auth-card auth-card--wide auth-card--center">
            <SectionTitle
              eyebrow="Tài khoản"
              title="Tạo tài khoản"
              description="Đăng ký bằng email và mật khẩu."
            />
            {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <input
                className="field"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
              />
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Họ và tên"
              />
              <input
                className="field"
                type="date"
                value={dob}
                onChange={(event) => setDob(event.target.value)}
                placeholder="Ngày sinh (YYYY-MM-DD)"
              />
              <input
                className="field"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Số điện thoại (tùy chọn)"
              />
              <input
                className="field"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Địa chỉ"
              />
              <div className="auth-password">
                <input
                  className="field"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="auth-password">
                <input
                  className="field"
                  type={showPasswordConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="Xác nhận mật khẩu"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPasswordConfirm((prev) => !prev)}
                  aria-label={showPasswordConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </form>

            <div className="mt-6 text-xs text-ink/70 text-center">
              {"Đã có tài khoản? "}
              <Link className="text-forest" href="/login">
                {"Đăng nhập"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
