"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AccountShell from "@/components/account/AccountShell";
import { Button } from "@/components/ui/button";
import {
  Address,
  createAddress,
  deleteAddress,
  getProfile,
  listAddresses,
  updateAddress
} from "@/lib/account";
import { GeoDistrict, GeoProvince, getGeoDistricts, getGeoProvinces } from "@/lib/api";
import { buildCompleteProfileHref, buildLoginHref } from "@/lib/onboarding";

const emptyForm: Omit<Address, "id"> = {
  full_name: "",
  phone: "",
  address_line: "",
  province: "",
  district: "",
  is_default: false
};

const vnPrefixes = new Set([
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "52",
  "56",
  "58",
  "59",
  "70",
  "76",
  "77",
  "78",
  "79",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "90",
  "91",
  "92",
  "93",
  "94",
  "96",
  "97",
  "98",
  "99"
]);

function normalizeVNPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  let national = "";
  if (digits.startsWith("84") && digits.length === 11) {
    national = `0${digits.slice(2)}`;
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits;
  } else {
    return null;
  }

  if (national.length !== 10) {
    return null;
  }

  const prefix = national.slice(1, 3);
  if (!vnPrefixes.has(prefix)) {
    return null;
  }

  return national;
}

export default function AddressesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await getProfile();
      if (profile.onboarding_required) {
        router.replace(buildCompleteProfileHref("/account/addresses", "/account/addresses"));
        return;
      }
      const data = await listAddresses();
      setItems(data);
      setIsAuthed(true);
    } catch (err) {
      setIsAuthed(false);
      setError(err instanceof Error ? err.message : "Không thể tải địa chỉ.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }
    getGeoProvinces().then(setProvinces).catch(() => setProvinces([]));
  }, [isAuthed]);

  useEffect(() => {
    if (!form.province || provinces.length === 0) {
      setDistricts([]);
      if (form.district) {
        setForm((prev) => ({ ...prev, district: "" }));
      }
      return;
    }

    const selectedProvince = provinces.find((item) => item.name === form.province);
    if (!selectedProvince) {
      setDistricts([]);
      if (form.district) {
        setForm((prev) => ({ ...prev, district: "" }));
      }
      return;
    }

    getGeoDistricts(selectedProvince.code)
      .then((nextDistricts) => {
        setDistricts(nextDistricts);
        if (form.district && !nextDistricts.some((item) => item.name === form.district)) {
          setForm((prev) => ({ ...prev, district: "" }));
        }
      })
      .catch(() => setDistricts([]));
  }, [form.province, form.district, provinces]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      nextErrors.full_name = "Vui lòng nhập họ và tên.";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!normalizeVNPhone(form.phone)) {
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    }
    if (!form.address_line.trim()) {
      nextErrors.address_line = "Vui lòng nhập địa chỉ.";
    }
    if (!form.province) {
      nextErrors.province = "Vui lòng chọn tỉnh/thành.";
    }
    if (!form.district) {
      nextErrors.district = "Vui lòng chọn quận/huyện.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
    setDistricts([]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: normalizeVNPhone(form.phone) || form.phone.trim(),
        address_line: form.address_line.trim(),
        province: form.province,
        district: form.district,
        is_default: form.is_default
      };

      const data = editingId
        ? await updateAddress(editingId, payload)
        : await createAddress(payload);
      setItems(data);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingId
            ? "Không thể cập nhật địa chỉ."
            : "Không thể thêm địa chỉ."
      );
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    try {
      await deleteAddress(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa địa chỉ.");
    }
  };

  const handleSetDefault = async (address: Address) => {
    setError("");
    try {
      const data = await updateAddress(address.id, { ...address, is_default: true });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật địa chỉ mặc định.");
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      full_name: address.full_name || "",
      phone: address.phone || "",
      address_line: address.address_line || "",
      province: address.province || "",
      district: address.district || "",
      is_default: address.is_default || false
    });
    setFieldErrors({});
    setError("");
  };

  if (isAuthed === null) {
    return (
      <AccountShell
        title="Sổ địa chỉ giao hàng"
        description="Quản lý địa chỉ thường dùng để đặt hàng nhanh và chính xác hơn."
      >
        <p className="text-sm text-ink/70">Đang tải địa chỉ...</p>
      </AccountShell>
    );
  }

  if (!isAuthed) {
    return (
      <AccountShell
        title="Đăng nhập để quản lý địa chỉ"
        description="Vui lòng đăng nhập để dùng sổ địa chỉ giao hàng."
        showTabs={false}
      >
        <div className="mt-6">
          <Link className="btn-primary" href={buildLoginHref("/account/addresses", "/account/addresses")}>
            Đi đến trang đăng nhập
          </Link>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="Sổ địa chỉ giao hàng"
      description="Quản lý địa chỉ thường dùng để đặt hàng nhanh và chính xác hơn."
    >
      {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-forest/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Danh sách địa chỉ</h2>
            <p className="mt-1 text-sm text-ink/60">Mỗi đơn hàng có thể chọn địa chỉ đã lưu để không phải nhập lại.</p>

            {loading ? (
              <p className="mt-4 text-sm text-ink/70">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="mt-4 text-sm text-ink/70">Bạn chưa có địa chỉ nào.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {items.map((address) => (
                  <div key={address.id} className="rounded-2xl border border-forest/10 bg-forest/5/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{address.full_name}</p>
                        <p className="text-sm text-ink/70">{address.phone}</p>
                      </div>
                      {address.is_default ? (
                        <span className="rounded-full bg-forest/15 px-3 py-1 text-xs font-semibold text-forest">Mặc định</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-ink/80">{address.address_line}</p>
                    <p className="text-sm text-ink/70">{[address.district, address.province].filter(Boolean).join(", ")}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(address)}>
                        Chỉnh sửa
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={address.is_default}
                        onClick={() => void handleSetDefault(address)}
                      >
                        Đặt mặc định
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(address.id)}>
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-forest/10 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">{editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</h2>
            <div className="mt-4 grid gap-3">
              <div>
                <input
                  className="field"
                  value={form.full_name}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, full_name: event.target.value }));
                    if (fieldErrors.full_name) {
                      setFieldErrors((prev) => ({ ...prev, full_name: "" }));
                    }
                  }}
                  placeholder="Họ và tên"
                />
                {fieldErrors.full_name ? <p className="mt-1 text-xs text-clay">{fieldErrors.full_name}</p> : null}
              </div>

              <div>
                <input
                  className="field"
                  value={form.phone}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, phone: event.target.value }));
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }
                  }}
                  placeholder="Số điện thoại"
                />
                {fieldErrors.phone ? <p className="mt-1 text-xs text-clay">{fieldErrors.phone}</p> : null}
              </div>

              <div>
                <input
                  className="field"
                  value={form.address_line}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, address_line: event.target.value }));
                    if (fieldErrors.address_line) {
                      setFieldErrors((prev) => ({ ...prev, address_line: "" }));
                    }
                  }}
                  placeholder="Số nhà, đường, thôn/xóm"
                />
                {fieldErrors.address_line ? <p className="mt-1 text-xs text-clay">{fieldErrors.address_line}</p> : null}
              </div>

              <div>
                <select
                  className="field"
                  value={form.province}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, province: event.target.value, district: "" }));
                    setFieldErrors((prev) => ({ ...prev, province: "", district: "" }));
                  }}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.province ? <p className="mt-1 text-xs text-clay">{fieldErrors.province}</p> : null}
              </div>

              <div>
                <select
                  className="field"
                  value={form.district}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, district: event.target.value }));
                    if (fieldErrors.district) {
                      setFieldErrors((prev) => ({ ...prev, district: "" }));
                    }
                  }}
                  disabled={!form.province}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.district ? <p className="mt-1 text-xs text-clay">{fieldErrors.district}</p> : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_default: event.target.checked }))}
                />
                Đặt làm địa chỉ mặc định
              </label>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleSubmit}>
                  {editingId ? "Lưu thay đổi" : "Thêm địa chỉ"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Hủy chỉnh sửa
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
    </AccountShell>
  );
}
