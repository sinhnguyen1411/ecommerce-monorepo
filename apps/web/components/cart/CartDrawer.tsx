"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/format";

import { useCart } from "./CartContext";

export default function CartDrawer() {
  const { items, isOpen, close, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream px-6 py-8 shadow-lg transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="pill">Gio hang</p>
            <h2 className="mt-3 text-2xl font-semibold">Gio hang cua ban</h2>
          </div>
          <button
            onClick={close}
            className="rounded-full border border-forest/30 px-3 py-1 text-sm font-semibold text-forest transition hover:border-clay hover:text-clay"
          >
            Dong
          </button>
        </div>

        <div className="mt-8 flex-1 space-y-5 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-forest/30 bg-white/60 p-6 text-center text-sm text-ink/70">
              Gio hang dang trong.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-3xl border border-forest/10 bg-white/80 p-4"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-mist">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink/40">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-ink/60">
                    {formatCurrency(item.price)}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
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

        <div className="mt-6 border-t border-forest/10 pt-6">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Tam tinh</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-ink/60">
            Phi van chuyen duoc tinh o buoc thanh toan.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link className="btn-primary" href="/cart" onClick={close}>
              Xem gio hang
            </Link>
            <Link className="btn-ghost" href="/checkout" onClick={close}>
              Thanh toan
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
