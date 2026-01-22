"use client";

import { AlertTriangle, CheckCircle2, ChevronRight, UploadCloud } from "lucide-react";

import { AdminSectionHeader } from "@/components/admin/AdminHelpers";
import { formatCurrency } from "@/lib/format";
import type {
  AdminCategory,
  AdminOrder,
  AdminPost,
  AdminProduct,
  AdminQnA,
  PaymentSettings
} from "@/lib/admin";
import type { ContactSettings, HomeBanner } from "@/lib/content";

export default function AdminOverview({
  products,
  categories,
  posts,
  qna,
  orders,
  settings,
  pendingOrders,
  pendingPayments,
  totalRevenue,
  banners,
  contactSettings,
  uploadUrl,
  onUpload,
  onNavigate
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
  posts: AdminPost[];
  qna: AdminQnA[];
  orders: AdminOrder[];
  settings: PaymentSettings | null;
  pendingOrders: number;
  pendingPayments: number;
  totalRevenue: number;
  banners: HomeBanner[];
  contactSettings: ContactSettings;
  uploadUrl: string;
  onUpload: (file: File | null) => void;
  onNavigate: (id: string) => void;
}) {
  const activeBanners = banners.filter((banner) => banner.isActive !== false).length;

  const metrics = [
    { label: "Sản phẩm", value: products.length, helper: "đang quản lý" },
    { label: "Danh mục", value: categories.length, helper: "đang hiển thị" },
    { label: "Đơn hàng", value: orders.length, helper: "tổng đơn" },
    {
      label: "Doanh thu đã thanh toán",
      value: formatCurrency(totalRevenue),
      helper: "ước tính"
    }
  ];

  const notices: { tone: "warning" | "success"; title: string; detail: string }[] = [];
  if (pendingOrders > 0) {
    notices.push({
      tone: "warning",
      title: "Đơn hàng cần xác nhận",
      detail: `Có ${pendingOrders} đơn hàng đang chờ xử lý.`
    });
  }
  if (pendingPayments > 0) {
    notices.push({
      tone: "warning",
      title: "Thanh toán cần duyệt",
      detail: `Có ${pendingPayments} giao dịch chờ đối soát.`
    });
  }
  if (!settings) {
    notices.push({
      tone: "warning",
      title: "Chưa cấu hình thanh toán",
      detail: "Thiết lập phương thức thanh toán để tránh gián đoạn đơn hàng."
    });
  }
  if (activeBanners === 0) {
    notices.push({
      tone: "warning",
      title: "Banner trang chủ trống",
      detail: "Bổ sung banner để tăng hiệu quả truyền thông."
    });
  }
  if (!contactSettings.phone || !contactSettings.address) {
    notices.push({
      tone: "warning",
      title: "Thiếu thông tin liên hệ",
      detail: "Kiểm tra lại số điện thoại và địa chỉ cửa hàng."
    });
  }
  if (notices.length === 0) {
    notices.push({
      tone: "success",
      title: "Hệ thống ổn định",
      detail: "Không có cảnh báo quan trọng trong hôm nay."
    });
  }

  const quickActions = [
    { id: "products", label: "Thêm sản phẩm", helper: "Tạo sản phẩm mới" },
    { id: "posts", label: "Tạo bài viết", helper: "Cập nhật tin tức" },
    { id: "orders", label: "Xử lý đơn hàng", helper: "Xem danh sách mới" },
    { id: "banners", label: "Cập nhật banner", helper: "Quản lý slider" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-xs">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-1 text-base text-slate-500 md:text-xs">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <AdminSectionHeader
            title="Hành động nhanh"
            description="Chuyển nhanh tới các khu vực thao tác thường xuyên."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[var(--color-primary)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 cursor-pointer"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900 md:text-sm">{action.label}</p>
                  <p className="text-base text-slate-500 md:text-xs">{action.helper}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-primary)]" />
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <AdminSectionHeader
            title="Tải lên nhanh"
            description="Tải lên hình ảnh và sao chép URL để dùng trong form."
          />
          <div className="mt-4 grid gap-3">
            <label className="flex items-center gap-2 text-base font-semibold text-slate-700 md:text-sm cursor-pointer">
              <UploadCloud className="h-4 w-4 text-[var(--color-primary)]" />
              <input
                type="file"
                onChange={(event) => onUpload(event.target.files?.[0] || null)}
                className="text-base text-slate-500 md:text-xs cursor-pointer"
              />
            </label>
            {uploadUrl ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-600 md:text-xs">
                URL: {uploadUrl}
              </div>
            ) : (
              <p className="text-base text-slate-500 md:text-xs">Chưa có tệp tải lên.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <AdminSectionHeader
          title="Thông báo hệ thống"
          description="Theo dõi các cảnh báo cần xử lý ngay."
        />
        <div className="mt-4 grid gap-3">
          {notices.map((notice) => (
            <div
              key={notice.title}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-base md:text-sm ${
                notice.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {notice.tone === "warning" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
              )}
              <div>
                <p className="font-semibold">{notice.title}</p>
                <p className="text-base md:text-xs">{notice.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
