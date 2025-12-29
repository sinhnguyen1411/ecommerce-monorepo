const locale = process.env.NEXT_PUBLIC_LOCALE || "vi-VN";
const currency = process.env.NEXT_PUBLIC_CURRENCY || "VND";

export function formatCurrency(value?: number | null) {
  if (typeof value !== "number") {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

export function stripHtml(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.replace(/<[^>]*>/g, "").trim();
}
