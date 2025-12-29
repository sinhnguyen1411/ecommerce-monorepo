"use client";

import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { useCart } from "@/components/cart/CartContext";
import { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";

type CartClientProps = {
  suggestedProducts: Product[];
};

export default function CartClient({ suggestedProducts }: CartClientProps) {
  const {
    items,
    subtotal,
    promoCode,
    note,
    deliveryTime,
    updateQuantity,
    removeItem,
    setPromoCode,
    setNote,
    setDeliveryTime
  } = useCart();

  const freeShippingThreshold = siteConfig.freeShippingThreshold;
  const minOrderAmount = siteConfig.minOrderAmount;
  const progress =
    freeShippingThreshold > 0
      ? Math.min(subtotal / freeShippingThreshold, 1)
      : 0;

  const meetsMinOrder = minOrderAmount === 0 || subtotal >= minOrderAmount;

  return (
    <div className="section-shell pb-16">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="card-surface p-6">
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
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 border-b border-forest/10 pb-4"
                  >
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-mist">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-ink/50">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-ink/60">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="h-8 w-8 rounded-full border border-forest/30 text-sm"
                      >
                        -
                      </button>
                      <span className="min-w-[2ch] text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 rounded-full border border-forest/30 text-sm"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-semibold uppercase tracking-[0.15em] text-clay"
                    >
                      Xoa
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card-surface p-6">
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

          <div className="card-surface p-6">
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
                <option value="Sang (08:00 - 11:00)">Sang (08:00 - 11:00)</option>
                <option value="Chieu (13:00 - 17:00)">Chieu (13:00 - 17:00)</option>
                <option value="Toi (18:00 - 20:00)">Toi (18:00 - 20:00)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <h3 className="text-lg font-semibold">Tong quan</h3>
            <div className="mt-4 space-y-2 text-sm text-ink/70">
              <div className="flex items-center justify-between">
                <span>Tam tinh</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phi van chuyen</span>
                <span>
                  {freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
                    ? "Mien phi"
                    : "Tinh khi giao"}
                </span>
              </div>
            </div>
            {freeShippingThreshold > 0 ? (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-ink/60">
                  <span>Hoan tat free ship</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-mist">
                  <div
                    className="h-2 rounded-full bg-forest"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                {subtotal < freeShippingThreshold ? (
                  <p className="mt-2 text-xs text-ink/60">
                    Can them {formatCurrency(freeShippingThreshold - subtotal)} de duoc free ship.
                  </p>
                ) : null}
              </div>
            ) : null}
            {minOrderAmount > 0 ? (
              <p className="mt-4 text-xs text-ink/60">
                Don hang toi thieu: {formatCurrency(minOrderAmount)}
              </p>
            ) : null}
            <Link
              href="/checkout"
              className={`btn-primary mt-6 w-full ${
                meetsMinOrder ? "" : "pointer-events-none opacity-50"
              }`}
            >
              Thanh toan
            </Link>
          </div>

          <div className="card-surface p-6">
            <h3 className="text-lg font-semibold">San pham lien quan</h3>
            <div className="mt-4 grid gap-4">
              {suggestedProducts.slice(0, 2).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
