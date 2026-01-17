"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Facebook, Link2, Minus, Plus, Truck, Twitter } from "lucide-react";
import { Product, Promotion, getPromotions } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoError, setPromoError] = useState("");
  const [now, setNow] = useState(() => new Date());
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

  useEffect(() => {
    if (!promotions.some((promo) => promo.ends_at)) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [promotions]);

  useEffect(() => {
    let isActive = true;
    getPromotions()
      .then((data) => {
        if (!isActive) {
          return;
        }
        setPromotions(data);
        setPromoError("");
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }
        setPromoError(err instanceof Error ? err.message : "Failed to load promotions");
      });
    return () => {
      isActive = false;
    };
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

  const handleCopyCode = async (code: string) => {
    if (!code || typeof navigator === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
  };

  const buildPromoLabel = (promo: Promotion) => {
    if (promo.discount_type === "percent") {
      return `Gi\u1EA3m ${promo.discount_value}%`;
    }
    const amount = Math.round(promo.discount_value / 1000);
    return `Gi\u1EA3m ${amount}k`;
  };

  const buildPromoDescription = (promo: Promotion) => {
    if (promo.min_subtotal > 0) {
      return `\u0110\u01A1n t\u1ED1i thi\u1EC3u ${formatCurrency(promo.min_subtotal)}`;
    }
    return "Kh\u00F4ng y\u00EAu c\u1EA7u \u0111\u01A1n t\u1ED1i thi\u1EC3u";
  };

  const buildPromoCountdown = (promo: Promotion) => {
    if (promo.discount_type !== "percent" || !promo.ends_at) {
      return "";
    }
    const end = new Date(promo.ends_at);
    if (Number.isNaN(end.getTime())) {
      return "";
    }
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) {
      return "\u0110\u00E3 h\u1EBFt h\u1EA1n";
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [
      days > 0 ? `${days} ng\u00E0y` : "",
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    ].filter(Boolean);
    return `C\u00F2n ${parts.join(" ")}`;
  };

  const buildPromoDateRange = (promo: Promotion) => {
    if (promo.discount_type !== "percent") {
      return "";
    }
    if (!promo.starts_at && !promo.ends_at) {
      return "";
    }
    const start = promo.starts_at ? formatDate(promo.starts_at) : "";
    const end = promo.ends_at ? formatDate(promo.ends_at) : "";
    if (start && end) {
      return `\u00C1p d\u1EE5ng: ${start} - ${end}`;
    }
    if (end) {
      return `HSD: ${end}`;
    }
    return `T\u1EEB: ${start}`;
  };

  const shareEncoded = encodeURIComponent(shareUrl);
  const voucherGroups = promotions.map((promo) => ({
    promo,
    label: buildPromoLabel(promo),
    desc: buildPromoDescription(promo),
    code: promo.code
  }));
  const variants = (product.tags || []).filter(Boolean);

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

        <div className="detail-sections">
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

        {variants.length > 0 ? (
          <div className="variant-section">
            <div className="variant-collection">
              <div className="variant-title">{"Ph\u00E2n lo\u1EA1i"}</div>
              <div className="variant-grid">
                {variants.map((variant, index) => (
                  <button type="button" className="variant-item" key={`${variant}-${index}`}>
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="voucher-section">
          <div className="voucher-heading">{"Voucher gi\u1EA3m gi\u00E1"}</div>
          {siteConfig.freeShippingThreshold > 0 ? (
            <div className="voucher-freeship">
              <Truck className="h-4 w-4" />
              <span>
                {"Mi\u1EC5n ph\u00ED v\u1EADn chuy\u1EC3n cho \u0111\u01A1n t\u1EEB "}
                {formatCurrency(siteConfig.freeShippingThreshold)}
              </span>
            </div>
          ) : null}
          {promoError ? <p className="voucher-empty">{promoError}</p> : null}
          {voucherGroups.length === 0 && !promoError ? (
            <p className="voucher-empty">
              {"\u0110ang c\u1EADp nh\u1EADt ch\u01B0\u01A1ng tr\u00ECnh khuy\u1EBFn m\u00E3i."}
            </p>
          ) : (
            <div className="voucher-strip">
          {voucherGroups.map((group, index) => (
            <div className="voucher-group" key={`${group.label}-${index}`}>
              <span className="voucher-pill">
                {group.label}
              </span>
              <div className="voucher-popover">
                <div className="voucher-popover__title">{"Voucher c\u1EE7a shop"}</div>
                <div className="voucher-popover__list">
                  <div className="voucher-popover__item" key={group.code}>
                    <div className="voucher-popover__label">{group.label}</div>
                    <div className="voucher-popover__desc">{group.desc}</div>
                    {buildPromoDateRange(group.promo) ? (
                      <div className="voucher-popover__meta">
                        {buildPromoDateRange(group.promo)}
                      </div>
                    ) : null}
                    {buildPromoCountdown(group.promo) ? (
                      <div className="voucher-popover__countdown">
                        {buildPromoCountdown(group.promo)}
                      </div>
                    ) : null}
                    <div className="voucher-popover__actions">
                      <button
                        className="voucher-popover__code"
                        type="button"
                        onClick={() => handleCopyCode(group.code)}
                      >
                        {group.code}
                      </button>
                      <button
                        className="voucher-popover__collect"
                        type="button"
                        onClick={() => handleCopyCode(group.code)}
                      >
                        {"Sao ch\u00E9p"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

            </div>
          )}
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
