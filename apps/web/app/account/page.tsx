"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { clearUserToken, getUserToken, setUserToken } from "@/lib/auth";
import { getProfile, updateProfile, UserProfile } from "@/lib/account";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setUserToken(token);
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      return;
    }

    getProfile()
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile({ name, phone });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!getUserToken()) {
    return (
      <div>
        <section className="section-shell pb-10 pt-14">
          <SectionTitle
            eyebrow="Tai khoan"
            title="Dang nhap de tiep tuc"
            description="Dang nhap bang Google de quan ly tai khoan va don hang."
          />
        </section>
        <section className="section-shell pb-16">
          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-8 text-center">
            <Link className="btn-primary" href="/login">
              Di den trang dang nhap
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
          eyebrow="Tai khoan"
          title="Thong tin tai khoan"
          description="Cap nhat thong tin ca nhan va quan ly don hang."
        />
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.4fr]">
          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <h2 className="text-lg font-semibold">Ho so</h2>
            {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ho va ten"
              />
              <input
                className="field"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="So dien thoai"
              />
              <input className="field" value={profile?.email || ""} readOnly />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Dang luu..." : "Luu thay doi"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clearUserToken();
                  window.location.reload();
                }}
              >
                Dang xuat
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <h3 className="text-lg font-semibold">Quan ly</h3>
            <div className="mt-4 space-y-2 text-sm text-ink/70">
              <Link className="block text-forest" href="/account/addresses">
                Dia chi giao hang
              </Link>
              <Link className="block text-forest" href="/account/orders">
                Don hang cua toi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
