"use client";

import Link from "next/link";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { getCartCount, getCartSubtotal, useCartStore } from "@/store/cart";

import CartLineItem from "./CartLineItem";

export default function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const subtotal = getCartSubtotal(items);
  const count = getCartCount(items);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? null : close())}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <SheetTitle>Gio hang ({count})</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-forest/20 bg-white/80 p-6 text-sm text-ink/70">
                Gio hang dang trong.
              </div>
            ) : (
              items.map((item) => <CartLineItem key={item.id} item={item} />)
            )}
          </div>
          <div className="mt-6 border-t border-forest/10 pt-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Tam tinh</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/cart" className="rounded-full border border-forest/20 px-4 py-2 text-center text-sm font-semibold text-forest" onClick={close}>
                Xem gio hang
              </Link>
              <Link href="/checkout" className="rounded-full bg-forest px-4 py-2 text-center text-sm font-semibold text-white" onClick={close}>
                Thanh toan
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
