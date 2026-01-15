"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Facebook, Link2, Minus, Plus, Twitter } from "lucide-react";
import { Product } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import { useCartStore } from "@/store/cart";

import Price from "./Price";

type ProductDetailSidebarProps = {
  product: Product;
};

export default function ProductDetailSidebar({ product }: ProductDetailSidebarProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const image = product.images?.[0]?.url;
  const [quantity, setQuantity] = useState(1);
  const [shareUrl, setShareUrl] = useState("");
  const available =
    typeof product.available === "boolean"
      ? product.available
      : product.inventory_quantity == null
        ? true
        : product.inventory_quantity > 0;

  const percent = useMemo(() => {
    if (!product.compare_at_price || product.compare_at_price <= product.price) {
      return null;
    }
    return Math.round(
      ((product.compare_at_price - product.price) / product.compare_at_price) * 100
    );
  }, [product.compare_at_price, product.price]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compare_at_price,
      imageUrl: image,
      quantity
    });
  };

  const handleBuyNow = () => {
    handleAdd();
    router.push("/checkout");
  };

  const handleCopy = async () => {
    if (!shareUrl || typeof navigator === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      return;
    }
  };

  const shareEncoded = encodeURIComponent(shareUrl);

  return (
    <div className="info-wrapper">
      <div className="info-header">
        <div className="product-name">
          <h1>{product.name}</h1>
        </div>
        <div className="product-sku">
          <span className="pro-state">
            Tình trạng: <strong>{available ? "Còn hàng" : "Hết hàng"}</strong>
          </span>
          {product.vendor ? (
            <span className="pro-vendor">
              Thương hiệu:{" "}
              <strong>
                <Link href={`/collections/all?vendor=${encodeURIComponent(product.vendor)}`}>
                  {product.vendor}
                </Link>
              </strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="info-body">
        <div className="product-price">
          <span className="pro-title">Giá:</span>
          <Price price={product.price} compareAt={product.compare_at_price} />
          {percent ? <span className="pro-percent">-{percent}%</span> : null}
        </div>

        <div className="product-quantity">
          <div className="pro-title">Số lượng:</div>
          <div className="pro-qty">
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="qty-btn"
              aria-label="Giảm số lượng"
              disabled={!available}
            >
              <Minus className="h-4 w-4" />
            </button>
            <input className="qty-value" value={quantity} readOnly aria-label="Số lượng" />
            <button
              type="button"
              onClick={() => setQuantity((prev) => prev + 1)}
              className="qty-btn"
              aria-label="Tăng số lượng"
              disabled={!available}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="product-actions">
          <div className="product-actions__inner">
            <div className="action-buys">
              <button
                type="button"
                className={`button btn-addtocart ${!available ? "disabled" : ""}`}
                onClick={handleAdd}
                disabled={!available}
              >
                Thêm vào giỏ
              </button>
              <button
                type="button"
                className={`button btnred btn-buynow ${!available ? "disabled" : ""}`}
                onClick={handleBuyNow}
                disabled={!available}
              >
                Mua ngay
              </button>
            </div>
            <div className="action-link">
              <Link
                className="button btndark link-voucher"
                href={siteConfig.social.messenger}
                target="_blank"
                rel="noopener"
              >
                Click vào đây để nhận ưu đãi
              </Link>
            </div>
          </div>
        </div>

        <div className="product-share">
          <span className="pro-title">Chia sẻ: </span>
          <Link
            className="tooltip-cs share-facebook"
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareEncoded}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <Facebook className="h-4 w-4" />
          </Link>
          <Link
            className="tooltip-cs share-twitter"
            href={`https://twitter.com/intent/tweet?url=${shareEncoded}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter"
          >
            <Twitter className="h-4 w-4" />
          </Link>
          <button
            className="tooltip-cs share-link"
            type="button"
            onClick={handleCopy}
            aria-label="Sao chép liên kết"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
