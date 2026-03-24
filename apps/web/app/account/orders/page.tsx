"use client";


import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, UploadCloud } from "lucide-react";

import AccountShell from "@/components/account/AccountShell";
import { Button } from "@/components/ui/button";
import {
  OrderSummary,
  getOrderDetail,
  getProfile,
  listOrders,
  updateOrderNote,
  uploadOrderPaymentProof
} from "@/lib/account";
import { getOrderStatusMeta, getPaymentStatusMeta } from "@/lib/admin-status";
import { formatCurrency } from "@/lib/format";
import { buildCompleteProfileHref, buildLoginHref } from "@/lib/onboarding";

function formatOrderTime(raw: string) {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw || "-";
  }
  return parsed.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [detailByOrderId, setDetailByOrderId] = useState<Record<number, OrderSummary>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [noteDraftByOrderId, setNoteDraftByOrderId] = useState<Record<number, string>>({});
  const [noteSavingByOrderId, setNoteSavingByOrderId] = useState<Record<number, boolean>>({});
  const [proofUploadingByOrderId, setProofUploadingByOrderId] = useState<Record<number, boolean>>({});
  const [detailErrorByOrderId, setDetailErrorByOrderId] = useState<Record<number, string>>({});
  const [handledDeepLinkOrderId, setHandledDeepLinkOrderId] = useState<number | null>(null);

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
        setIsAuthed(authed);
        setError(err instanceof Error ? err.message : "Không thể tải đơn hàng.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const orderById = useMemo(() => {
    const map = new Map<number, OrderSummary>();
    orders.forEach((order) => map.set(order.id, order));
    return map;
  }, [orders]);

  const deepLinkOrderId = useMemo(() => {
    const raw = searchParams.get("orderId");
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }, [searchParams]);

  const mergeOrderIntoState = (updated: OrderSummary) => {
    setOrders((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    setDetailByOrderId((prev) => ({ ...prev, [updated.id]: updated }));
    setNoteDraftByOrderId((prev) => ({ ...prev, [updated.id]: updated.note || "" }));
  };

  const ensureDetail = async (orderId: number) => {
    if (detailByOrderId[orderId]) {
      return;
    }
    setDetailLoadingId(orderId);
    setDetailErrorByOrderId((prev) => ({ ...prev, [orderId]: "" }));
    try {
      const detail = await getOrderDetail(orderId);
      mergeOrderIntoState(detail);
    } catch (err) {
      setDetailErrorByOrderId((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : "Không thể tải chi tiết đơn hàng."
      }));
    } finally {
      setDetailLoadingId((prev) => (prev === orderId ? null : prev));
    }
  };

  const handleToggleOrder = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    await ensureDetail(orderId);
  };

  const handleSaveNote = async (orderId: number) => {
    const detail = detailByOrderId[orderId] || orderById.get(orderId);
    if (!detail) {
      return;
    }
    if (detail.status !== "pending") {
      return;
    }

    const nextNote = (noteDraftByOrderId[orderId] || "").trim();
    setNoteSavingByOrderId((prev) => ({ ...prev, [orderId]: true }));
    setDetailErrorByOrderId((prev) => ({ ...prev, [orderId]: "" }));
    try {
      const updated = await updateOrderNote(orderId, nextNote);
      mergeOrderIntoState(updated);
    } catch (err) {
      setDetailErrorByOrderId((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : "Không thể cập nhật ghi chú."
      }));
    } finally {
      setNoteSavingByOrderId((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleProofUpload = async (orderId: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setProofUploadingByOrderId((prev) => ({ ...prev, [orderId]: true }));
    setDetailErrorByOrderId((prev) => ({ ...prev, [orderId]: "" }));
    try {
      const updated = await uploadOrderPaymentProof(orderId, file);
      mergeOrderIntoState(updated);
    } catch (err) {
      setDetailErrorByOrderId((prev) => ({
        ...prev,
        [orderId]: err instanceof Error ? err.message : "Không thể tải chứng từ thanh toán."
      }));
    } finally {
      event.target.value = "";
      setProofUploadingByOrderId((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  useEffect(() => {
    if (deepLinkOrderId === null) {
      setHandledDeepLinkOrderId(null);
      return;
    }
    if (handledDeepLinkOrderId === deepLinkOrderId) {
      return;
    }
    if (loading || orders.length === 0) {
      return;
    }

    setHandledDeepLinkOrderId(deepLinkOrderId);
    if (!orderById.has(deepLinkOrderId)) {
      return;
    }

    const openTargetOrder = async () => {
      setExpandedOrderId(deepLinkOrderId);
      await ensureDetail(deepLinkOrderId);
      window.setTimeout(() => {
        const row = document.querySelector<HTMLElement>(
          `[data-testid="account-order-row-${deepLinkOrderId}"]`
        );
        row?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    };

    void openTargetOrder();
  }, [deepLinkOrderId, handledDeepLinkOrderId, loading, orders.length, orderById, ensureDetail]);

  if (isAuthed === null) {
    return (
      <AccountShell
        title="Đơn hàng của tôi"
        description="Theo dõi trạng thái đơn hàng, thanh toán và chứng từ trên cùng một màn hình."
      >
        <p className="text-sm text-ink/70">Đang tải đơn hàng...</p>
      </AccountShell>
    );
  }

  if (!isAuthed) {
    return (
      <AccountShell
        title="Đăng nhập để xem đơn hàng"
        description="Vui lòng đăng nhập để theo dõi lịch sử mua hàng."
        showTabs={false}
      >
        <div className="mt-6">
          <Link className="btn-primary" href={buildLoginHref("/account/orders", "/account/orders")}>
            Đi đến trang đăng nhập
          </Link>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="Đơn hàng của tôi"
      description="Theo dõi trạng thái đơn hàng, thanh toán và chứng từ trên cùng một màn hình."
    >
      {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-ink/70">Đang tải dữ liệu...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-forest/10 bg-white p-6 text-sm text-ink/70">
          Bạn chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-forest/10 bg-white">
            <div className="hidden border-b border-forest/10 bg-forest/5 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink/60 md:grid md:grid-cols-[1.4fr_1fr_1.2fr_auto] md:gap-4">
              <span>Mã đơn / thời gian</span>
              <span>Tổng tiền</span>
              <span>Trạng thái</span>
              <span className="text-right">Chi tiết</span>
            </div>
            {orders.map((order) => {
              const detail = detailByOrderId[order.id] || order;
              const orderMeta = getOrderStatusMeta(detail.status);
              const paymentMeta = getPaymentStatusMeta(detail.payment_status);
              const isExpanded = expandedOrderId === order.id;
              const noteLocked = detail.status !== "pending";
              const detailError = detailErrorByOrderId[order.id];
              const noteDraft = noteDraftByOrderId[order.id] ?? detail.note ?? "";
              const savingNote = Boolean(noteSavingByOrderId[order.id]);
              const uploadingProof = Boolean(proofUploadingByOrderId[order.id]);

              return (
                <div key={order.id} className="border-b border-forest/10 last:border-b-0" data-testid={`account-order-row-${order.id}`}>
                  <div className="grid gap-3 px-4 py-4 md:grid-cols-[1.4fr_1fr_1.2fr_auto] md:items-center md:gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">{order.order_number}</p>
                      <p className="text-xs text-ink/60">{formatOrderTime(order.created_at)}</p>
                    </div>
                    <p className="text-base font-semibold text-ink">{formatCurrency(order.total)}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderMeta.toneClass}`} aria-label={orderMeta.ariaLabel}>
                        {orderMeta.label}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentMeta.toneClass}`} aria-label={paymentMeta.ariaLabel}>
                        {paymentMeta.label}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 w-11 p-0"
                        onClick={() => void handleToggleOrder(order.id)}
                        data-testid={`account-order-toggle-${order.id}`}
                        aria-label={isExpanded ? `Ẩn chi tiết đơn ${order.order_number}` : `Mở chi tiết đơn ${order.order_number}`}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-forest/10 bg-forest/5/40 px-4 py-4" data-testid={`account-order-detail-${order.id}`}>
                      {detailLoadingId === order.id ? (
                        <p className="text-sm text-ink/70">Đang tải chi tiết đơn hàng...</p>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-forest/10 bg-white p-3 text-sm">
                              <p className="font-semibold text-ink">Thông tin giao hàng</p>
                              <p className="mt-2 text-ink/80">{detail.customer_name || "-"}</p>
                              <p className="text-ink/70">{detail.phone || "-"}</p>
                              <p className="text-ink/70">{detail.email || "-"}</p>
                              <p className="mt-2 text-ink/70">{detail.address || "-"}</p>
                            </div>
                            <div className="rounded-xl border border-forest/10 bg-white p-3 text-sm">
                              <p className="font-semibold text-ink">Vận chuyển & thanh toán</p>
                              <p className="mt-2 text-ink/70">Giao hàng: {detail.shipping_method || "standard"}</p>
                              <p className="text-ink/70">Thời gian giao: {detail.delivery_time || "Theo tiêu chuẩn"}</p>
                              <p className="text-ink/70">Phương thức thanh toán: {detail.payment_method || "cod"}</p>
                              <p className="mt-2 text-ink/70">Cập nhật: {formatOrderTime(detail.updated_at || detail.created_at)}</p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-forest/10 bg-white p-3">
                            <p className="text-sm font-semibold text-ink">Sản phẩm trong đơn</p>
                            {detail.items?.length ? (
                              <div className="mt-2 space-y-2">
                                {detail.items.map((item) => (
                                  <div key={`${detail.id}-${item.product_id}`} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-ink/80">{item.name} x{item.quantity}</span>
                                    <span className="font-semibold text-ink">
                                      {formatCurrency(item.line_total || item.unit_price * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-ink/60">Không có dòng sản phẩm trong đơn hàng này.</p>
                            )}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-forest/10 bg-white p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-ink">Ghi chú đơn hàng</p>
                                {noteLocked ? (
                                  <span className="text-xs font-medium text-ink/60">Đã khóa chỉnh sửa</span>
                                ) : null}
                              </div>
                              <textarea
                                className="field mt-2 min-h-[120px] resize-y"
                                value={noteDraft}
                                onChange={(event) =>
                                  setNoteDraftByOrderId((prev) => ({ ...prev, [order.id]: event.target.value }))
                                }
                                readOnly={noteLocked}
                                data-testid={`account-order-note-${order.id}`}
                              />
                              {!noteLocked ? (
                                <div className="mt-2 flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={savingNote}
                                    onClick={() => void handleSaveNote(order.id)}
                                    data-testid={`account-order-note-save-${order.id}`}
                                  >
                                    {savingNote ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Đang lưu
                                      </span>
                                    ) : (
                                      "Lưu ghi chú"
                                    )}
                                  </Button>
                                </div>
                              ) : null}
                            </div>

                            <div className="rounded-xl border border-forest/10 bg-white p-3">
                              <p className="text-sm font-semibold text-ink">Chứng từ thanh toán</p>
                              {detail.payment_proof_url ? (
                                <a
                                  href={detail.payment_proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-block text-sm font-semibold text-forest hover:underline"
                                >
                                  Xem chứng từ hiện tại
                                </a>
                              ) : (
                                <p className="mt-2 text-sm text-ink/60">Bạn chưa gửi chứng từ thanh toán.</p>
                              )}
                              <label className="mt-3 flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-forest/30 px-3 py-2 text-sm font-medium text-forest hover:border-forest/60">
                                <UploadCloud className="h-4 w-4" />
                                {uploadingProof ? "Đang tải lên..." : "Tải lên / cập nhật chứng từ"}
                                <input
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(event) => void handleProofUpload(order.id, event)}
                                  disabled={uploadingProof}
                                  data-testid={`account-order-proof-upload-${order.id}`}
                                />
                              </label>
                            </div>
                          </div>

                          {detailError ? <p className="text-sm text-clay">{detailError}</p> : null}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      )}
    </AccountShell>
  );
}
export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="section-shell pb-16 pt-6 text-sm text-ink/70">Loading...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}

