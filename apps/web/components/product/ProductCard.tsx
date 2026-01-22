"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

import { Product } from "@/lib/api";
import { useCartStore } from "@/store/cart";

import Price from "./Price";
import QuickViewDialog from "./QuickViewDialog";
import SaleBadge from "./SaleBadge";

const PLACEHOLDER_IMAGES = [
  "/tam-bo/products/placeholder_1.svg",
  "/tam-bo/products/placeholder_2.svg",
  "/tam-bo/products/placeholder_3.svg"
];

export default function ProductCard({ product }: { product: Product }) {
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
  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;
  const percent = useMemo(() => {
    if (!onSale || !product.compare_at_price) {
      return undefined;
    }
    return Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
  }, [onSale, product.compare_at_price, product.price]);
  const available =
    typeof product.available === "boolean"
      ? product.available
      : product.inventory_quantity == null
        ? true
        : product.inventory_quantity > 0;
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (!isHovering || images.length < 2) {
      return undefined;
    }
    setActiveImage(0);
    const timeoutId = window.setTimeout(() => {
      setActiveImage(1);
    }, 500);
    const intervalId = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 1500);
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
    <div className="col-lg-4 col-md-6 col-6 product-loop" data-id={product.id}>
      <div
        className="product-inner"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setActiveImage(0);
        }}
      >
        <div className="proloop-image">
          <div className="proloop-image__inner">
            <div className="lazy-img lazy-img__prod">
              <Image
                src={images[activeImage]}
                alt={product.name}
                width={480}
                height={360}
                className="product-img product-img--carousel"
                sizes="(max-width: 768px) 90vw, 320px"
              />
            </div>
          </div>
          <div className="proloop-image__position">
            {onSale ? <SaleBadge percent={percent} /> : null}
            {!available ? (
              <div className="pro-soldout">
                <span>Hết hàng</span>
              </div>
            ) : null}
            <Link href={`/products/${product.slug}`} className="proloop-link quickview-product" />
            <div className="proloop-quickview">
              <QuickViewDialog
                product={product}
                trigger={
                  <button className="icon-quickview tooltip-cs" type="button" aria-label="Xem nhanh">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 577.029 577.029">
                      <path d="M288.514,148.629c73.746,0,136.162,33.616,175.539,61.821c46.652,33.415,70.66,65.737,76.885,78.065c-6.232,12.327-30.232,44.649-76.885,78.065c-39.377,28.204-101.793,61.82-175.539,61.82c-73.746,0-136.161-33.616-175.539-61.82c-46.661-33.416-70.66-65.738-76.894-78.065c6.234-12.328,30.233-44.65,76.885-78.065C152.353,182.245,214.768,148.629,288.514,148.629z M288.514,183.601c-57.939,0-104.914,46.975-104.914,104.914c0,57.938,46.975,104.914,104.914,104.914s104.914-46.976,104.914-104.914C393.428,230.576,346.453,183.601,288.514,183.601z M260.266,288.515c0-24.515,19.873-44.387,44.388-44.387s44.388,19.873,44.388,44.387c0,24.515-19.873,44.388-44.388,44.388S260.266,313.03,260.266,288.515z" />
                    </svg>
                    <span className="tooltip-hover">Xem nhanh</span>
                  </button>
                }
              />
            </div>
          </div>
        </div>
        <div className="proloop-detail">
          <h3 className="proloop-title">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className={`proloop-price ${onSale ? "on-sale" : ""}`}>
            <Price price={product.price} compareAt={product.compare_at_price} />
            <span className="addtocart-mb d-sm-block d-lg-none">
              <button
                className={`icon-addtocart ${available ? "" : "disabled"}`}
                type="button"
                onClick={() =>
                  addItem({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    compareAtPrice: product.compare_at_price,
                    imageUrl: images[0],
                    quantity
                  })
                }
                disabled={!available}
                aria-label="Thêm vào giỏ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 22 22">
                  <path d="M15.95 6H19.7V17.875C19.7 18.7344 19.3875 19.4635 18.7625 20.0625C18.1635 20.6875 17.4344 21 16.575 21H5.325C4.46563 21 3.72344 20.6875 3.09844 20.0625C2.49948 19.4635 2.2 18.7344 2.2 17.875V6H5.95C5.95 4.61979 6.43177 3.44792 7.39531 2.48438C8.3849 1.49479 9.56979 1 10.95 1C12.3302 1 13.5021 1.49479 14.4656 2.48438C15.4552 3.44792 15.95 4.61979 15.95 6ZM13.1375 3.8125C12.5385 3.1875 11.8094 2.875 10.95 2.875C10.0906 2.875 9.34844 3.1875 8.72344 3.8125C8.12448 4.41146 7.825 5.14062 7.825 6H14.075C14.075 5.14062 13.7625 4.41146 13.1375 3.8125ZM17.825 17.875V7.875H15.95V9.4375C15.95 9.69792 15.8589 9.91927 15.6766 10.1016C15.4943 10.2839 15.2729 10.375 15.0125 10.375C14.7521 10.375 14.5307 10.2839 14.3484 10.1016C14.1661 9.91927 14.075 9.69792 14.075 9.4375V7.875H7.825V9.4375C7.825 9.69792 7.73385 9.91927 7.55156 10.1016C7.36927 10.2839 7.14792 10.375 6.8875 10.375C6.62708 10.375 6.40573 10.2839 6.22344 10.1016C6.04115 9.91927 5.95 9.69792 5.95 9.4375V7.875H4.075V17.875C4.075 18.2135 4.19219 18.5 4.42656 18.7344C4.68698 18.9948 4.98646 19.125 5.325 19.125H16.575C16.9135 19.125 17.2 18.9948 17.4344 18.7344C17.6948 18.5 17.825 18.2135 17.825 17.875Z"></path>
                </svg>
              </button>
            </span>
          </p>
          <div className="proloop-actions" data-vrid={product.id}>
            <div className="proloop-actions__inner">
              <div className="proloop-actions__cart">
                <div className="actions-primary">
                  <button
                    className={`button btn-small btn-proloop-cart add-to-cart ${available ? "" : "disabled"}`}
                    onClick={() =>
                      addItem({
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        compareAtPrice: product.compare_at_price,
                        imageUrl: images[0],
                        quantity
                      })
                    }
                    disabled={!available}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 22 22">
                      <path d="M15.95 6H19.7V17.875C19.7 18.7344 19.3875 19.4635 18.7625 20.0625C18.1635 20.6875 17.4344 21 16.575 21H5.325C4.46563 21 3.72344 20.6875 3.09844 20.0625C2.49948 19.4635 2.2 18.7344 2.2 17.875V6H5.95C5.95 4.61979 6.43177 3.44792 7.39531 2.48438C8.3849 1.49479 9.56979 1 10.95 1C12.3302 1 13.5021 1.49479 14.4656 2.48438C15.4552 3.44792 15.95 4.61979 15.95 6ZM13.1375 3.8125C12.5385 3.1875 11.8094 2.875 10.95 2.875C10.0906 2.875 9.34844 3.1875 8.72344 3.8125C8.12448 4.41146 7.825 5.14062 7.825 6H14.075C14.075 5.14062 13.7625 4.41146 13.1375 3.8125ZM17.825 17.875V7.875H15.95V9.4375C15.95 9.69792 15.8589 9.91927 15.6766 10.1016C15.4943 10.2839 15.2729 10.375 15.0125 10.375C14.7521 10.375 14.5307 10.2839 14.3484 10.1016C14.1661 9.91927 14.075 9.69792 14.075 9.4375V7.875H7.825V9.4375C7.825 9.69792 7.73385 9.91927 7.55156 10.1016C7.36927 10.2839 7.14792 10.375 6.8875 10.375C6.62708 10.375 6.40573 10.2839 6.22344 10.1016C6.04115 9.91927 5.95 9.69792 5.95 9.4375V7.875H4.075V17.875C4.075 18.2135 4.19219 18.5 4.42656 18.7344C4.68698 18.9948 4.98646 19.125 5.325 19.125H16.575C16.9135 19.125 17.2 18.9948 17.4344 18.7344C17.6948 18.5 17.825 18.2135 17.825 17.875Z"></path>
                    </svg>
                    <span>Thêm vào giỏ</span>
                  </button>
                </div>
              </div>
              <div className="qty quantity-partent qty-click clearfix">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="qtyminus qty-btn"
                  aria-label="Giảm số lượng"
                  disabled={!available}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="item-quantity">{quantity}</span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="qtyplus qty-btn"
                  aria-label="Tăng số lượng"
                  disabled={!available}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
