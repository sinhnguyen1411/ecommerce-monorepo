"use client";

import { useState } from "react";

import { ProductImage } from "@/lib/api";

import SaleBadge from "./SaleBadge";

type ProductGalleryProps = {
  images: ProductImage[];
  name: string;
  salePercent?: number | null;
};

export default function ProductGallery({ images, name, salePercent }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images?.[activeIndex];

  if (!images || images.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center border border-forest/10 bg-white text-sm text-ink/50">
        Đang cập nhật ảnh
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden border border-forest/10 bg-white">
        {salePercent ? (
          <div className="absolute left-4 top-4 z-10">
            <SaleBadge percent={salePercent} />
          </div>
        ) : null}
        <div className="relative h-[420px] overflow-hidden">
          <img
            src={activeImage.url}
            alt={name}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        </div>
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-4">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`relative h-24 overflow-hidden border ${
                activeIndex === index ? "border-forest" : "border-forest/10"
              }`}
            >
              <img src={image.url} alt={name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
