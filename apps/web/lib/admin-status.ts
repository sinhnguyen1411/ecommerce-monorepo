export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

export type StatusMeta = {
  label: string;
  tone: StatusTone;
  toneClass: string;
  selectToneClass: string;
  selectItemToneClass: string;
  dotClass: string;
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

type StatusDescriptor = {
  label: string;
  tone: StatusTone;
  ariaLabel: string;
};

type StatusToneStyle = {
  toneClass: string;
  selectToneClass: string;
  selectItemToneClass: string;
  dotClass: string;
};

const STATUS_TONE_STYLES: Record<StatusTone, StatusToneStyle> = {
  success: {
    toneClass: "border border-green-200 bg-green-50 text-green-700",
    selectToneClass: "border-green-200 bg-green-50 text-green-700",
    selectItemToneClass:
      "text-green-700 data-[highlighted]:bg-green-50 data-[highlighted]:text-green-700",
    dotClass: "bg-green-500"
  },
  info: {
    toneClass: "border border-blue-200 bg-blue-50 text-blue-700",
    selectToneClass: "border-blue-200 bg-blue-50 text-blue-700",
    selectItemToneClass:
      "text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700",
    dotClass: "bg-blue-500"
  },
  warning: {
    toneClass: "border border-amber-200 bg-amber-50 text-amber-700",
    selectToneClass: "border-amber-200 bg-amber-50 text-amber-700",
    selectItemToneClass:
      "text-amber-700 data-[highlighted]:bg-amber-50 data-[highlighted]:text-amber-700",
    dotClass: "bg-amber-500"
  },
  danger: {
    toneClass: "border border-red-200 bg-red-50 text-red-700",
    selectToneClass: "border-red-200 bg-red-50 text-red-700",
    selectItemToneClass: "text-red-700 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700",
    dotClass: "bg-red-500"
  },
  neutral: {
    toneClass: "border border-slate-200 bg-slate-50 text-slate-700",
    selectToneClass: "border-slate-200 bg-slate-50 text-slate-700",
    selectItemToneClass:
      "text-slate-700 data-[highlighted]:bg-slate-50 data-[highlighted]:text-slate-700",
    dotClass: "bg-slate-400"
  }
};

const ORDER_STATUS_META: Record<OrderStatusCode, StatusDescriptor> = {
  pending: {
    label: "Chờ xử lý",
    tone: "warning",
    ariaLabel: "Trạng thái đơn hàng chờ xử lý"
  },
  confirmed: {
    label: "Đã xác nhận",
    tone: "info",
    ariaLabel: "Trạng thái đơn hàng đã xác nhận"
  },
  packed: {
    label: "Đã đóng gói",
    tone: "info",
    ariaLabel: "Trạng thái đơn hàng đã đóng gói"
  },
  shipping: {
    label: "Đang vận chuyển",
    tone: "info",
    ariaLabel: "Trạng thái đơn hàng đang vận chuyển"
  },
  delivered: {
    label: "Đã giao",
    tone: "success",
    ariaLabel: "Trạng thái đơn hàng đã giao"
  },
  completed: {
    label: "Hoàn tất",
    tone: "success",
    ariaLabel: "Trạng thái đơn hàng hoàn tất"
  },
  cancelled: {
    label: "Đã hủy",
    tone: "danger",
    ariaLabel: "Trạng thái đơn hàng đã hủy"
  },
  failed_delivery: {
    label: "Giao thất bại",
    tone: "danger",
    ariaLabel: "Trạng thái đơn hàng giao thất bại"
  },
  returned: {
    label: "Đã hoàn trả",
    tone: "danger",
    ariaLabel: "Trạng thái đơn hàng đã hoàn trả"
  }
};

const PAYMENT_STATUS_META: Record<PaymentStatusCode, StatusDescriptor> = {
  pending: {
    label: "Chờ thanh toán",
    tone: "warning",
    ariaLabel: "Trạng thái thanh toán chờ xử lý"
  },
  proof_submitted: {
    label: "Đã gửi chứng từ",
    tone: "warning",
    ariaLabel: "Trạng thái thanh toán đã gửi chứng từ"
  },
  paid: {
    label: "Đã thanh toán",
    tone: "success",
    ariaLabel: "Trạng thái thanh toán đã thanh toán"
  },
  rejected: {
    label: "Bị từ chối",
    tone: "danger",
    ariaLabel: "Trạng thái thanh toán bị từ chối"
  },
  refunded: {
    label: "Đã hoàn tiền",
    tone: "success",
    ariaLabel: "Trạng thái thanh toán đã hoàn tiền"
  },
  partial_refund: {
    label: "Hoàn tiền một phần",
    tone: "success",
    ariaLabel: "Trạng thái thanh toán hoàn tiền một phần"
  }
};

const ORDER_STATUS_FALLBACK: StatusDescriptor = {
  label: "Không xác định",
  tone: "neutral",
  ariaLabel: "Trạng thái đơn hàng không xác định"
};

const PAYMENT_STATUS_FALLBACK: StatusDescriptor = {
  label: "Không xác định",
  tone: "neutral",
  ariaLabel: "Trạng thái thanh toán không xác định"
};

function normalizeStatus(value: string) {
  return (value || "").toLowerCase().trim();
}

function toStatusMeta(descriptor: StatusDescriptor): StatusMeta {
  const toneStyle = STATUS_TONE_STYLES[descriptor.tone];
  return {
    label: descriptor.label,
    tone: descriptor.tone,
    toneClass: toneStyle.toneClass,
    selectToneClass: toneStyle.selectToneClass,
    selectItemToneClass: toneStyle.selectItemToneClass,
    dotClass: toneStyle.dotClass,
    ariaLabel: descriptor.ariaLabel
  };
}

function toMethodKey(value: string) {
  return normalizeStatus(value).replace(/[\s-]+/g, "_");
}

function toReadableLabel(value: string) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "-";
  }
  if (!/[_-]/.test(raw)) {
    return raw;
  }
  return raw
    .toLowerCase()
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => (part === "cod" ? "COD" : `${part[0]?.toUpperCase() || ""}${part.slice(1)}`))
    .join(" ");
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Chuyển khoản",
  cod: "COD"
};

