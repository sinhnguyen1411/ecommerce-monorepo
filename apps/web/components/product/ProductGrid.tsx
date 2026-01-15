"use client";

import { Product } from "@/lib/api";

import ProductCard from "./ProductCard";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="row list-product-row listProductFilter">
      {products.length === 0 ? (
        <div className="col-12 border border-forest/10 bg-white p-10 text-center text-sm text-ink/70">
          Không tìm thấy sản phẩm phù hợp.
        </div>
      ) : (
        products.map((product) => <ProductCard key={product.id} product={product} />)
      )}
    </div>
  );
}
