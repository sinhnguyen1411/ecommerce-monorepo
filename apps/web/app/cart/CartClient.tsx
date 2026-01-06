"use client";

import Link from "next/link";

import CartLineItem from "@/components/cart/CartLineItem";
import CartSummary from "@/components/cart/CartSummary";
import ProductGrid from "@/components/product/ProductGrid";
import { Product } from "@/lib/api";
import { useCartStore } from "@/store/cart";

const deliverySlots = [
  "Sang (08:00 - 11:00)",
  "Chieu (13:00 - 17:00)",
  "Toi (18:00 - 20:00)"
];

type CartClientProps = {
  suggestedProducts: Product[];
};

export default function CartClient({ suggestedProducts }: CartClientProps) {
  const items = useCartStore((state) => state.items);
  const note = useCartStore((state) => state.note);
  const promoCode = useCartStore((state) => state.promoCode);
  const deliveryTime = useCartStore((state) => state.deliveryTime);
  const setNote = useCartStore((state) => state.setNote);
  const setPromoCode = useCartStore((state) => state.setPromoCode);
  const setDeliveryTime = useCartStore((state) => state.setDeliveryTime);

  return (
    <div className="section-shell pb-16">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">San pham da chon</h2>
              <Link className="text-sm text-forest" href="/products">
                Tiep tuc mua sam
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {items.length === 0 ? (
                <p className="text-sm text-ink/70">Gio hang dang trong.</p>
              ) : (
                items.map((item) => <CartLineItem key={item.id} item={item} />)
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <h3 className="text-lg font-semibold">Uu dai trong gio</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink/70">
              <li>Giam 5% cho don hang tu 500.000</li>
              <li>Free ship khu vuc noi thanh</li>
            </ul>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <input
                className="field"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder="Nhap ma giam gia"
              />
              <button className="btn-ghost">Ap dung</button>
            </div>
          </div>

          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <h3 className="text-lg font-semibold">Ghi chu don hang</h3>
            <textarea
              className="field h-24"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chu them cho don hang"
            />
            <div className="mt-4">
              <label className="text-sm font-semibold">Chon khung gio giao</label>
              <select
                className="field mt-2"
                value={deliveryTime}
                onChange={(event) => setDeliveryTime(event.target.value)}
              >
                <option value="">Chon thoi gian</option>
                {deliverySlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <CartSummary />

          <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <h3 className="text-lg font-semibold">San pham lien quan</h3>
            <div className="mt-4">
              <ProductGrid products={suggestedProducts.slice(0, 3)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