const SHIPPING_METHOD_LABELS: Record<string, string> = {
  standard: "Tiêu chuẩn",
  express: "Giao nhanh"
};

export const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_META) as OrderStatusCode[];
export const PAYMENT_STATUS_OPTIONS = Object.keys(PAYMENT_STATUS_META) as PaymentStatusCode[];

export const ADMIN_ORDER_STATUS_OPTIONS = ORDER_STATUS_OPTIONS;
export const ADMIN_PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_OPTIONS;

export function getOrderStatusTone(status: string): StatusTone {
  return (ORDER_STATUS_META[normalizeStatus(status) as OrderStatusCode] || ORDER_STATUS_FALLBACK).tone;
}

export function getPaymentStatusTone(status: string): StatusTone {
  return (PAYMENT_STATUS_META[normalizeStatus(status) as PaymentStatusCode] || PAYMENT_STATUS_FALLBACK).tone;
}

export function getOrderStatusMeta(status: string): StatusMeta {
  const descriptor = ORDER_STATUS_META[normalizeStatus(status) as OrderStatusCode] || ORDER_STATUS_FALLBACK;
  return toStatusMeta(descriptor);
}

export function getPaymentStatusMeta(status: string): StatusMeta {
  const descriptor =
    PAYMENT_STATUS_META[normalizeStatus(status) as PaymentStatusCode] || PAYMENT_STATUS_FALLBACK;
  return toStatusMeta(descriptor);
}

export function getAdminOrderStatusMeta(status: string): StatusMeta {
  return getOrderStatusMeta(status);
}

export function getAdminPaymentStatusMeta(status: string): StatusMeta {
  return getPaymentStatusMeta(status);
}

export function formatPaymentMethodLabel(value: string) {
  const key = toMethodKey(value);
  if (!key) {
    return "-";
  }
  return PAYMENT_METHOD_LABELS[key] || toReadableLabel(value);
}

export function formatShippingMethodLabel(value: string) {
  const key = toMethodKey(value);
  if (!key) {
    return "-";
  }
  return SHIPPING_METHOD_LABELS[key] || toReadableLabel(value);
}
