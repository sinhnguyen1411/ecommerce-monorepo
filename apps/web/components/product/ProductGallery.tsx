"use client";

import { useState } from "react";

import { ProductImage } from "@/lib/api";

type ProductGalleryProps = {
  images: ProductImage[];
  name: string;
};

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
        <img src={activeImage.url} alt={name} />
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
              <img src={image.url} alt={name} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
