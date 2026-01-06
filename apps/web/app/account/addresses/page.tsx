"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import { getUserToken } from "@/lib/auth";
import {
  Address,
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress
} from "@/lib/account";

const emptyForm: Omit<Address, "id"> = {
  full_name: "",
  phone: "",
  address_line: "",
  province: "",
  district: "",
  is_default: false
};

export default function AddressesPage() {
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAddresses();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getUserToken()) {
      return;
    }
    load();
  }, []);

  const handleCreate = async () => {
    setError("");
    try {
      const data = await createAddress(form);
      setItems(data);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create address");
    }
  };

  const handleUpdate = async (item: Address) => {
    setError("");
    try {
      const data = await updateAddress(item.id, item);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update address");
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    try {
      await deleteAddress(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    }
  };

  if (!getUserToken()) {
    return (
      <div className="section-shell pb-16 pt-14">
        <SectionTitle
          eyebrow="Tai khoan"
          title="Dang nhap de quan ly dia chi"
          description="Vui long dang nhap bang Google."
        />
        <div className="mt-6">
          <Link className="btn-primary" href="/login">
            Di den trang dang nhap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Tai khoan"
          title="Dia chi giao hang"
          description="Quan ly dia chi giao hang cua ban."
        />
      </section>

      <section className="section-shell pb-16">
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <h2 className="text-lg font-semibold">Danh sach dia chi</h2>
            {loading ? (
              <p className="mt-4 text-sm text-ink/70">Dang tai...</p>
            ) : items.length === 0 ? (
              <p className="mt-4 text-sm text-ink/70">Chua co dia chi.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-forest/10 bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{item.full_name}</h3>
                      {item.is_default ? (
                        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                          Mac dinh
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-ink/70">{item.address_line}</p>
                    <p className="text-sm text-ink/60">
                      {item.district} {item.province}
                    </p>
                    <p className="text-sm text-ink/60">{item.phone}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdate({ ...item, is_default: true })}
                      >
                        Dat mac dinh
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        Xoa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <h2 className="text-lg font-semibold">Them dia chi</h2>
            <div className="mt-4 grid gap-3">
              <input
                className="field"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                placeholder="Ho va ten"
              />
              <input
                className="field"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="So dien thoai"
              />
              <input
                className="field"
                value={form.address_line}
                onChange={(event) => setForm({ ...form, address_line: event.target.value })}
                placeholder="Dia chi"
              />
              <input
                className="field"
                value={form.district}
                onChange={(event) => setForm({ ...form, district: event.target.value })}
                placeholder="Quan / Huyen"
              />
              <input
                className="field"
                value={form.province}
                onChange={(event) => setForm({ ...form, province: event.target.value })}
                placeholder="Tinh / Thanh"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
                />
                Dat lam dia chi mac dinh
              </label>
              <Button onClick={handleCreate}>Them dia chi</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
