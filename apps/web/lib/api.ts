const serverUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  cover_image: string;
  published_at: string;
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
  note?: string;
  delivery_time?: string;
  payment_method: string;
  promo_code?: string;
  items: OrderItemInput[];
};

export type OrderResponse = {
  id: number;
  order_number: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  total: number;
  payment_method: string;
  status: string;
};

function buildUrl(path: string) {
  return `${trimmedBaseUrl}${path}`;
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  revalidate = 60
) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    next: options?.method && options.method !== "GET" ? undefined : { revalidate }
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    const message = payload?.error?.message || "Request failed";
    throw new Error(message);
  }

  return payload.data;
}

export function getCategories() {
  return apiRequest<Category[]>("/api/categories");
}

export function getProducts(params?: {
  category?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.category) {
    search.set("category", params.category);
  }
  if (params?.sort) {
    search.set("sort", params.sort);
  }
  if (typeof params?.featured === "boolean") {
    search.set("featured", String(params.featured));
  }
  if (params?.limit) {
    search.set("limit", String(params.limit));
  }

  const suffix = search.toString();
  const path = suffix ? `/api/products?${suffix}` : "/api/products";
  return apiRequest<Product[]>(path);
}

export function getProduct(slug: string) {
  return apiRequest<Product>(`/api/products/${slug}`);
}

export function getPosts() {
  return apiRequest<Post[]>("/api/posts");
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

export async function createOrder(input: OrderRequest) {
  return apiRequest<OrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function uploadPaymentProof(orderId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildUrl(`/api/orders/${orderId}/payment-proof`), {
    method: "POST",
    body: formData
  });

  const payload = (await response.json()) as ApiEnvelope<{ payment_proof_url: string }>;
  if (!response.ok || !payload.success) {
    const message = payload?.error?.message || "Upload failed";
    throw new Error(message);
  }

  return payload.data;
}
