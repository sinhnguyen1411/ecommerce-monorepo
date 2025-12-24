"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { buildAssetUrl, Product } from "@/lib/directus";
import { formatPrice } from "@/lib/format";

import AddToCartButton from "./cart/AddToCartButton";

type QuickViewModalProps = {
  product: Product;
};

export default function QuickViewModal({ product }: QuickViewModalProps) {
  const [open, setOpen] = useState(false);
  const image = product.product_images?.[0]?.image;
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
      <button className="btn-ghost" onClick={() => setOpen(true)}>
        Quick view
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl bg-cream shadow-glow">
            <div className="grid gap-6 p-8 md:grid-cols-[1.1fr_1fr]">
              <div className="relative h-64 overflow-hidden rounded-2xl bg-sand md:h-full">
                {image ? (
                  <Image
                    src={buildAssetUrl(image)}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                    No image available
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <p className="pill">Quick look</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-moss/20 px-3 py-1 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
                <h3 className="mt-5 text-2xl font-semibold">{product.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {product.description ||
                    "Small-batch harvest items with a focus on flavor and provenance."}
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-xl font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  {onSale ? (
                    <span className="text-sm text-ink/50 line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <AddToCartButton product={product} />
                  <AddToCartButton
                    product={product}
                    variant="ghost"
                    label="Add & keep browsing"
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

