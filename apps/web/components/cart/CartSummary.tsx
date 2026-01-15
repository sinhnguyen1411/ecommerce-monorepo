"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { getCartSubtotal, useCartStore } from "@/store/cart";

const deliverySlots = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00"
];

export default function CartSummary() {
  const items = useCartStore((state) => state.items);
  const deliveryTime = useCartStore((state) => state.deliveryTime);
  const setDeliveryTime = useCartStore((state) => state.setDeliveryTime);
  const subtotal = getCartSubtotal(items);
  const minOrder = siteConfig.minOrderAmount;
  const meetsMinOrder = minOrder === 0 || subtotal >= minOrder;
  const [deliveryMode, setDeliveryMode] = useState("standard");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");

  useEffect(() => {
    if (deliveryMode === "scheduled") {
      const value = [deliveryDate, deliverySlot].filter(Boolean).join(" ");
      setDeliveryTime(value);
    } else {
      setDeliveryTime("Giao khi có hàng");
    }
  }, [deliveryMode, deliveryDate, deliverySlot, setDeliveryTime]);

  return (
    <>
      <div className="order-summary-block">
        <h2 className="summary-title">Thông tin đơn hàng</h2>
        <div className="summary-time">
          <div className="summary-time__row">
            <div className="boxtime-title">
              <p className="txt-title">Thời gian giao hàng</p>
              <p className="txt-time">
                <span>{deliveryMode === "scheduled" ? "Chọn thời gian" : "Giao khi có hàng"}</span>
              </p>
            </div>
            <div className="boxtime-radio">
              <label className="radio-item">
                <input
                  className="input-radio"
                  type="radio"
                  name="delivery-mode"
                  value="standard"
                  checked={deliveryMode === "standard"}
                  onChange={(event) => setDeliveryMode(event.target.value)}
                />
                Giao khi có hàng
              </label>
              <label className="radio-item">
                <input
                  className="input-radio"
                  type="radio"
                  name="delivery-mode"
                  value="scheduled"
                  checked={deliveryMode === "scheduled"}
                  onChange={(event) => setDeliveryMode(event.target.value)}
                />
                Chọn thời gian
              </label>
            </div>
          </div>
          {deliveryMode === "scheduled" ? (
            <div className="summary-time__row">
              <div className="boxtime-select">
                <div className="select-box">
                  <label>Ngày giao</label>
                  <input
                    className="form-control"
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                  />
                </div>
                <div className="select-box">
                  <label>Thời gian giao</label>
                  <select
                    className="form-control"
                    value={deliverySlot}
                    onChange={(event) => setDeliverySlot(event.target.value)}
                  >
                    <option value="">Chọn thời gian</option>
                    {deliverySlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}
          {deliveryTime ? <p className="summary-time__note">Lịch giao: {deliveryTime}</p> : null}
        </div>

        <div className="summary-total">
          <p>
            Tổng tiền: <span>{formatCurrency(subtotal)}</span>
          </p>
        </div>
        <div className="summary-action">
          <p>Phí vận chuyển sẽ được tính ở trang thanh toán.</p>
          <p>Bạn cũng có thể nhập mã giảm giá ở trang thanh toán.</p>
          {!meetsMinOrder ? (
            <div className="summary-alert">Giỏ hàng của bạn hiện chưa đạt mức tối thiểu để thanh toán.</div>
          ) : null}
        </div>
        <div className="summary-button">
          <Link
            href="/checkout"
            className={`checkout-btn btnred ${meetsMinOrder ? "" : "disabled"}`}
          >
            THANH TOÁN
          </Link>
        </div>
      </div>
      {minOrder > 0 ? (
        <div className="order-summary-block order-summary-notify">
          <div className="summary-warning">
            <p className="textmr">
              <strong>Chính sách mua hàng</strong>:
            </p>
            <p>
              Hiện chúng tôi chỉ áp dụng thanh toán với đơn hàng có giá trị tối thiểu{" "}
              <strong>{formatCurrency(minOrder)}</strong> trở lên.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
