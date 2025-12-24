"use client";

import Image from "next/image";

import { buildAssetUrl } from "@/lib/directus";
import { formatPrice } from "@/lib/format";

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
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream px-6 py-8 shadow-glow transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="pill">Cart</p>
            <h2 className="mt-3 text-2xl font-semibold">Your basket</h2>
          </div>
          <button
            onClick={close}
            className="rounded-full border border-moss/30 px-3 py-1 text-sm font-semibold text-moss transition hover:border-ember hover:text-ember"
          >
            Close
          </button>
        </div>

        <div className="mt-8 flex-1 space-y-5 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-moss/30 bg-white/60 p-6 text-center text-sm text-ink/70">
              Your cart is empty. Add something fresh to get started.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-3xl border border-moss/10 bg-white/80 p-4"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-sand">
                  {item.image ? (
                    <Image
                      src={buildAssetUrl(item.image)}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink/40">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-ink/60">{formatPrice(item.price)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, Math.max(1, item.quantity - 1))
                      }
                      className="h-8 w-8 rounded-full border border-moss/30 text-sm"
                    >
                      -
                    </button>
                    <span className="min-w-[2ch] text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 rounded-full border border-moss/30 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs font-semibold uppercase tracking-[0.15em] text-ember"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-moss/10 pt-6">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-ink/60">
            Shipping and taxes calculated at checkout.
          </p>
          <button className="btn-primary mt-6 w-full">
            Continue to checkout
          </button>
        </div>
      </aside>
    </div>
  );
}

