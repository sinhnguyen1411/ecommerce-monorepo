const locale = process.env.NEXT_PUBLIC_LOCALE || "en-US";
const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";

export function formatPrice(value?: number | null) {
  if (typeof value !== "number") {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
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

