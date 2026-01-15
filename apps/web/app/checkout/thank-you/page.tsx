"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { uploadPaymentProof } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";

type LastOrder = {
  id: number;
  order_number: string;
  total: number;
  payment_method: string;
  customer_name?: string;
};

export default function ThankYouPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const paymentLabels: Record<string, string> = {
    cod: "Thanh toán khi nhận hàng",
    bank_transfer: "Chuyển khoản ngân hàng",
    bank_qr: "Thanh toán QR"
  };

  useEffect(() => {
    const raw = window.localStorage.getItem("ttc_last_order");
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as LastOrder;
      setOrder(parsed);
      setPaymentMethod(parsed.payment_method || "bank_transfer");
    } catch {
      setOrder(null);
    }
  }, []);

  useEffect(() => {
    if (!order) {
      return;
    }

    const payload = `BANK|${siteConfig.bank.name}|${siteConfig.bank.account}|${order.total}|${order.order_number}`;
    QRCode.toDataURL(payload, { width: 240, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [order]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !event.target.files?.[0]) {
      return;
    }

    setUploadStatus("Đang tải lên...");

    try {
      await uploadPaymentProof(order.id, event.target.files[0]);
      setUploadStatus("Đã gửi chứng từ thanh toán.");
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : "Tải lên thất bại.");
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
                <strong>Hoàn tất đơn hàng</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <section className="section-shell pb-16 pt-6">
        <div className="checkout-heading">
          <h1>Cảm ơn bạn đã đặt hàng</h1>
          <p>Chúng tôi sẽ liên hệ để xác nhận và giao hàng theo lịch.</p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="checkout-box">
            <h2>Thông tin đơn hàng</h2>
            {order ? (
              <div className="mt-4 space-y-2 text-sm text-ink/70">
                <p>Mã đơn: {order.order_number}</p>
                <p>Tổng thanh toán: {formatCurrency(order.total)}</p>
                <p>Phương thức: {paymentLabels[paymentMethod] || paymentMethod}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/70">
                Không tìm thấy thông tin đơn hàng gần nhất.
              </p>
            )}
            <div className="mt-5">
              <label className="text-sm font-semibold">Đổi phương thức thanh toán</label>
              <select
                className="field mt-2"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="cod">Thanh toán khi nhận hàng</option>
                <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                <option value="bank_qr">Thanh toán QR</option>
              </select>
            </div>
          </div>

          <div className="checkout-box">
            <h2>Thanh toán ngân hàng</h2>
            {order && paymentMethod !== "cod" ? (
              <div className="mt-4 space-y-4">
                <div className="border border-forest/10 bg-white p-4 text-sm">
                  <p>Ngân hàng: {siteConfig.bank.name}</p>
                  <p>Số tài khoản: {siteConfig.bank.account}</p>
                  <p>Chủ tài khoản: {siteConfig.bank.holder}</p>
                  <p>Số tiền: {formatCurrency(order.total)}</p>
                </div>
                {qrUrl ? (
                  <img src={qrUrl} alt="QR" className="h-48 w-48 border border-forest/10" />
                ) : (
                  <div className="border border-forest/10 bg-white p-6 text-sm text-ink/60">
                    Đang tạo QR...
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold">Tải chứng từ thanh toán</label>
                  <input type="file" className="field mt-2" onChange={handleUpload} />
                  {uploadStatus ? (
                    <p className="mt-2 text-xs text-ink/60">{uploadStatus}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/70">
                Bạn chọn thanh toán khi nhận hàng. Chúng tôi sẽ liên hệ xác nhận.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <a href="/" className="button btnlight">
            Tiếp tục mua sắm
          </a>
        </div>
      </section>
    </div>
  );
}
