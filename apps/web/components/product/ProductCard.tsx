"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";

import { Product } from "@/lib/api";
import { useCartStore } from "@/store/cart";

import Price from "./Price";
import QuickViewDialog from "./QuickViewDialog";
import SaleBadge from "./SaleBadge";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0]?.url;
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

  return (
    <div className="product-loop">
      <div className="product-inner">
        <div className="proloop-image">
          {onSale ? <SaleBadge percent={percent} /> : null}
          {!available ? <span className="pro-soldout">Hết hàng</span> : null}
          <Link href={`/products/${product.slug}`} className="proloop-link">
            <div className="lazy-img">
              {image ? (
                <img src={image} alt={product.name} />
              ) : (
                <div className="no-image">Đang cập nhật ảnh</div>
              )}
            </div>
          </Link>
        </div>
        <div className="proloop-detail">
          <Link href={`/products/${product.slug}`} className="proloop-title">
            {product.name}
          </Link>
          <div className={`proloop-price ${onSale ? "on-sale" : ""}`}>
            <Price price={product.price} compareAt={product.compare_at_price} />
          </div>
          <div className="proloop-actions">
            <QuickViewDialog product={product} />
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
            <button
              className={`btn-addtocart ${available ? "" : "disabled"}`}
              onClick={() =>
                addItem({
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  compareAtPrice: product.compare_at_price,
                  imageUrl: image,
                  quantity
                })
              }
            >
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
