const locale = process.env.NEXT_PUBLIC_LOCALE || "vi-VN";
const currency = process.env.NEXT_PUBLIC_CURRENCY || "VND";

const mojibakeMarkers = [
  "\u00C3",
  "\u00C4",
  "\u00C5",
  "\u00C6",
  "\u00C2",
  "\u00E1\u00BB",
  "\u00E1\u00BA",
  "\u00C6\u00B0",
  "\u00C4\u2018",
  "\u00E2\u20AC",
  "\u00EF\u00BF\u00BD",
  "\uFFFD"
] as const;

const cp1252ReverseMap = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f]
]);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mojibakeRegex = new RegExp(`(?:${mojibakeMarkers.map(escapeRegExp).join("|")})`);
const mojibakeMarkerRegex = new RegExp(
  `(?:${mojibakeMarkers.map(escapeRegExp).join("|")})`,
  "g"
);
const suspiciousQuestionRegex = /\p{L}\?{1,2}\p{L}/u;
const replacementCharRegex = /(?:\uFFFD|\u00EF\u00BF\u00BD)/g;
const controlCharRegex = /[\u0000-\u001F\u007F]/g;

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

function decodeWithBufferLatin1(value: string): string {
  if (typeof Buffer === "undefined") {
    return value;
  }
  return Buffer.from(value, "latin1").toString("utf8");
}

function toSingleByteBytes(value: string, useCp1252: boolean): Uint8Array | null {
  const bytes: number[] = [];

  for (const char of value) {
    const codepoint = char.codePointAt(0);
    if (typeof codepoint !== "number") {
      return null;
    }

    if (codepoint <= 0xff) {
      bytes.push(codepoint);
      continue;
    }

    if (useCp1252) {
      const mapped = cp1252ReverseMap.get(codepoint);
      if (typeof mapped === "number") {
        bytes.push(mapped);
        continue;
      }
    }

    return null;
  }

  return Uint8Array.from(bytes);
}

function decodeFromSingleByte(value: string, useCp1252: boolean): string {
  const bytes = toSingleByteBytes(value, useCp1252);
  if (!bytes) {
    return value;
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("utf8");
  }

  if (typeof TextDecoder === "undefined") {
    return value;
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function decodeWithTextDecoder(value: string): string {
  if (typeof TextDecoder === "undefined") {
    return value;
  }
  const bytes = Uint8Array.from([...value], (char) => char.charCodeAt(0) & 0xff);
  return new TextDecoder("utf-8").decode(bytes);
}

function scoreCandidate(value: string): number {
  const markerCount = (value.match(mojibakeMarkerRegex) || []).length;
  const replacementCount = (value.match(replacementCharRegex) || []).length;
  const controlCount = (value.match(controlCharRegex) || []).length;
  const suspiciousQuestionCount = suspiciousQuestionRegex.test(value) ? 1 : 0;

  return markerCount * 6 + replacementCount * 8 + controlCount * 10 + suspiciousQuestionCount * 4;
}

export function fixMojibake(value?: string | null): string {
  if (!value) {
    return "";
  }

  if (!mojibakeRegex.test(value) && !suspiciousQuestionRegex.test(value)) {
    return value;
  }

  let best = value;
  let bestScore = scoreCandidate(value);

  const tryCandidate = (candidate: string) => {
    if (!candidate || candidate === best) {
      return;
    }

    const candidateScore = scoreCandidate(candidate);
    if (candidateScore < bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  };

  try {
    const decoded = decodeFromSingleByte(value, true);
    tryCandidate(decoded);
    tryCandidate(decodeFromSingleByte(decoded, true));
  } catch {
    // Best effort only.
  }

  try {
    const decoded = decodeFromSingleByte(value, false);
    tryCandidate(decoded);
    tryCandidate(decodeFromSingleByte(decoded, false));
  } catch {
    // Best effort only.
  }

  try {
    const decoded = decodeWithBufferLatin1(value);
    tryCandidate(decoded);
    tryCandidate(decodeWithBufferLatin1(decoded));
  } catch {
    // Best effort only.
  }

  try {
    const decoded = decodeWithTextDecoder(value);
    tryCandidate(decoded);
    tryCandidate(decodeWithTextDecoder(decoded));
  } catch {
    // Best effort only.
  }

  return best;
}
