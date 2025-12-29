"use client";

import { Product } from "@/lib/api";

import { useCart } from "./CartContext";

type AddToCartButtonProps = {
  product: Product;
  variant?: "primary" | "ghost";
  label?: string;
};

export default function AddToCartButton({
  product,
  variant = "primary",
  label = "Them vao gio"
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const className = variant === "ghost" ? "btn-ghost" : "btn-primary";

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
