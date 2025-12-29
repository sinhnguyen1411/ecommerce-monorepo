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
    cod: "Thanh toan khi nhan hang",
    bank_transfer: "Chuyen khoan ngan hang",
    bank_qr: "Thanh toan QR"
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

    setUploadStatus("Dang tai len...");

    try {
      await uploadPaymentProof(order.id, event.target.files[0]);
      setUploadStatus("Da gui chung tu thanh toan.");
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : "Tai len that bai.");
    }
  };

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <div>
          <p className="pill">Hoan tat</p>
          <h1 className="mt-4 text-4xl font-semibold">Cam on ban da dat hang</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/70">
            Chung toi se lien he de xac nhan va giao hang theo lich.
          </p>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold">Thong tin don hang</h2>
            {order ? (
              <div className="mt-4 space-y-2 text-sm text-ink/70">
                <p>Ma don: {order.order_number}</p>
                <p>Tong thanh toan: {formatCurrency(order.total)}</p>
                <p>Phuong thuc: {paymentLabels[paymentMethod] || paymentMethod}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/70">
                Khong tim thay thong tin don hang gan nhat.
              </p>
            )}
            <div className="mt-5">
              <label className="text-sm font-semibold">Doi phuong thuc thanh toan</label>
              <select
                className="field mt-2"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="cod">Thanh toan khi nhan hang</option>
                <option value="bank_transfer">Chuyen khoan ngan hang</option>
                <option value="bank_qr">Thanh toan QR</option>
              </select>
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold">Thanh toan ngan hang</h2>
            {order && paymentMethod !== "cod" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-forest/10 bg-white/90 p-4 text-sm">
                  <p>Ngan hang: {siteConfig.bank.name}</p>
                  <p>So tai khoan: {siteConfig.bank.account}</p>
                  <p>Chu tai khoan: {siteConfig.bank.holder}</p>
                  <p>So tien: {formatCurrency(order.total)}</p>
                </div>
                {qrUrl ? (
                  <img src={qrUrl} alt="QR" className="h-48 w-48 rounded-2xl" />
                ) : (
                  <div className="rounded-2xl bg-mist p-6 text-sm text-ink/60">
                    Dang tao QR...
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold">Tai chung tu thanh toan</label>
                  <input type="file" className="field mt-2" onChange={handleUpload} />
                  {uploadStatus ? (
                    <p className="mt-2 text-xs text-ink/60">{uploadStatus}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/70">
                Ban chon thanh toan khi nhan hang. Chung toi se lien he xac nhan.
              </p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <a className="btn-ghost" href="/">
            Tiep tuc mua sam
          </a>
        </div>
      </section>
    </div>
  );
}
