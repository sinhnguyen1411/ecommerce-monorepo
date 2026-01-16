"use client";

import Link from "next/link";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getCartCount, getCartSubtotal, useCartStore } from "@/store/cart";

import CartLineItem from "./CartLineItem";

export default function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const subtotal = getCartSubtotal(items);
  const count = getCartCount(items);
  const freeThreshold = siteConfig.freeShippingThreshold;
  const minOrder = siteConfig.minOrderAmount;
  const progress = freeThreshold > 0 ? Math.min(subtotal / freeThreshold, 1) : 0;
  const meetsMinOrder = minOrder === 0 || subtotal >= minOrder;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? null : close())}>
      <SheetContent className="max-w-md">
        <SheetHeader>
        <SheetTitle>Giỏ hàng ({count})</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex h-full flex-col">
          <div className="space-y-4">
            {freeThreshold > 0 ? (
              <div className="border border-forest/10 bg-white p-4 text-xs text-ink/70">
                <div className="flex items-center justify-between text-xs">
                  <span>Miễn phí vận chuyển</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="mt-2 h-2 bg-mist">
                  <div
                    className="h-2 bg-forest"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                {subtotal < freeThreshold ? (
                  <p className="mt-2">
                    Cần thêm {formatCurrency(freeThreshold - subtotal)} để được miễn phí vận chuyển.
                  </p>
                ) : (
                  <p className="mt-2">Bạn đã đủ điều kiện free ship.</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
            {items.length === 0 ? (
              <div className="border border-dashed border-forest/20 bg-white p-6 text-center text-sm text-ink/70">
                <img
                  src="/tam-bo/cart/no_image.jpg"
                  alt="empty"
                  className="mx-auto h-24 w-24 object-cover"
                />
                <p className="mt-4">Giỏ hàng đang trống.</p>
              </div>
            ) : (
              items.map((item) => <CartLineItem key={item.id} item={item} />)
            )}
          </div>
          <div className="mt-6 border-t border-forest/10 pt-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {minOrder > 0 && !meetsMinOrder ? (
              <p className="mt-2 text-xs text-clay">
                Đơn hàng tối thiểu {formatCurrency(minOrder)}.
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/cart"
                className="button btnlight"
                onClick={close}
              >
                Xem giỏ hàng
              </Link>
              <Link
                href="/checkout"
                className={`button ${meetsMinOrder ? "" : "disabled"}`}
                onClick={close}
              >
                Thanh toán
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
