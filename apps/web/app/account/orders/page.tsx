"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SectionTitle from "@/components/common/SectionTitle";
import { getUserToken } from "@/lib/auth";
import { listOrders, OrderSummary } from "@/lib/account";
import { formatCurrency } from "@/lib/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getUserToken()) {
      return;
    }

    listOrders()
      .then((data) => setOrders(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  if (!getUserToken()) {
    return (
      <div className="section-shell pb-16 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Đăng nhập để xem đơn hàng"
          description="Vui lòng đăng nhập bằng Google."
        />
        <div className="mt-6">
          <Link className="btn-primary" href="/login">
            Đi đến trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Đơn hàng của tôi"
          description="Theo dõi trạng thái đơn hàng và thanh toán."
        />
      </section>

      <section className="section-shell pb-16">
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-ink/70">Đang tải...</p>
        ) : orders.length === 0 ? (
          <div className="border border-forest/10 bg-white p-6 text-sm text-ink/70">
            Chưa có đơn hàng.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-forest/10 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{order.order_number}</p>
                    <p className="mt-2 text-lg font-semibold">{formatCurrency(order.total)}</p>
                  </div>
                  <div className="text-sm text-ink/70">
                    <p>Trạng thái: {order.status}</p>
                    <p>Thanh toán: {order.payment_status}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-ink/70">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.product_id}`} className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <span>x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
