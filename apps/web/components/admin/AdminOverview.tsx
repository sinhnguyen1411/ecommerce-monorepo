"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  FileText,
  Home,
  Package,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminSectionHeader, selectClass } from "@/components/admin/AdminHelpers";
import { formatCurrency } from "@/lib/format";
import type {
  AdminCategory,
  AdminDashboard,
  AdminDashboardGrain,
  AdminDensityMode,
  AdminOrder,
  AdminPost,
  AdminProduct,
  AdminQnA,
  PaymentSettings,
} from "@/lib/admin";
import type { ContactSettings, HomeBanner } from "@/lib/content";

const compactNumberFormatter = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value || 0);
}

function formatDateTime(value: string) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyChartState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function getOrderStatusTone(status: string) {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "shipping":
    case "confirmed":
      return "bg-sky-100 text-sky-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getPaymentStatusTone(status: string) {
  switch ((status || "").toLowerCase()) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "proof_submitted":
      return "bg-blue-100 text-blue-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

type AdminOverviewProps = {
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
  dashboard: AdminDashboard | null;
  dashboardLoading: boolean;
  dashboardError: string;
  dashboardGrain: AdminDashboardGrain;
  density: AdminDensityMode;
  onDashboardGrainChange: (grain: AdminDashboardGrain) => void;
  onNavigate: (id: string) => void;
};

export default function AdminOverview(props: AdminOverviewProps) {
  const {
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
    dashboard,
    dashboardLoading,
    dashboardError,
    dashboardGrain,
    density,
    onDashboardGrainChange,
    onNavigate,
  } = props;

  const summary = dashboard?.summary;
  const activeBanners = banners.filter((banner) => banner.isActive !== false).length;
  const paidOrdersFromList = orders.filter((order) => (order.payment_status || "").toLowerCase() === "paid").length;
  const paidRevenue = summary?.paid_revenue ?? totalRevenue;
  const averageOrderValue = summary?.average_order_value ?? 0;
  const pageviews = summary?.pageviews ?? 0;
  const uniqueVisitors = summary?.unique_visitors ?? 0;
  const chartSeries = dashboard?.series ?? [];
  const hasOperationsSeries = chartSeries.some(
    (point) => point.orders > 0 || point.paid_revenue > 0
  );
  const hasTrafficSeries = chartSeries.some(
    (point) => point.pageviews > 0 || point.unique_visitors > 0
  );
  const chartHeight = density === "comfortable" ? 300 : 260;
  const cardPadding = density === "comfortable" ? "p-6" : "p-5";

  const rangeLabel =
    dashboardGrain === "month"
      ? "12 thang gan nhat"
      : dashboardGrain === "year"
      ? "5 nam gan nhat"
      : "30 ngay gan nhat";

  const metricCards = [
    {
      label: "Don cho xu ly",
      value: numberFormatter.format(pendingOrders),
      helper: pendingOrders > 0 ? "Can xu ly ngay trong ca lam viec" : "Khong co don tre",
      icon: ShoppingCart,
      tone: "amber",
    },
    {
      label: "Thanh toan cho duyet",
      value: numberFormatter.format(pendingPayments),
      helper: pendingPayments > 0 ? "Can doi soat chung tu" : "Khong co giao dich tre",
      icon: Wallet,
      tone: "sky",
    },
    {
      label: "Doanh thu da thanh toan",
      value: formatCurrency(paidRevenue),
      helper: `AOV ${formatCurrency(averageOrderValue)} / ${numberFormatter.format(
        paidOrdersFromList
      )} don paid`,
      icon: Users,
      tone: "emerald",
    },
    {
      label: "Luot xem website",
      value: formatCompactNumber(pageviews),
      helper: `${formatCompactNumber(uniqueVisitors)} khach duy nhat / ${rangeLabel}`,
      icon: Eye,
      tone: "teal",
    },
  ];

  const quickActions = [
    {
      id: "orders",
      label: "Xu ly don hang",
      helper: `${numberFormatter.format(pendingOrders)} don can phan hoi`,
      icon: ShoppingCart,
    },
    {
      id: "products",
      label: "Cap nhat san pham",
      helper: `${numberFormatter.format(products.length)} san pham / ${numberFormatter.format(
        categories.length
      )} danh muc`,
      icon: Package,
    },
    {
      id: "posts",
      label: "Noi dung ban hang",
      helper: `${numberFormatter.format(posts.length)} bai viet / ${numberFormatter.format(
        qna.length
      )} cau hoi`,
      icon: FileText,
    },
    {
      id: "home",
      label: "Toi uu trang chu",
      helper: `${numberFormatter.format(activeBanners)} banner dang bat`,
      icon: Home,
    },
  ];

  const notices: Array<{
    tone: "warning" | "success";
    title: string;
    detail: string;
    actionId?: string;
    actionLabel?: string;
  }> = [];

  if (pendingOrders > 0) {
    notices.push({
      tone: "warning",
      title: "Don hang can xac nhan",
      detail: `${numberFormatter.format(pendingOrders)} don dang o trang thai cho xu ly.`,
      actionId: "orders",
      actionLabel: "Mo don hang",
    });
  }
  if (pendingPayments > 0) {
    notices.push({
      tone: "warning",
      title: "Thanh toan can doi soat",
      detail: `${numberFormatter.format(pendingPayments)} giao dich can kiem tra chung tu.`,
      actionId: "payments",
      actionLabel: "Mo thanh toan",
    });
  }
  if (!settings) {
    notices.push({
      tone: "warning",
      title: "Chua cau hinh thanh toan",
      detail: "Kiem tra cau hinh thanh toan de tranh gian doan don hang.",
      actionId: "payments",
      actionLabel: "Cau hinh ngay",
    });
  }
  if (!contactSettings.phone || !contactSettings.address) {
    notices.push({
      tone: "warning",
      title: "Thong tin lien he chua day du",
      detail: "Cap nhat hotline va dia chi de khong mat lead.",
      actionId: "contact",
      actionLabel: "Cap nhat lien he",
    });
  }
  if (notices.length === 0) {
    notices.push({
      tone: "success",
      title: "Van hanh on dinh",
      detail: "Khong co muc uu tien can xu ly ngay.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {metricCards.map((item) => {
          const Icon = item.icon;
          const toneClass =
            item.tone === "amber"
              ? "from-amber-50 to-white text-amber-700 ring-amber-200"
              : item.tone === "sky"
              ? "from-sky-50 to-white text-sky-700 ring-sky-200"
              : item.tone === "teal"
              ? "from-teal-50 to-white text-teal-700 ring-teal-200"
              : "from-emerald-50 to-white text-emerald-700 ring-emerald-200";

          return (
            <div
              key={item.label}
              className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${toneClass} ${cardPadding} shadow-sm ring-1`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-current shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <section className={`rounded-3xl border border-slate-200 bg-white ${cardPadding} shadow-sm`}>
        <AdminSectionHeader
          title="Dashboard van hanh"
          description="Theo doi don hang, doanh thu paid va trang thai van hanh tren cung mot man hinh."
          actions={
            <select
              className={`${selectClass} min-w-[180px] bg-slate-50`}
              value={dashboardGrain}
              onChange={(event) =>
                onDashboardGrainChange(event.target.value as AdminDashboardGrain)
              }
              data-testid="admin-overview-grain"
              aria-label="Chon khoang thoi gian dashboard"
            >
              <option value="day">Theo ngay</option>
              <option value="month">Theo thang</option>
              <option value="year">Theo nam</option>
            </select>
          }
        />

        {dashboardError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {dashboardError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div
            className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
            data-testid="admin-overview-orders-chart"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Don hang + doanh thu paid
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  {numberFormatter.format(summary?.orders || 0)} don / {formatCurrency(paidRevenue)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{rangeLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Don hang</span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Doanh thu paid</span>
              </div>
            </div>

            <div className="mt-5" style={{ height: chartHeight }}>
              {dashboardLoading ? (
                <div className="grid h-full animate-pulse gap-3">
                  <div className="h-6 w-32 rounded-full bg-slate-200" />
                  <div className="flex-1 rounded-2xl bg-slate-200/80" />
                </div>
              ) : hasOperationsSeries ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartSeries}
                    margin={{ left: -12, right: 12, top: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe4ea" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => formatCompactNumber(Number(value))}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "paid_revenue"
                          ? formatCurrency(Number(value))
                          : numberFormatter.format(Number(value)),
                        name === "paid_revenue" ? "Doanh thu paid" : "Don hang",
                      ]}
                      contentStyle={{
                        borderRadius: 16,
                        borderColor: "#dbe4ea",
                        boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="paid_revenue"
                      fill="#4f8df6"
                      radius={[8, 8, 0, 0]}
                      barSize={20}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="orders"
                      stroke="#3f7a37"
                      strokeWidth={3}
                      dot={{ r: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0, fill: "#3f7a37" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState
                  title="Chua co du lieu van hanh"
                  description="Khi co don hang trong khoang da chon, bieu do se hien thi ngay tai day."
                />
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <section
              className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
              data-testid="admin-overview-order-status"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Trang thai don</h4>
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-3 space-y-2">
                {(dashboard?.order_status_totals || []).length > 0 ? (
                  dashboard?.order_status_totals.map((item) => (
                    <div key={`order-status-${item.status}`} className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {numberFormatter.format(item.count)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chua co du lieu trang thai don.</p>
                )}
              </div>
            </section>

            <section
              className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
              data-testid="admin-overview-payment-status"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Trang thai thanh toan</h4>
                <Wallet className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-3 space-y-2">
                {(dashboard?.payment_status_totals || []).length > 0 ? (
                  dashboard?.payment_status_totals.map((item) => (
                    <div key={`payment-status-${item.status}`} className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusTone(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {numberFormatter.format(item.count)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chua co du lieu thanh toan.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section
          className={`rounded-3xl border border-slate-200 bg-white ${cardPadding} shadow-sm`}
          data-testid="admin-overview-top-products"
        >
          <AdminSectionHeader
            title="Top san pham"
            description="Top 5 san pham theo so luong ban trong khoang da chon."
          />
          {(dashboard?.top_products || []).length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">San pham</th>
                    <th className="pb-3 pr-4 text-right">So luong</th>
                    <th className="pb-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.top_products.map((item, index) => (
                    <tr key={`top-product-${item.product_id}-${index}`} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4 text-slate-500">{index + 1}</td>
                      <td className="py-3 pr-4 font-medium text-slate-900">{item.product_name}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-slate-700">
                        {numberFormatter.format(item.quantity_sold)}
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">Chua co du lieu top san pham.</p>
          )}
        </section>

        <section
          className={`rounded-3xl border border-slate-200 bg-white ${cardPadding} shadow-sm`}
          data-testid="admin-overview-recent-orders"
        >
          <AdminSectionHeader
            title="Don gan day"
            description="6 don moi nhat de xu ly nhanh trong ca lam viec."
          />
          {(dashboard?.recent_orders || []).length > 0 ? (
            <div className="mt-5 space-y-3">
              {dashboard?.recent_orders.map((item) => (
                <div
                  key={`recent-order-${item.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.order_number}</p>
                      <p className="text-sm text-slate-500">{item.customer_name}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.total)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(item.status)}`}>
                      {item.status}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusTone(item.payment_status)}`}>
                      {item.payment_status}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">Chua co don hang gan day.</p>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={`rounded-3xl border border-slate-200 bg-white ${cardPadding} shadow-sm`}>
          <AdminSectionHeader
            title="Quick actions"
            description="Di chuyen nhanh toi cac khu vuc can xu ly."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onNavigate(action.id)}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-[var(--color-primary)] hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--color-primary)] shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{action.helper}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-[var(--color-primary)]" />
                </button>
              );
            })}
          </div>
        </section>

        <section
          className={`rounded-3xl border border-slate-200 bg-white ${cardPadding} shadow-sm`}
          data-testid="admin-overview-visits-chart"
        >
          <AdminSectionHeader
            title="Traffic (secondary)"
            description="Theo doi pageviews va unique visitors cho storefront."
          />
          <div className="mt-5" style={{ height: chartHeight }}>
            {dashboardLoading ? (
              <div className="grid h-full animate-pulse gap-3">
                <div className="h-6 w-40 rounded-full bg-slate-200" />
                <div className="flex-1 rounded-2xl bg-slate-200/80" />
              </div>
            ) : hasTrafficSeries ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSeries} margin={{ left: -12, right: 12, top: 8, bottom: 4 }} barGap={10}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe4ea" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      numberFormatter.format(Number(value)),
                      name === "pageviews" ? "Pageviews" : "Unique visitors",
                    ]}
                    contentStyle={{
                      borderRadius: 16,
                      borderColor: "#dbe4ea",
                      boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Bar dataKey="pageviews" fill="#2aa198" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="unique_visitors" fill="#8a9ab0" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                title="Chua co du lieu traffic"
                description="Du lieu se xuat hien sau khi storefront co pageview hop le."
              />
            )}
          </div>
        </section>
      </div>

      <section className={`rounded-3xl border border-slate-200 bg-white ${cardPadding} shadow-sm`}>
        <AdminSectionHeader
          title="Uu tien xu ly"
          description="Danh sach canh bao rut gon de ra quyet dinh nhanh."
        />
        <div className="mt-5 grid gap-3">
          {notices.map((notice) => {
            const isWarning = notice.tone === "warning";
            return (
              <div
                key={notice.title}
                className={`rounded-2xl border px-4 py-4 ${
                  isWarning ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl ${
                      isWarning ? "bg-white text-amber-600" : "bg-white text-emerald-600"
                    }`}
                  >
                    {isWarning ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{notice.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{notice.detail}</p>
                  </div>
                  {notice.actionId ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(notice.actionId as string)}
                      className="shrink-0 rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    >
                      {notice.actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
