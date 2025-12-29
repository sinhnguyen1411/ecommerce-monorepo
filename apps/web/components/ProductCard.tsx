"use client";

import Link from "next/link";

import { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

import AddToCartButton from "./cart/AddToCartButton";
import QuickViewModal from "./QuickViewModal";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0]?.url;
  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;

  return (
    <div className="card-surface flex h-full flex-col overflow-hidden p-5">
      <div className="relative overflow-hidden rounded-2xl bg-mist">
        {onSale ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-clay px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cream">
            Giam gia
          </span>
        ) : null}
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative h-52 w-full">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                Chua co anh
              </div>
            )}
          </div>
        </Link>
      </div>
      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2">
          {product.categories?.slice(0, 2).map((category) => (
            <span key={category.id} className="chip">
              {category.name}
            </span>
          ))}
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-3 text-lg font-semibold">{product.name}</h3>
        </Link>
        <p className="mt-2 text-sm text-ink/70">
          {product.description
            ? product.description.slice(0, 90).trim() + "..."
            : "San pham duoc lua chon tu cac vuon trong doi tac."}
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {formatCurrency(product.price)}
          </span>
          {onSale ? (
            <span className="text-sm text-ink/50 line-through">
              {formatCurrency(product.compare_at_price)}
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
