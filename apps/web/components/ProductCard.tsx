"use client";

import Image from "next/image";
import Link from "next/link";

import { buildAssetUrl, Product } from "@/lib/directus";
import { formatPrice } from "@/lib/format";

import AddToCartButton from "./cart/AddToCartButton";
import QuickViewModal from "./QuickViewModal";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.product_images?.[0]?.image;
  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;

  return (
    <div className="card-surface flex h-full flex-col overflow-hidden p-5">
      <div className="relative overflow-hidden rounded-2xl bg-sand">
        {onSale ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-ember px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cream">
            Sale
          </span>
        ) : null}
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative h-52 w-full">
            {image ? (
              <Image
                src={buildAssetUrl(image)}
                alt={product.name}
                fill
                className="object-cover transition duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                Image coming soon
              </div>
            )}
          </div>
        </Link>
      </div>
      <div className="mt-5 flex flex-1 flex-col">
        <p className="text-xs uppercase tracking-[0.2em] text-moss/70">
          Seasonal pick
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-2 text-lg font-semibold">{product.name}</h3>
        </Link>
        <p className="mt-2 text-sm text-ink/70">
          {product.description
            ? product.description.slice(0, 90).trim() + "..."
            : "Hand-selected with a focus on origin, freshness, and small farms."}
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {formatPrice(product.price)}
          </span>
          {onSale ? (
            <span className="text-sm text-ink/50 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <AddToCartButton product={product} />
          <QuickViewModal product={product} />
        </div>
      </div>
    </div>
  );
}

