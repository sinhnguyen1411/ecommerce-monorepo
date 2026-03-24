import { fixMojibake } from "@/lib/format";

const serverUrl =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";
const browserUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE_URL = typeof window === "undefined" ? serverUrl : browserUrl;

const trimmedBaseUrl = API_BASE_URL.replace(/\/$/, "");

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};

export type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

export type ProductImage = {
  id: number;
  url: string;
  sort_order: number;
};

export type ProductOption = {
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: number;
  title: string;
  price: number;
  compare_at_price?: number | null;
  available?: boolean;
  inventory_quantity?: number;
  sku?: string | null;
  options?: string[];
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  featured: boolean;
  images: ProductImage[];
  categories: ProductCategory[];
  vendor?: string | null;
  available?: boolean;
  inventory_quantity?: number | null;
  tags?: string[];
  options?: ProductOption[];
  variants?: ProductVariant[];
  updated_at?: string;
  created_at?: string;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  cover_image: string;
  published_at: string;
  tags?: string[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function sanitizeApiPayload<T>(input: T): T {
  if (typeof input === "string") {
    return fixMojibake(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeApiPayload(item)) as T;
  }

  if (!isPlainObject(input)) {
    return input;
  }

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const sanitizedValue = sanitizeApiPayload(value);
    next[key] = sanitizedValue;
    if (sanitizedValue !== value) {
      changed = true;
    }
  }

  return (changed ? next : input) as T;
}

export type PostPagination = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
};

export type PostPaginatedList = {
  items: Post[];
  pagination: PostPagination;
};

export type Page = {
  id: number;
  title: string;
  slug: string;
  content: string;
};

export type QnA = {
  id: number;
  question: string;
  answer: string;
};

export type Location = {
  id: number;
  name: string;
  province: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
};

export type OrderItemInput = {
  product_id: number;
  quantity: number;
};

export type OrderRequest = {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  address_line?: string;
  province?: string;
  district?: string;
  note?: string;
  delivery_time?: string;
  shipping_method?: string;
  payment_method: string;
  promo_code?: string;
  items: OrderItemInput[];
};

export type OrderResponse = {
  id: number;
  order_ref: string;
  order_number: string;
  order_lookup_token: string;
  order_access_token: string;
  order_access_expires_at: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  total: number;
  payment_method: string;
  status: string;
};

export type OrderAccessTokenResponse = {
  order_id: number;
  order_ref: string;
  order_access_token: string;
  order_access_expires_at: string;
};

export type OrderAccessContext = {
  orderAccessToken?: string;
};

export type OrderSummary = {
  id: number;
  order_number: string;
  total: number;
  payment_method: string;
  payment_status?: string;
  status?: string;
  payment_proof_url?: string;
};

export type PaymentSettings = {
  id: number;
  cod_enabled: boolean;
  bank_transfer_enabled: boolean;
  bank_qr_enabled: boolean;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  bank_qr_payload: string;
  bank_id: string;
  bank_qr_template: string;
};

export type GeoProvince = {
  code: number;
  name: string;
};

export type GeoDistrict = {
  code: number;
  name: string;
};

export type CheckoutConfig = {
  min_order_amount: number;
  free_shipping_threshold: number;
  shipping_fee_standard: number;
  shipping_fee_express: number;
};

export type PromoValidation = {
  promo_code: string;
  discount_total: number;
};

export type OrderPaymentQR = {
  orderId: number;
  orderNumber?: string;
  amount: number;
  currency: string;
  transferContent: string;
  bank: {
    bankId: string;
    bin?: string;
    accountNo?: string;
    accountName?: string;
    bankName?: string;
  };
  vietqr: {
    method: "quicklink" | "generate";
    template: string;
    qrImageUrl?: string;
    qrDataURL?: string;
    qrCode?: string;
  };
  paymentStatus: "PENDING" | "PAID" | "EXPIRED";
};

export type OrderPaymentMethodUpdate = {
  order_id: number;
  payment_method: string;
  transfer_content?: string;
};

