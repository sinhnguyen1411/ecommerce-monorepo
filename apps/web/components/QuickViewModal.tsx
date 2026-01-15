"use client";

import { useEffect, useState } from "react";

import { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

import AddToCartButton from "./cart/AddToCartButton";

type QuickViewModalProps = {
  product: Product;
};

export default function QuickViewModal({ product }: QuickViewModalProps) {
  const [open, setOpen] = useState(false);
  const image = product.images?.[0]?.url;
  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button className="button btnlight" onClick={() => setOpen(true)}>
        Xem nhanh
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl overflow-hidden border border-forest/10 bg-white shadow-lg">
            <div className="grid gap-6 p-8 md:grid-cols-[1.1fr_1fr]">
              <div className="relative h-64 overflow-hidden border border-forest/10 bg-white md:h-full">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                    Chưa có ảnh
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Xem nhanh</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="button btnlight"
                  >
                    Đóng
                  </button>
                </div>
                <h3 className="mt-5 text-2xl font-semibold">{product.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {product.description ||
                    "Sản phẩm được thu hoạch từ vườn đối tác trong ngày."}
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-xl font-semibold">
                    {formatCurrency(product.price)}
                  </span>
                  {onSale ? (
                    <span className="text-sm text-ink/50 line-through">
                      {formatCurrency(product.compare_at_price)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <AddToCartButton product={product} />
                  <AddToCartButton
                    product={product}
                    variant="ghost"
                    label="Thêm & tiếp tục"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
