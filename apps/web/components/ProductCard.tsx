"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

import AddToCartButton from "./cart/AddToCartButton";
import QuickViewModal from "./QuickViewModal";

type ProductCardProps = {
  product: Product;
};

const PLACEHOLDER_IMAGES = [
  "https://images.pexels.com/photos/10541145/pexels-photo-10541145.jpeg?cs=srgb&dl=pexels-sarahpictures-10541145.jpg&fm=jpg",
  "https://images.pexels.com/photos/19455179/pexels-photo-19455179.jpeg?cs=srgb&dl=pexels-julian-cabrera-s-3685809-19455179.jpg&fm=jpg",
  "https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg"
];

export default function ProductCard({ product }: ProductCardProps) {
  const images = useMemo(() => {
    const sources = [...(product.images || [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item) => item.url)
      .filter(Boolean);
    const fallback = [...sources];
    while (fallback.length < 3) {
      fallback.push(PLACEHOLDER_IMAGES[fallback.length % PLACEHOLDER_IMAGES.length]);
    }
    return fallback;
  }, [product.images]);
  const [activeImage, setActiveImage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();
  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;

  useEffect(() => {
    if (!isHovering || images.length < 2) {
      return undefined;
    }
    setActiveImage(0);
    const timeoutId = window.setTimeout(() => {
      setActiveImage(1);
    }, 450);
    const intervalId = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 1200);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [images.length, isHovering]);

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) {
      return;
    }
    router.push(`/products/${product.slug}`);
  };

  return (
    <div
      className="card-surface flex h-full flex-col overflow-hidden p-5"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveImage(0);
      }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-mist">
        {onSale ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-clay px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cream">
            Giảm giá
          </span>
        ) : null}
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative h-52 w-full">
            <Image
              src={images[activeImage]}
              alt={product.name}
              width={480}
              height={360}
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
              sizes="(max-width: 768px) 90vw, 320px"
            />
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
            : "Sản phẩm được lựa chọn từ các vườn trồng đối tác."}
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
