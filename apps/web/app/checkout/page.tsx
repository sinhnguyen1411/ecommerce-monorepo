"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getCartSubtotal, useCartStore } from "@/store/cart";

const paymentOptions = [
  { value: "cod", label: "Thanh toan khi nhan hang" },
  { value: "bank_transfer", label: "Chuyen khoan ngan hang" },
  { value: "bank_qr", label: "Thanh toan QR" }
];

const shippingOptions = [
  { value: "standard", label: "Giao tieu chuan (24-48h)" },
  { value: "express", label: "Giao nhanh (2-4h)" }
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const note = useCartStore((state) => state.note);
  const deliveryTime = useCartStore((state) => state.deliveryTime);
  const clear = useCartStore((state) => state.clear);
  const setPromoCode = useCartStore((state) => state.setPromoCode);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getCartSubtotal(items);
  const minOrderAmount = siteConfig.minOrderAmount;
  const meetsMinOrder = minOrderAmount === 0 || subtotal >= minOrderAmount;

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const handleSubmit = async () => {
    setError("");

    if (!meetsMinOrder) {
      setError("Don hang chua dat gia tri toi thieu.");
      return;
    }

    if (!customerName || !email || !phone || !address) {
      setError("Vui long dien day du thong tin giao hang.");
      return;
    }

    if (items.length === 0) {
      setError("Gio hang dang trong.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createOrder({
        customer_name: customerName,
        email,
        phone,
        address,
        note,
        delivery_time: deliveryTime || shippingMethod,
        payment_method: paymentMethod,
        promo_code: promoCode,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });

      window.localStorage.setItem(
        "ttc_last_order",
        JSON.stringify({
          ...response,
          customer_name: customerName,
          email,
          phone,
          address,
          payment_method: paymentMethod
        })
      );
      clear();
      router.push("/checkout/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toan that bai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <div>
          <p className="pill">Thanh toan</p>
          <h1 className="mt-4 text-4xl font-semibold">Hoan tat don hang</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/70">
            Dien thong tin giao hang va chon hinh thuc thanh toan.
          </p>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
              <h2 className="text-lg font-semibold">Thong tin giao hang</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  className="field"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Ho va ten"
                />
                <input
                  className="field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                />
                <input
                  className="field"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="So dien thoai"
                />
                <input
                  className="field"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Dia chi giao hang"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
              <h2 className="text-lg font-semibold">Phuong thuc giao hang</h2>
              <div className="mt-4 grid gap-3">
                {shippingOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center justify-between rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 text-sm"
                  >
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name="shipping"
                      value={option.value}
                      checked={shippingMethod === option.value}
                      onChange={(event) => setShippingMethod(event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
              <h2 className="text-lg font-semibold">Phuong thuc thanh toan</h2>
              <div className="mt-4 grid gap-3">
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center justify-between rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 text-sm"
                  >
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
              <h2 className="text-lg font-semibold">Khuyen mai</h2>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  className="field"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="Nhap ma khuyen mai"
                />
                <button className="btn-ghost">Ap dung</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
              <h3 className="text-lg font-semibold">Tong don hang</h3>
              <div className="mt-4 space-y-2 text-sm text-ink/70">
                <div className="flex items-center justify-between">
                  <span>So luong san pham</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tam tinh</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {minOrderAmount > 0 ? (
                  <p className="text-xs text-ink/60">
                    Don hang toi thieu {formatCurrency(minOrderAmount)}
                  </p>
                ) : null}
              </div>
              {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}
              <Button
                className="mt-6 w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || !meetsMinOrder}
              >
                {isSubmitting ? "Dang xu ly..." : "Dat hang"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
