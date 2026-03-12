"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionTitle from "@/components/common/SectionTitle";
import { getProfile, listOrders, OrderSummary } from "@/lib/account";
import { formatCurrency } from "@/lib/format";
import { buildCompleteProfileHref, buildLoginHref } from "@/lib/onboarding";

export default function OrdersPage() {
  const router = useRouter();
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
        const profile = await getProfile();
        authed = true;
        if (cancelled) {
          return;
        }
        if (profile.onboarding_required) {
          router.replace(buildCompleteProfileHref("/account/orders", "/account/orders"));
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
        setError(err instanceof Error ? err.message : "Không thể tải đơn hàng.");
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
  }, [router]);

  if (isAuthed === null) {
    return (
      <div className="section-shell pb-16 pt-14">
        <p className="text-sm text-ink/70">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="section-shell pb-16 pt-14">
        <SectionTitle
          eyebrow="Tài khoản"
          title="Đăng nhập để xem đơn hàng"
          description="Vui lòng đăng nhập để theo dõi lịch sử mua hàng."
        />
        <div className="mt-6">
          <Link
            className="btn-primary"
            href={buildLoginHref("/account/orders", "/account/orders")}
          >
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
            Chưa có đơn hàng nào.
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
                      <p>Trạng thái: {order.status}</p>
                      <p>Thanh toán: {order.payment_status}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-ink/70">
                    {items.length === 0 ? (
                      <p>Chưa có sản phẩm nào.</p>
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
