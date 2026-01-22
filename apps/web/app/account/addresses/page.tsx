"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import {
  Address,
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress
} from "@/lib/account";
import { GeoDistrict, GeoProvince, getGeoDistricts, getGeoProvinces } from "@/lib/api";

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

const normalizeVNPhone = (input: string) => {
  const digits = input.replace(/\D/g, "");
  let national = "";
  if (digits.startsWith("84") && digits.length === 11) {
    national = "0" + digits.slice(2);
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
};

export default function AddressesPage() {
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAddresses();
      setItems(data);
      setIsAuthed(true);
    } catch (err) {
      setIsAuthed(false);
      setError(err instanceof Error ? err.message : "Không thể tải địa chỉ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }
    getGeoProvinces()
      .then(setProvinces)
      .catch(() => setProvinces([]));
  }, [isAuthed]);

  useEffect(() => {
    if (!form.province || provinces.length === 0) {
      setDistricts([]);
      if (form.district) {
        setForm((prev) => ({ ...prev, district: "" }));
      }
      return;
    }

    const selected = provinces.find((item) => item.name === form.province);
    if (!selected) {
      setDistricts([]);
      if (form.district) {
        setForm((prev) => ({ ...prev, district: "" }));
      }
      return;
    }

    getGeoDistricts(selected.code)
      .then((data) => {
        setDistricts(data);
        if (form.district && !data.some((item) => item.name === form.district)) {
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
    setFieldErrors({});
    setEditingId(null);
    setDistricts([]);
  };

  const startEdit = (item: Address) => {
    setEditingId(item.id);
    setForm({
      full_name: item.full_name ?? "",
      phone: item.phone ?? "",
      address_line: item.address_line ?? "",
      province: item.province ?? "",
      district: item.district ?? "",
      is_default: item.is_default ?? false
    });
    setFieldErrors({});
    setError("");
    setDistricts([]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateForm()) {
      return;
    }

    try {
      const phoneNormalized = normalizeVNPhone(form.phone) || form.phone.trim();
      const payload = {
        full_name: form.full_name.trim(),
        phone: phoneNormalized,
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

  const handleUpdate = async (item: Address) => {
    setError("");
    try {
      const data = await updateAddress(item.id, item);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật địa chỉ.");
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

  const editingAddress = editingId ? items.find((item) => item.id === editingId) : null;

  if (isAuthed === null) {
    return (
      <div className="section-shell pb-16 pt-14">
        <p className="text-sm text-ink/70">Đang tải địa chỉ...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="section-shell pb-16 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Đăng nhập để quản lý địa chỉ"
          description="Vui lòng đăng nhập bằng Google."
        />
        <div className="mt-6">
          <Link className="btn-primary" href="/login">
            Đi đến trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Địa chỉ giao hàng"
          description="Quản lý địa chỉ giao hàng của bạn."
        />
      </section>

      <section className="section-shell pb-16">
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-forest/10 bg-white p-6">
            <h2 className="text-lg font-semibold">Danh sách địa chỉ</h2>
            {loading ? (
              <p className="mt-4 text-sm text-ink/70">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="mt-4 text-sm text-ink/70">Chưa có địa chỉ.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-forest/10 bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{item.full_name}</h3>
                      {item.is_default ? (
                        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                          Mặc định
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-ink/70">{item.address_line}</p>
                    <p className="text-sm text-ink/60">
                      {[item.district, item.province].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-sm text-ink/60">{item.phone}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdate({ ...item, is_default: true })}
                        disabled={item.is_default}
                      >
                        Đặt mặc định
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                        Chỉnh sửa
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-forest/10 bg-white p-6">
            <h2 className="text-lg font-semibold">
              {editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
            </h2>
            {editingId ? (
              <p className="mt-2 text-xs text-ink/60">
                Đang chỉnh sửa {editingAddress?.full_name || "địa chỉ"}
              </p>
            ) : null}
            <div className="mt-4 grid gap-3">
              <div>
                <input
                  className="field"
                  value={form.full_name}
                  onChange={(event) => {
                    setForm({ ...form, full_name: event.target.value });
                    if (fieldErrors.full_name) {
                      setFieldErrors((prev) => ({ ...prev, full_name: "" }));
                    }
                  }}
                  placeholder="Họ và tên"
                />
                {fieldErrors.full_name ? (
                  <p className="mt-1 text-xs text-clay">{fieldErrors.full_name}</p>
                ) : null}
              </div>
              <div>
                <input
                  className="field"
                  value={form.phone}
                  onChange={(event) => {
                    setForm({ ...form, phone: event.target.value });
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }
                  }}
                  placeholder="Số điện thoại"
                />
                {fieldErrors.phone ? (
                  <p className="mt-1 text-xs text-clay">{fieldErrors.phone}</p>
                ) : null}
              </div>
              <div>
                <input
                  className="field"
                  value={form.address_line}
                  onChange={(event) => {
                    setForm({ ...form, address_line: event.target.value });
                    if (fieldErrors.address_line) {
                      setFieldErrors((prev) => ({ ...prev, address_line: "" }));
                    }
                  }}
                  placeholder="Địa chỉ (số nhà, đường, thôn/xóm)"
                />
                {fieldErrors.address_line ? (
                  <p className="mt-1 text-xs text-clay">{fieldErrors.address_line}</p>
                ) : null}
              </div>
              <div>
                <select
                  className="field"
                  value={form.province}
                  onChange={(event) => {
                    setForm({ ...form, province: event.target.value });
                    if (fieldErrors.province) {
                      setFieldErrors((prev) => ({ ...prev, province: "" }));
                    }
                  }}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((item) => (
                    <option key={item.code} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.province ? (
                  <p className="mt-1 text-xs text-clay">{fieldErrors.province}</p>
                ) : null}
              </div>
              <div>
                <select
                  className="field"
                  value={form.district}
                  onChange={(event) => {
                    setForm({ ...form, district: event.target.value });
                    if (fieldErrors.district) {
                      setFieldErrors((prev) => ({ ...prev, district: "" }));
                    }
                  }}
                  disabled={!form.province}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((item) => (
                    <option key={item.code} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.district ? (
                  <p className="mt-1 text-xs text-clay">{fieldErrors.district}</p>
                ) : null}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
                />
                Đặt làm địa chỉ mặc định
              </label>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSubmit}>
                  {editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
                </Button>
                {editingId ? (
                  <Button variant="outline" onClick={resetForm}>
                    Hủy chỉnh sửa
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
