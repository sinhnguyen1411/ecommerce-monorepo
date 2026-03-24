export type StatusMeta = {
  label: string;
  toneClass: string;
  selectToneClass: string;
  ariaLabel: string;
};

export type OrderStatusCode =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled"
  | "failed_delivery"
  | "returned";

export type PaymentStatusCode =
  | "pending"
  | "proof_submitted"
  | "paid"
  | "rejected"
  | "refunded"
  | "partial_refund";

const ORDER_STATUS_META: Record<OrderStatusCode, StatusMeta> = {
  pending: {
    label: "Chờ xử lý",
    toneClass: "bg-amber-100 text-amber-800",
    selectToneClass: "border-amber-300 bg-amber-50 text-amber-800",
    ariaLabel: "Trạng thái đơn hàng chờ xử lý"
  },
  confirmed: {
    label: "Đã xác nhận",
    toneClass: "bg-blue-100 text-blue-800",
    selectToneClass: "border-blue-300 bg-blue-50 text-blue-800",
    ariaLabel: "Trạng thái đơn hàng đã xác nhận"
  },
  packed: {
    label: "Đã đóng gói",
    toneClass: "bg-indigo-100 text-indigo-800",
    selectToneClass: "border-indigo-300 bg-indigo-50 text-indigo-800",
    ariaLabel: "Trạng thái đơn hàng đã đóng gói"
  },
  shipping: {
    label: "Đang vận chuyển",
    toneClass: "bg-sky-100 text-sky-800",
    selectToneClass: "border-sky-300 bg-sky-50 text-sky-800",
    ariaLabel: "Trạng thái đơn hàng đang vận chuyển"
  },
  delivered: {
    label: "Đã giao",
    toneClass: "bg-emerald-100 text-emerald-800",
    selectToneClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    ariaLabel: "Trạng thái đơn hàng đã giao"
  },
  completed: {
    label: "Hoàn tất",
    toneClass: "bg-teal-100 text-teal-800",
    selectToneClass: "border-teal-300 bg-teal-50 text-teal-800",
    ariaLabel: "Trạng thái đơn hàng hoàn tất"
  },
  cancelled: {
    label: "Đã hủy",
    toneClass: "bg-rose-100 text-rose-800",
    selectToneClass: "border-rose-300 bg-rose-50 text-rose-800",
    ariaLabel: "Trạng thái đơn hàng đã hủy"
  },
  failed_delivery: {
    label: "Giao thất bại",
    toneClass: "bg-orange-100 text-orange-800",
    selectToneClass: "border-orange-300 bg-orange-50 text-orange-800",
    ariaLabel: "Trạng thái đơn hàng giao thất bại"
  },
  returned: {
    label: "Đã hoàn trả",
    toneClass: "bg-fuchsia-100 text-fuchsia-800",
    selectToneClass: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800",
    ariaLabel: "Trạng thái đơn hàng đã hoàn trả"
  }
};

const PAYMENT_STATUS_META: Record<PaymentStatusCode, StatusMeta> = {
  pending: {
    label: "Chờ thanh toán",
    toneClass: "bg-amber-100 text-amber-800",
    selectToneClass: "border-amber-300 bg-amber-50 text-amber-800",
    ariaLabel: "Trạng thái thanh toán chờ xử lý"
  },
  proof_submitted: {
    label: "Đã gửi chứng từ",
    toneClass: "bg-blue-100 text-blue-800",
    selectToneClass: "border-blue-300 bg-blue-50 text-blue-800",
    ariaLabel: "Trạng thái thanh toán đã gửi chứng từ"
  },
  paid: {
    label: "Đã thanh toán",
    toneClass: "bg-emerald-100 text-emerald-800",
    selectToneClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    ariaLabel: "Trạng thái thanh toán đã thanh toán"
  },
  rejected: {
    label: "Bị từ chối",
    toneClass: "bg-rose-100 text-rose-800",
    selectToneClass: "border-rose-300 bg-rose-50 text-rose-800",
    ariaLabel: "Trạng thái thanh toán bị từ chối"
  },
  refunded: {
    label: "Đã hoàn tiền",
    toneClass: "bg-violet-100 text-violet-800",
    selectToneClass: "border-violet-300 bg-violet-50 text-violet-800",
    ariaLabel: "Trạng thái thanh toán đã hoàn tiền"
  },
  partial_refund: {
    label: "Hoàn tiền một phần",
    toneClass: "bg-purple-100 text-purple-800",
    selectToneClass: "border-purple-300 bg-purple-50 text-purple-800",
    ariaLabel: "Trạng thái thanh toán hoàn tiền một phần"
  }
};

const ORDER_STATUS_FALLBACK: StatusMeta = {
  label: "Không xác định",
  toneClass: "bg-slate-100 text-slate-700",
  selectToneClass: "border-slate-300 bg-slate-50 text-slate-700",
  ariaLabel: "Trạng thái đơn hàng không xác định"
};

const PAYMENT_STATUS_FALLBACK: StatusMeta = {
  label: "Không xác định",
  toneClass: "bg-slate-100 text-slate-700",
  selectToneClass: "border-slate-300 bg-slate-50 text-slate-700",
  ariaLabel: "Trạng thái thanh toán không xác định"
};

function normalizeStatus(value: string) {
  return (value || "").toLowerCase().trim();
}

export const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_META) as OrderStatusCode[];
export const PAYMENT_STATUS_OPTIONS = Object.keys(PAYMENT_STATUS_META) as PaymentStatusCode[];

export const ADMIN_ORDER_STATUS_OPTIONS = ORDER_STATUS_OPTIONS;
export const ADMIN_PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_OPTIONS;

export function getOrderStatusMeta(status: string): StatusMeta {
  return ORDER_STATUS_META[normalizeStatus(status) as OrderStatusCode] || ORDER_STATUS_FALLBACK;
}

export function getPaymentStatusMeta(status: string): StatusMeta {
  return PAYMENT_STATUS_META[normalizeStatus(status) as PaymentStatusCode] || PAYMENT_STATUS_FALLBACK;
}

export function getAdminOrderStatusMeta(status: string): StatusMeta {
  return getOrderStatusMeta(status);
}

export function getAdminPaymentStatusMeta(status: string): StatusMeta {
  return getPaymentStatusMeta(status);
}
