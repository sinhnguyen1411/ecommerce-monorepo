const locale = process.env.NEXT_PUBLIC_LOCALE || "vi-VN";
const currency = process.env.NEXT_PUBLIC_CURRENCY || "VND";
const mojibakeRegex = /[ÃÄ\uFFFD]/;

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

export function fixMojibake(value?: string | null): string {
  if (!value) {
    return "";
  }

  if (!mojibakeRegex.test(value)) {
    return value;
  }

  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(value, "latin1").toString("utf8");
    }
  } catch {
    // Fall through to TextDecoder or original value.
  }

  try {
    if (typeof TextDecoder !== "undefined") {
      const bytes = Uint8Array.from([...value], (char) => char.charCodeAt(0) & 0xff);
      return new TextDecoder("utf-8").decode(bytes);
    }
  } catch {
    // Ignore and return original value.
  }

  return value;
}
