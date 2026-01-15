"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getCartSubtotal, useCartStore } from "@/store/cart";

const paymentOptions = [
  { value: "cod", label: "Thanh toán khi nhận hàng" },
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
  { value: "bank_qr", label: "Thanh toán QR" }
];

const shippingOptions = [
  { value: "standard", label: "Giao tiêu chuẩn (24-48h)" },
  { value: "express", label: "Giao nhanh (2-4h)" }
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const note = useCartStore((state) => state.note);
  const deliveryTime = useCartStore((state) => state.deliveryTime);
  const clear = useCartStore((state) => state.clear);
  const setPromoCode = useCartStore((state) => state.setPromoCode);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getCartSubtotal(items);
  const minOrderAmount = siteConfig.minOrderAmount;
  const meetsMinOrder = minOrderAmount === 0 || subtotal >= minOrderAmount;

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const handleSubmit = async () => {
    setError("");

    if (!meetsMinOrder) {
      setError("Đơn hàng chưa đạt giá trị tối thiểu.");
      return;
    }

    if (!customerName || !email || !phone || !address) {
      setError("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    if (items.length === 0) {
      setError("Giỏ hàng đang trống.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createOrder({
        customer_name: customerName,
        email,
        phone,
        address,
        note: [
          note,
          invoiceEnabled
            ? `Hoa don: ${companyName} | ${taxCode} | ${invoiceEmail} | ${invoiceAddress}`
            : ""
        ]
          .filter(Boolean)
          .join(" - "),
        delivery_time: deliveryTime || shippingMethod,
        payment_method: paymentMethod,
        promo_code: promoCode,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });

      window.localStorage.setItem(
        "ttc_last_order",
        JSON.stringify({
          ...response,
          customer_name: customerName,
          email,
          phone,
          address,
          payment_method: paymentMethod
        })
      );
      clear();
      router.push("/checkout/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toán thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <a href="/" target="_self">
                  Trang chủ
                </a>
              </li>
              <li className="active">
                <strong>Thanh toán</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <section className="section-shell pb-16 pt-6">
        <div className="checkout-heading">
          <h1>Hoàn tất đơn hàng</h1>
          <p>Điền thông tin giao hàng và chọn phương thức thanh toán.</p>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            <div className="checkout-box">
              <h2>Thông tin giao hàng</h2>
              <div className="checkout-grid">
                <input
                  className="field"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Họ và tên"
                />
                <input
                  className="field"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                />
                <input
                  className="field"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Số điện thoại"
                />
                <input
                  className="field"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Địa chỉ giao hàng"
                />
              </div>
              <div className="checkout-checkbox">
                <input
                  id="invoice"
                  type="checkbox"
                  checked={invoiceEnabled}
                  onChange={(event) => setInvoiceEnabled(event.target.checked)}
                />
                <label htmlFor="invoice">Xuất hóa đơn doanh nghiệp</label>
              </div>
              {invoiceEnabled ? (
                <div className="checkout-grid">
                  <input
                    className="field"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Tên công ty"
                  />
                  <input
                    className="field"
                    value={taxCode}
                    onChange={(event) => setTaxCode(event.target.value)}
                    placeholder="Mã số thuế"
                  />
                  <input
                    className="field"
                    value={invoiceEmail}
                    onChange={(event) => setInvoiceEmail(event.target.value)}
                    placeholder="Email nhận hóa đơn"
                  />
                  <input
                    className="field"
                    value={invoiceAddress}
                    onChange={(event) => setInvoiceAddress(event.target.value)}
                    placeholder="Địa chỉ công ty"
                  />
                </div>
              ) : null}
            </div>

            <div className="checkout-box">
              <h2>Phương thức giao hàng</h2>
              <div className="checkout-options">
                {shippingOptions.map((option) => (
                  <label key={option.value} className="checkout-option">
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name="shipping"
                      value={option.value}
                      checked={shippingMethod === option.value}
                      onChange={(event) => setShippingMethod(event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="checkout-box">
              <h2>Phương thức thanh toán</h2>
              <div className="checkout-options">
                {paymentOptions.map((option) => (
                  <label key={option.value} className="checkout-option">
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="checkout-box">
              <h2>Khuyến mãi</h2>
              <div className="checkout-promo">
                <input
                  className="field"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="Nhập mã khuyến mãi"
                />
                <button className="button btnlight" type="button">
                  Áp dụng
                </button>
              </div>
            </div>
          </div>

          <aside className="checkout-sidebar">
            <div className="checkout-summary">
              <h3>Đơn hàng</h3>
              <div className="checkout-items">
                {items.length === 0 ? (
                  <p>Giỏ hàng đang trống.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="checkout-item">
                      <div>
                        <p className="item-name">{item.name}</p>
                        <p className="item-qty">Số lượng: {item.quantity}</p>
                      </div>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="checkout-totals">
                <div className="row">
                  <span>Số lượng sản phẩm</span>
                  <span>{totalItems}</span>
                </div>
                <div className="row">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="row">
                  <span>Phí vận chuyển</span>
                  <span>
                    {siteConfig.freeShippingThreshold > 0 &&
                    subtotal >= siteConfig.freeShippingThreshold
                      ? "Miễn phí"
                      : "Tính khi giao"}
                  </span>
                </div>
                <div className="row total">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
              {minOrderAmount > 0 ? (
                <p className="checkout-note">
                  Đơn hàng tối thiểu {formatCurrency(minOrderAmount)}
                </p>
              ) : null}
              {error ? <p className="checkout-error">{error}</p> : null}
              <Button
                className="checkout-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !meetsMinOrder}
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
