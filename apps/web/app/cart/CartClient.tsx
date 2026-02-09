"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import CartLineItem from "@/components/cart/CartLineItem";
import CartSummary from "@/components/cart/CartSummary";
import ProductGrid from "@/components/product/ProductGrid";
import { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getCartCount, getCartSubtotal, useCartStore } from "@/store/cart";

type CartClientProps = {
  suggestedProducts: Product[];
};

export default function CartClient({ suggestedProducts }: CartClientProps) {
  const items = useCartStore((state) => state.items);
  const note = useCartStore((state) => state.note);
  const setNote = useCartStore((state) => state.setNote);

  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");

  const subtotal = getCartSubtotal(items);
  const itemCount = getCartCount(items);
  const freeThreshold = siteConfig.freeShippingThreshold;
  const progress = freeThreshold > 0 ? Math.min(subtotal / freeThreshold, 1) : 0;

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
          <div className="cart-layout">
          <div className="contentCart-detail">
            <div className="mainCart-detail">
              <div className="heading-cart heading-row">
                <h1>Giỏ hàng của bạn</h1>
                <p className="title-number-cart">
                  Bạn đang có <strong className="count-cart">{itemCount} sản phẩm</strong> trong giỏ hàng
                </p>
                {freeThreshold > 0 ? (
                  <div className="cart-shipping">
                    <div className="cart-shipping__title">
                      Bạn cần mua thêm{" "}
                      <span className="price">{formatCurrency(Math.max(freeThreshold - subtotal, 0))}</span>{" "}
                      để được <span className="free-ship">miễn phí vận chuyển</span>
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

                <div className="cart-row">
                  <div className="order-noted-block">
                    <div className="container-pd15">
                      <label htmlFor="note" className="note-label">
                        Ghi chú đơn hàng
                      </label>
                      <textarea
                        className="form-control"
                        id="note"
                        name="note"
                        rows={5}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="cart-row">
                  <div className="order-invoice-block">
                    <div className="checkbox">
                      <input
                        type="checkbox"
                        id="invoice"
                        checked={invoiceEnabled}
                        onChange={(event) => setInvoiceEnabled(event.target.checked)}
                      />
                      <label htmlFor="invoice" className="title">
                        Xuất hóa đơn doanh nghiệp
                      </label>
                    </div>
                    {invoiceEnabled ? (
                      <div className="bill-field">
                        <div className="form-group">
                          <input
                            className="form-control"
                            value={companyName}
                            onChange={(event) => setCompanyName(event.target.value)}
                            placeholder="Tên công ty"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            className="form-control"
                            value={taxCode}
                            onChange={(event) => setTaxCode(event.target.value)}
                            placeholder="Mã số thuế"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            className="form-control"
                            value={invoiceEmail}
                            onChange={(event) => setInvoiceEmail(event.target.value)}
                            placeholder="Email nhận hóa đơn"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            className="form-control"
                            value={invoiceAddress}
                            onChange={(event) => setInvoiceAddress(event.target.value)}
                            placeholder="Địa chỉ công ty"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="sidebarCart-sticky">
            <div className="wrap-order-summary">
              <CartSummary />
            </div>
            <div className="order-summary-block">
              <div className="cart-coupon">
                <div className="coupon-initial bgWhite">
                  <div className="title-coupon">
                    <h2>Khuyến mãi dành cho bạn</h2>
                  </div>
                  <div className="cart-coupon__empty">Đang cập nhật chương trình khuyến mãi.</div>
                </div>
              </div>
            </div>
            <div className="cart-collection">
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
  );
}
