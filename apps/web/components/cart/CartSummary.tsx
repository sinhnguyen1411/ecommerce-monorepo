"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getCartSubtotal, useCartStore } from "@/store/cart";

export default function CartSummary() {
  const items = useCartStore((state) => state.items);
  const subtotal = getCartSubtotal(items);
  const freeThreshold = siteConfig.freeShippingThreshold;
  const minOrder = siteConfig.minOrderAmount;
  const progress = freeThreshold > 0 ? Math.min(subtotal / freeThreshold, 1) : 0;
  const meetsMinOrder = minOrder === 0 || subtotal >= minOrder;

  return (
    <div className="rounded-[28px] border border-forest/10 bg-white/80 p-6">
      <h3 className="text-lg font-semibold">Tong quan</h3>
      <div className="mt-4 space-y-2 text-sm text-ink/70">
        <div className="flex items-center justify-between">
          <span>Tam tinh</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Phi van chuyen</span>
          <span>
            {freeThreshold > 0 && subtotal >= freeThreshold ? "Mien phi" : "Tinh khi giao"}
          </span>
        </div>
      </div>
      {freeThreshold > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-ink/60">
            <span>Free ship</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-mist">
            <div className="h-2 rounded-full bg-forest" style={{ width: `${progress * 100}%` }} />
          </div>
          {subtotal < freeThreshold ? (
            <p className="mt-2 text-xs text-ink/60">
              Can them {formatCurrency(freeThreshold - subtotal)} de duoc free ship.
            </p>
          ) : null}
        </div>
      ) : null}
      {minOrder > 0 ? (
        <p className="mt-4 text-xs text-ink/60">Don hang toi thieu: {formatCurrency(minOrder)}</p>
      ) : null}
      <Link
        href="/checkout"
        className={`mt-6 inline-flex w-full items-center justify-center rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white ${
          meetsMinOrder ? "" : "pointer-events-none opacity-50"
        }`}
      >
        Thanh toan
      </Link>
    </div>
  );
}
