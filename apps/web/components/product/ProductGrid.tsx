"use client";

import { Product } from "@/lib/api";

import ProductCard from "./ProductCard";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.length === 0 ? (
        <div className="col-span-full rounded-[28px] border border-forest/10 bg-white/80 p-10 text-center text-sm text-ink/70">
          Khong tim thay san pham phu hop.
        </div>
      ) : (
        products.map((product) => <ProductCard key={product.id} product={product} />)
      )}
    </div>
  );
}
