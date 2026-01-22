"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import SectionTitle from "@/components/common/SectionTitle";
import { getProfile, listOrders, OrderSummary } from "@/lib/account";
import { formatCurrency } from "@/lib/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      let authed = false;
      try {
        await getProfile();
        authed = true;
        if (cancelled) {
          return;
        }
        setIsAuthed(true);
        const data = await listOrders();
        if (cancelled) {
          return;
        }
        setOrders(data);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (!authed) {
          setIsAuthed(false);
        } else {
          setIsAuthed(true);
        }
        setError(err instanceof Error ? err.message : "Kh?ng th? t?i ??n h?ng.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isAuthed === null) {
    return (
      <div className="section-shell pb-16 pt-14">
        <p className="text-sm text-ink/70">?ang t?i ??n h?ng...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="section-shell pb-16 pt-14">
        <SectionTitle
          eyebrow="T?i kho?n"
          title="??ng nh?p ?? xem ??n h?ng"
          description="Vui l?ng ??ng nh?p ?? theo d?i l?ch s? mua h?ng."
        />
        <div className="mt-6">
          <Link className="btn-primary" href="/login">
            ?i ??n trang ??ng nh?p
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="T?i kho?n"
          title="??n h?ng c?a t?i"
          description="Theo d?i tr?ng th?i ??n h?ng v? thanh to?n."
        />
      </section>

      <section className="section-shell pb-16">
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-ink/70">?ang t?i...</p>
        ) : orders.length === 0 ? (
          <div className="border border-forest/10 bg-white p-6 text-sm text-ink/70">
            Ch?a c? ??n h?ng n?o.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = order.items || [];
              return (
                <div key={order.id} className="border border-forest/10 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                        {order.order_number}
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div className="text-sm text-ink/70">
                      <p>Tr?ng th?i: {order.status}</p>
                      <p>Thanh to?n: {order.payment_status}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-ink/70">
                    {items.length === 0 ? (
                      <p>Ch?a c? s?n ph?m n?o.</p>
                    ) : (
                      items.map((item) => (
                        <div
                          key={`${order.id}-${item.product_id}`}
                          className="flex items-center justify-between"
                        >
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
