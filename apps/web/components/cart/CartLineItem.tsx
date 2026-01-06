"use client";

import { Minus, Plus, X } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { CartItem, useCartStore } from "@/store/cart";

export default function CartLineItem({ item }: { item: CartItem }) {
  const incQty = useCartStore((state) => state.incQty);
  const decQty = useCartStore((state) => state.decQty);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-forest/10 pb-4">
      <div className="h-16 w-16 overflow-hidden rounded-2xl bg-mist">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink/50">
            No image
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{item.name}</p>
        <p className="text-xs text-ink/60">{formatCurrency(item.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => decQty(item.id)} className="h-8 w-8 rounded-full border border-forest/20">
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[2ch] text-center text-sm">{item.quantity}</span>
        <button onClick={() => incQty(item.id)} className="h-8 w-8 rounded-full border border-forest/20">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button onClick={() => removeItem(item.id)} className="text-forest/60 hover:text-clay">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