export type Promotion = {
  code: string;
  description: string;
  discount_type: "amount" | "percent";
  discount_value: number;
  min_subtotal: number;
  max_discount?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

function buildUrl(path: string) {
  return `${trimmedBaseUrl}${path}`;
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  revalidate = 60
) {
  const noStore = options?.cache === "no-store";
  const response = await fetch(buildUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    next:
      options?.method && options.method !== "GET"
        ? undefined
        : noStore
          ? undefined
          : { revalidate }
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    const message = payload?.error?.message || "Request failed";
    throw new Error(message);
  }

  return sanitizeApiPayload(payload.data);
}

export function getCategories() {
  return apiRequest<Category[]>("/api/categories");
}

export function getProducts(params?: {
  category?: string;
  sort?: string;
  sort_by?: string;
  featured?: boolean;
  limit?: number;
  q?: string;
  vendor?: string;
  price_min?: number;
  price_max?: number;
  tags?: string[];
}) {
  const search = new URLSearchParams();
  if (params?.category) {
    search.set("category", params.category);
  }
  if (params?.sort_by) {
    search.set("sort_by", params.sort_by);
  } else if (params?.sort) {
    search.set("sort", params.sort);
  }
  if (typeof params?.featured === "boolean") {
    search.set("featured", String(params.featured));
  }
  if (params?.limit) {
    search.set("limit", String(params.limit));
  }
  if (params?.q) {
    search.set("q", params.q);
  }
  if (params?.vendor) {
    search.set("vendor", params.vendor);
  }
  if (typeof params?.price_min === "number") {
    search.set("price_min", String(params.price_min));
  }
  if (typeof params?.price_max === "number") {
    search.set("price_max", String(params.price_max));
  }
  if (params?.tags?.length) {
    search.set("tags", params.tags.join(","));
  }

  const suffix = search.toString();
  const path = suffix ? `/api/products?${suffix}` : "/api/products";
  return apiRequest<Product[]>(path, { cache: "no-store" });
}

export function getProduct(slug: string) {
  return apiRequest<Product>(`/api/products/${slug}`, { cache: "no-store" });
}

export function getPosts(params?: { tag?: string }) {
  const search = new URLSearchParams();
  if (params?.tag) {
    search.set("tag", params.tag);
  }
  const suffix = search.toString();
  const path = suffix ? `/api/posts?${suffix}` : "/api/posts";
  return apiRequest<Post[]>(path);
}

export function getPostsPage(params?: { tag?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.tag) {
    search.set("tag", params.tag);
  }
  if (typeof params?.page === "number" && Number.isFinite(params.page)) {
    search.set("page", String(params.page));
  }
  if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
    search.set("limit", String(params.limit));
  }
  const suffix = search.toString();
  const path = suffix ? `/api/posts?${suffix}` : "/api/posts";
  return apiRequest<PostPaginatedList>(path, { cache: "no-store" });
}

export function getPost(slug: string) {
  return apiRequest<Post>(`/api/posts/${slug}`);
}

export function getPage(slug: string) {
  return apiRequest<Page>(`/api/pages/${slug}`);
}

export function getQnA() {
  return apiRequest<QnA[]>("/api/qna");
}

export function getLocations() {
  return apiRequest<Location[]>("/api/locations");
}

export function getPaymentSettings() {
  return apiRequest<PaymentSettings>("/api/payment-settings", { cache: "no-store" });
}

export function getCheckoutConfig() {
  return apiRequest<CheckoutConfig>("/api/checkout/config", { cache: "no-store" });
}

export function getGeoProvinces() {
  return apiRequest<GeoProvince[]>("/api/geo/provinces", { cache: "no-store" });
}

export function getGeoDistricts(provinceCode: number) {
  return apiRequest<GeoDistrict[]>(`/api/geo/districts?province_code=${provinceCode}`, {
    cache: "no-store"
  });
}

export function validatePromoCode(input: { code: string; subtotal: number }) {
  return apiRequest<PromoValidation>("/api/promotions/validate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getPromotions() {
  return apiRequest<Promotion[]>("/api/promotions", { cache: "no-store" });
}

function orderAccessTokenFromContext(context?: OrderAccessContext): string | undefined {
  const token = context?.orderAccessToken?.trim();
  if (!token) {
    return undefined;
  }
  return token;
}

export async function createOrder(input: OrderRequest) {
  return apiRequest<OrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function createOrderAccessToken(orderRef: string, orderLookupToken: string) {
  return apiRequest<OrderAccessTokenResponse>("/api/orders/access-token", {
    method: "POST",
    body: JSON.stringify({
      order_ref: orderRef,
      order_lookup_token: orderLookupToken
    })
  });
}

export async function getOrderSummary(orderId: number, context?: OrderAccessContext) {
  const orderAccessToken = orderAccessTokenFromContext(context);
  return apiRequest<OrderSummary>(`/api/orders/${orderId}/summary`, {
    cache: "no-store",
    headers: orderAccessToken ? { Authorization: `Bearer ${orderAccessToken}` } : undefined
  });
}

export async function getOrderPaymentQR(orderId: number, context?: OrderAccessContext) {
  const orderAccessToken = orderAccessTokenFromContext(context);
  return apiRequest<OrderPaymentQR>(`/api/orders/${orderId}/payment/qr`, {
    cache: "no-store",
    headers: orderAccessToken ? { Authorization: `Bearer ${orderAccessToken}` } : undefined
  });
}

export async function updateOrderPaymentMethod(
  orderId: number,
  paymentMethod: string,
  context?: OrderAccessContext
) {
  const orderAccessToken = orderAccessTokenFromContext(context);
  return apiRequest<OrderPaymentMethodUpdate>(`/api/orders/${orderId}/payment-method`, {
    method: "PATCH",
    headers: orderAccessToken ? { Authorization: `Bearer ${orderAccessToken}` } : undefined,
    body: JSON.stringify({ payment_method: paymentMethod })
  });
}

export async function uploadPaymentProof(orderId: number, file: File, context?: OrderAccessContext) {
  const formData = new FormData();
  formData.append("file", file);

  const orderAccessToken = orderAccessTokenFromContext(context);
  const headers = new Headers();
  if (orderAccessToken) {
    headers.set("Authorization", `Bearer ${orderAccessToken}`);
  }

  const response = await fetch(buildUrl(`/api/orders/${orderId}/payment-proof`), {
    method: "POST",
    body: formData,
    credentials: "include",
    headers
  });

  const payload = (await response.json()) as ApiEnvelope<{
    payment_proof_url: string;
  }>;
  if (!response.ok || !payload.success) {
    const message = payload?.error?.message || "Upload failed";
    throw new Error(message);
  }

  return payload.data;
}

