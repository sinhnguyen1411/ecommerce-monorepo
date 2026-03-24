"use client";


import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

import {
  createOrderAccessToken,
  OrderPaymentQR,
  getOrderPaymentQR,
  getOrderSummary,
  updateOrderPaymentMethod,
  uploadPaymentProof
} from "@/lib/api";
import { getOrderStatusMeta, getPaymentStatusMeta } from "@/lib/admin-status";
import { formatCurrency } from "@/lib/format";

type LastOrder = {
  id: number;
  order_ref?: string;
  order_number: string;
  order_lookup_token?: string;
  order_access_token?: string;
  order_access_expires_at?: string;
  total: number;
  payment_method: string;
  payment_status?: string;
  status?: string;
  payment_proof_url?: string;
  customer_name?: string;
};

const paymentLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản/QR ngân hàng",
  bank_qr: "Chuyển khoản/QR ngân hàng"
};

function normalizePaymentMethod(method: string) {
  return method === "bank_qr" ? "bank_transfer" : method;
}

function isTokenExpired(expiresAt: string | undefined) {
  if (!expiresAt) {
    return true;
  }
  const expiresAtMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return true;
  }
  return expiresAtMs <= Date.now() + 10_000;
}

function ThankYouPageContent() {
  const searchParams = useSearchParams();
  const orderRefFromQuery = (searchParams.get("order_ref") || "").trim();
  const orderIdFromQuery = Number(searchParams.get("order_id") || 0);

  const [order, setOrder] = useState<LastOrder | null>(null);
  const [orderAccessToken, setOrderAccessToken] = useState("");
  const [orderAccessExpiresAt, setOrderAccessExpiresAt] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [qrInfo, setQrInfo] = useState<OrderPaymentQR | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem("ttc_last_order");
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as LastOrder;
      if (parsed?.id) {
        if (orderRefFromQuery && parsed.order_ref && parsed.order_ref !== orderRefFromQuery) {
          return;
        }
        setOrder(parsed);
        setOrderAccessToken(parsed.order_access_token || "");
        setOrderAccessExpiresAt(parsed.order_access_expires_at || "");
        setPaymentMethod(normalizePaymentMethod(parsed.payment_method || "bank_transfer"));
      }
    } catch {
      setOrder(null);
    }
  }, [orderRefFromQuery]);

  useEffect(() => {
    if (!order) {
      return;
    }
    window.localStorage.setItem(
      "ttc_last_order",
      JSON.stringify({
        ...order,
        order_ref: order.order_ref || order.order_number,
        order_access_token: orderAccessToken,
        order_access_expires_at: orderAccessExpiresAt
      })
    );
  }, [order, orderAccessToken, orderAccessExpiresAt]);

  useEffect(() => {
    if (!order?.id || !order.order_ref || !order.order_lookup_token) {
      return;
    }
    if (orderAccessToken && !isTokenExpired(orderAccessExpiresAt)) {
      return;
    }

    let cancelled = false;
    createOrderAccessToken(order.order_ref, order.order_lookup_token)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setOrderAccessToken(payload.order_access_token);
        setOrderAccessExpiresAt(payload.order_access_expires_at);
      })
      .catch(() => {
        if (!cancelled) {
          setOrderAccessToken("");
          setOrderAccessExpiresAt("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [order, orderAccessToken, orderAccessExpiresAt]);

  useEffect(() => {
    if (order || !orderIdFromQuery) {
      return;
    }

    setOrderLoading(true);
    getOrderSummary(
      orderIdFromQuery,
      orderAccessToken ? { orderAccessToken } : undefined
    )
      .then((data) => {
        setOrder({
          id: data.id,
          order_ref: data.order_number,
          order_number: data.order_number,
          total: data.total,
          payment_method: data.payment_method || "bank_transfer",
          payment_status: data.payment_status,
          status: data.status,
          payment_proof_url: data.payment_proof_url
        });
        setPaymentMethod(normalizePaymentMethod(data.payment_method || "bank_transfer"));
      })
      .catch(() => setOrder(null))
      .finally(() => setOrderLoading(false));
  }, [order, orderIdFromQuery, orderAccessToken]);

  useEffect(() => {
    if (!order || paymentMethod === "cod") {
      setQrInfo(null);
      setQrError("");
      return;
    }
    if (qrInfo && qrInfo.orderId === order.id) {
      return;
    }

    setQrLoading(true);
    getOrderPaymentQR(order.id, orderAccessToken ? { orderAccessToken } : undefined)
      .then((data) => {
        setQrInfo(data);
        setQrError("");
      })
      .catch((err) => {
        setQrInfo(null);
        setQrError(err instanceof Error ? err.message : "Không thể lấy mã QR.");
      })
      .finally(() => setQrLoading(false));
  }, [order, paymentMethod, qrInfo, orderAccessToken]);

  const handlePaymentMethodChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMethod = event.target.value;
    setPaymentError("");
    setQrError("");

    if (!order) {
      setPaymentMethod(nextMethod);
      return;
    }

    setPaymentUpdating(true);
    try {
      await updateOrderPaymentMethod(order.id, nextMethod, orderAccessToken ? { orderAccessToken } : undefined);
      setPaymentMethod(nextMethod);
      setOrder((prev) => (prev ? { ...prev, payment_method: nextMethod } : prev));
      if (nextMethod === "cod") {
        setQrInfo(null);
      } else {
        setQrLoading(true);
        const data = await getOrderPaymentQR(order.id, orderAccessToken ? { orderAccessToken } : undefined);
        setQrInfo(data);
      }
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Không thể đổi phương thức thanh toán.");
      setQrInfo(null);
    } finally {
      setPaymentUpdating(false);
      setQrLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !event.target.files?.[0]) {
      return;
    }

    setUploadStatus("Đang tải lên chứng từ...");
    try {
      const payload = await uploadPaymentProof(
        order.id,
        event.target.files[0],
        orderAccessToken ? { orderAccessToken } : undefined
      );
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_proof_url: payload.payment_proof_url,
              payment_status: "proof_submitted"
            }
          : prev
      );
      setUploadStatus("Đã gửi chứng từ thanh toán thành công.");
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : "Tải lên thất bại.");
    } finally {
      event.target.value = "";
    }
  };

  const qrImage = qrInfo?.vietqr.qrImageUrl || qrInfo?.vietqr.qrDataURL || "";
  const orderMeta = getOrderStatusMeta(order?.status || "pending");
  const paymentMeta = getPaymentStatusMeta(order?.payment_status || "pending");

  return (
    <div className="checkout-wrapper">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="active">
                <strong>Hoàn tất đơn hàng</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <section className="section-shell pb-16 pt-6">
        <div className="checkout-heading">
          <h1>Cảm ơn bạn đã đặt hàng</h1>
          <p>Đơn hàng đã được ghi nhận. Bạn có thể theo dõi trạng thái và cập nhật chứng từ ngay tại đây.</p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="checkout-box">
            <h2>Thông tin đơn hàng</h2>
            {order ? (
              <div className="mt-4 space-y-2 text-sm text-ink/70">
                <p>Mã đơn: {order.order_number}</p>
                <p>Tổng thanh toán: {formatCurrency(order.total)}</p>
                <p>Phương thức: {paymentLabels[paymentMethod] || paymentMethod}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderMeta.toneClass}`}>
                    {orderMeta.label}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentMeta.toneClass}`}>
                    {paymentMeta.label}
                  </span>
                </div>
              </div>
            ) : orderLoading ? (
              <p className="mt-4 text-sm text-ink/70">Đang tải thông tin đơn hàng...</p>
            ) : (
              <p className="mt-4 text-sm text-ink/70">Không tìm thấy thông tin đơn hàng.</p>
            )}

            <div className="mt-5">
              <label className="text-sm font-semibold">Đổi phương thức thanh toán</label>
              <select
                className="field mt-2"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                disabled={paymentUpdating}
              >
                <option value="cod">Thanh toán khi nhận hàng</option>
                <option value="bank_transfer">Chuyển khoản/QR ngân hàng</option>
              </select>
              {paymentError ? <p className="mt-2 text-xs text-clay">{paymentError}</p> : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link href="/account/orders" className="font-semibold text-forest hover:underline">
                Xem đơn hàng trong tài khoản
              </Link>
              <Link href="/" className="font-semibold text-forest hover:underline">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          <div className="checkout-box">
            <h2>Thanh toán chuyển khoản</h2>
            {order && paymentMethod !== "cod" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-forest/10 bg-white p-4 text-sm text-ink/70">
                  <p>Ngân hàng: {qrInfo?.bank.bankName || "-"}</p>
                  <p>Số tài khoản: {qrInfo?.bank.accountNo || "-"}</p>
                  <p>Chủ tài khoản: {qrInfo?.bank.accountName || "-"}</p>
                  <p>Số tiền: {formatCurrency(order.total)}</p>
                  <p>Nội dung chuyển khoản: {qrInfo?.transferContent || "-"}</p>
                </div>

                {qrImage ? (
                  <Image
                    src={qrImage}
                    alt="VietQR"
                    width={512}
                    height={512}
                    className="h-80 w-80 max-w-full border border-forest/10 object-contain md:h-[28rem] md:w-[28rem]"
                    sizes="(max-width: 768px) 80vw, 512px"
                  />
                ) : (
                  <div className="rounded-xl border border-forest/10 bg-white p-6 text-sm text-ink/60">
                    {qrLoading ? "Đang tạo mã QR..." : "Chưa có mã QR"}
                  </div>
                )}

                {order.payment_proof_url ? (
                  <a
                    href={order.payment_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-semibold text-forest hover:underline"
                  >
                    Xem chứng từ đã gửi
                  </a>
                ) : null}

                {qrError ? <p className="text-xs text-clay">{qrError}</p> : null}

                <div>
                  <label className="text-sm font-semibold">Tải chứng từ thanh toán</label>
                  <input type="file" className="field mt-2" onChange={handleUpload} accept="image/*" />
                  {uploadStatus ? <p className="mt-2 text-xs text-ink/60">{uploadStatus}</p> : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/70">
                Bạn đã chọn thanh toán khi nhận hàng. Hệ thống sẽ cập nhật trạng thái sau khi giao thành công.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="section-shell pb-16 pt-6 text-sm text-ink/70">Loading...</div>}>
      <ThankYouPageContent />
    </Suspense>
  );
}

