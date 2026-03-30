"use client";

import Image from "next/image";

import { formatCurrency } from "@/lib/format";
import { CartItem, useCartStore } from "@/store/cart";

export default function CartLineItem({ item }: { item: CartItem }) {
  const incQty = useCartStore((state) => state.incQty);
  const decQty = useCartStore((state) => state.decQty);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <article className="media-line-item line-item">
      <div className="media-left line-item-visual">
        <div className="item-img">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={120}
              height={120}
              className="h-full w-full object-cover"
              sizes="120px"
            />
          ) : (
            <Image
              src="https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg"
              alt="No image"
              width={120}
              height={120}
              className="h-full w-full object-cover"
              sizes="120px"
            />
          )}
        </div>
      </div>

      <div className="media-right line-item-body">
        <div className="item-info line-item-copy">
          <p className="line-item-label">Sản phẩm</p>
          <h3 className="item--title">{item.name}</h3>
          <div className="item-price">
            <span className="line-item-price-label">Đơn giá</span>
            <span>{formatCurrency(item.price)}</span>
          </div>
        </div>

        <div className="media-total line-item-actions">
          <div className="item-total-price">
            <span className="line-item-price-label">Thành tiền</span>
            <div className="price">
              <span className="line-item-total">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </div>

          <div className="item-qty">
            <div className="qty quantity-partent qty-click clearfix">
              <button type="button" className="qtyminus qty-btn" onClick={() => decQty(item.id)}>
                -
              </button>
              <input
                type="text"
                readOnly
                className="tc line-item-qty item-quantity"
                value={item.quantity}
              />
              <button type="button" className="qtyplus qty-btn" onClick={() => incQty(item.id)}>
                +
              </button>
            </div>
          </div>

          <div className="item-remove">
            <button
              type="button"
              className="cart line-item-remove-button"
              onClick={() => removeItem(item.id)}
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
