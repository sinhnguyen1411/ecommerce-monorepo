"use client";

import { Product } from "@/lib/api";

import { useCartStore } from "@/store/cart";

type AddToCartButtonProps = {
  product: Product;
  variant?: "primary" | "ghost";
  label?: string;
};

export default function AddToCartButton({
  product,
  variant = "primary",
  label = "Thêm vào giỏ"
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const className = variant === "ghost" ? "button btnlight" : "button";

  return (
    <button
      className={className}
      onClick={() =>
        addItem({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compareAtPrice: product.compare_at_price,
          imageUrl: product.images?.[0]?.url
        })
      }
    >
      {label}
    </button>
  );
}
