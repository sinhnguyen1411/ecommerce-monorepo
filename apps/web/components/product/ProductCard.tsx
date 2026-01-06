"use client";

import Link from "next/link";

import { Product } from "@/lib/api";

import { useCartStore } from "@/store/cart";

import Price from "./Price";
import QuickViewDialog from "./QuickViewDialog";
import SaleBadge from "./SaleBadge";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0]?.url;
  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="group overflow-hidden rounded-[28px] border border-forest/10 bg-white/80 shadow-[0_16px_32px_-24px_rgba(33,55,43,0.4)]">
      <div className="relative overflow-hidden bg-mist">
        {onSale ? (
          <div className="absolute left-4 top-4 z-10">
            <SaleBadge />
          </div>
        ) : null}
        <Link href={`/products/${product.slug}`} className="block">
          <div className="aspect-[4/3] w-full">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                Dang cap nhat anh
              </div>
            )}
          </div>
        </Link>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2 text-xs text-forest/70">
          {product.categories?.slice(0, 2).map((category) => (
            <span key={category.id} className="rounded-full bg-forest/10 px-3 py-1">
              {category.name}
            </span>
          ))}
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base font-semibold text-ink">{product.name}</h3>
        </Link>
        <Price price={product.price} compareAt={product.compare_at_price} />
        <div className="flex items-center gap-2">
          <QuickViewDialog product={product} />
          <button
            className="rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-forest transition hover:border-clay hover:text-clay"
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                compareAtPrice: product.compare_at_price,
                imageUrl: image
              })
            }
          >
            Them nhanh
          </button>
        </div>
      </div>
    </div>
  );
}
