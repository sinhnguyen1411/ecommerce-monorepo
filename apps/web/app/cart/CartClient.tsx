"use client";

import Link from "next/link";
import Image from "next/image";

import CartCheckoutSection from "@/components/cart/CartCheckoutSection";
import CartLineItem from "@/components/cart/CartLineItem";
import { useCheckoutConfig } from "@/components/cart/CheckoutConfigProvider";
import ProductGrid from "@/components/product/ProductGrid";
import { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { getCartCount, getCartSubtotal, useCartStore } from "@/store/cart";

type CartClientProps = {
  suggestedProducts: Product[];
};

export default function CartClient({ suggestedProducts }: CartClientProps) {
  const items = useCartStore((state) => state.items);
  const checkoutConfig = useCheckoutConfig();

  const subtotal = getCartSubtotal(items);
  const itemCount = getCartCount(items);
  const freeThreshold = checkoutConfig.free_shipping_threshold;
  const progress = freeThreshold > 0 ? Math.min(subtotal / freeThreshold, 1) : 0;
  const freeShippingRemaining = Math.max(freeThreshold - subtotal, 0);
  const freeShippingEligible = freeThreshold > 0 && subtotal >= freeThreshold;

  return (
    <div className="wrapper-mainCart">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="active">
                <span>
                  <strong>Giỏ hàng ({itemCount})</strong>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="content-bodyCart pb-16">
        <div className="container">
          <div className="cart-layout cart-layout--stacked">
            <div className="contentCart-detail">
              <div className="mainCart-detail">
                <div className="heading-cart heading-row">
                  <h1>Giỏ hàng của bạn</h1>
                  <p className="title-number-cart">
                    Bạn đang có <strong className="count-cart">{itemCount} sản phẩm</strong> trong
                    giỏ hàng
                  </p>
                  {freeThreshold > 0 ? (
                    <div className="cart-shipping">
                      <div className="cart-shipping__title">
                        {freeShippingEligible ? (
                          <>
                            Bạn đã đủ điều kiện{" "}
                            <span className="free-ship">miễn phí vận chuyển</span>
                          </>
                        ) : (
                          <>
                            Bạn cần mua thêm{" "}
                            <span className="price">{formatCurrency(freeShippingRemaining)}</span> để
                            được <span className="free-ship">miễn phí vận chuyển</span>
                          </>
                        )}
                      </div>
                      <div className="cart-shipping__bar">
                        <span className="shipping-bar" style={{ width: `${progress * 100}%` }}>
                          <span className="icon" aria-hidden="true">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="1" y="3" width="15" height="13" />
                              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                              <circle cx="5.5" cy="18.5" r="2.5" />
                              <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                          </span>
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="list-pageform-cart">
                  <div className="cart-row">
                    <div className="table-cart">
                      {items.length === 0 ? (
                        <div className="cart-empty">
                          <Image
                            src="https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg"
                            alt="empty"
                            width={640}
                            height={360}
                            className="h-auto w-full"
                            sizes="(max-width: 768px) 80vw, 420px"
                          />
                          <p>Giỏ hàng đang trống.</p>
                          <Link className="button" href="/collections/all">
                            Mua sản phẩm
                          </Link>
                        </div>
                      ) : (
                        items.map((item) => <CartLineItem key={item.id} item={item} />)
                      )}
                    </div>
                  </div>
                </div>

                {items.length > 0 ? <CartCheckoutSection /> : null}

                <div className="cart-collection mt-8">
                  <div className="collectionCart-detail">
                    <h3>Sản phẩm liên quan</h3>
                    <ProductGrid products={suggestedProducts.slice(0, 3)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
