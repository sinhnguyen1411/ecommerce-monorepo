"use client";

import { Product } from "@/lib/directus";

import { useCart } from "./CartContext";

type AddToCartButtonProps = {
  product: Product;
  variant?: "primary" | "ghost";
  label?: string;
};

export default function AddToCartButton({
  product,
  variant = "primary",
  label = "Add to cart"
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
          image: product.product_images?.[0]?.image
        })
      }
    >
      {label}
    </button>
  );
}

