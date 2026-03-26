"use client";

import Image from "next/image";
import { useState } from "react";

import { ProductImage } from "@/lib/api";

type ProductGalleryProps = {
  images: ProductImage[];
  name: string;
};

function shouldBypassImageOptimization(url: string) {
  return (
    url.startsWith("blob:") ||
    url.startsWith("/uploads/") ||
    url.includes("://localhost:8080/uploads/") ||
    url.includes("://127.0.0.1:8080/uploads/")
  );
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images?.[activeIndex] || images?.[0];

  if (!images || images.length === 0) {
    return (
      <div className="product-gallery__inner sticky-gallery not_slide">
        <div className="product-gallery__photo product-gallery__empty">Đang cập nhật ảnh</div>
      </div>
    );
  }

  return (
    <div className="product-gallery__inner sticky-gallery not_slide">
      <div className="product-gallery__photo">
        {shouldBypassImageOptimization(activeImage.url) ? (
          <img
            src={activeImage.url}
            alt={name}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <Image
            src={activeImage.url}
            alt={name}
            width={640}
            height={640}
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 90vw, 520px"
          />
        )}
      </div>
      {images.length > 1 ? (
        <div className="product-gallery__thumbs">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`product-gallery__thumb ${activeIndex === index ? "active" : ""}`}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              {shouldBypassImageOptimization(image.url) ? (
                <img
                  src={image.url}
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Image
                  src={image.url}
                  alt={name}
                  width={120}
                  height={120}
                  className="h-full w-full object-cover"
                  sizes="120px"
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
