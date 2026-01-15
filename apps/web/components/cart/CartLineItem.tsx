"use client";

import { formatCurrency } from "@/lib/format";
import { CartItem, useCartStore } from "@/store/cart";

export default function CartLineItem({ item }: { item: CartItem }) {
  const incQty = useCartStore((state) => state.incQty);
  const decQty = useCartStore((state) => state.decQty);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="media-line-item line-item">
      <div className="media-left">
        <div className="item-img">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} />
          ) : (
            <img src="/ttc/cart/no_image.jpg" alt="No image" />
          )}
        </div>
        <div className="item-remove">
          <button type="button" className="cart" onClick={() => removeItem(item.id)}>
            Xóa
          </button>
        </div>
      </div>
      <div className="media-right">
        <div className="item-info">
          <h3 className="item--title">{item.name}</h3>
        </div>
        <div className="item-price">
          <p>
            <span>{formatCurrency(item.price)}</span>
          </p>
        </div>
      </div>
      <div className="media-total">
        <div className="item-total-price">
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
      </div>
    </div>
  );
}
