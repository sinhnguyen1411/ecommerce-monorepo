import { getAdminToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function buildUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function adminRequest<T>(path: string, options?: RequestInit) {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> | undefined),
    Authorization: token ? `Bearer ${token}` : ""
  };
  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(buildUrl(path), {
    ...options,
    headers
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    const message = payload?.error?.message || "Request failed";
    throw new Error(message);
  }

  return payload.data as T;
}

export type AdminProfile = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  featured: boolean;
  status: string;
  tags: string;
  sort_order: number;
  images: { id: number; url: string; sort_order: number }[];
  categories: { id: number; name: string; slug: string }[];
};

export type AdminPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  status: string;
  tags: string;
  sort_order: number;
  published_at?: string | null;
};

export type AdminQnA = {
  id: number;
  question: string;
  answer: string;
  status: string;
  sort_order: number;
};

export type AdminOrder = {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  note: string;
  delivery_time: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  payment_proof_url: string;
  admin_note: string;
  created_at: string;
  items: { product_id: number; name: string; quantity: number; unit_price: number }[];
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
};

export function adminLogin(input: { email: string; password: string }) {
  return adminRequest<{ token: string; admin: AdminProfile }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function adminMe() {
  return adminRequest<AdminProfile>("/api/admin/me");
}

export function listAdminProducts() {
  return adminRequest<AdminProduct[]>("/api/admin/products");
}

export function createAdminProduct(input: Partial<AdminProduct> & { category_ids?: number[] }) {
  return adminRequest<AdminProduct>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateAdminProduct(id: number, input: Partial<AdminProduct> & { category_ids?: number[] }) {
  return adminRequest<AdminProduct>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteAdminProduct(id: number) {
  return adminRequest<{ deleted: boolean }>(`/api/admin/products/${id}`, {
    method: "DELETE"
  });
}

export function addAdminProductImage(id: number, input: { url: string; sort_order: number }) {
  return adminRequest<AdminProduct>(`/api/admin/products/${id}/images`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function listAdminCategories() {
  return adminRequest<AdminCategory[]>("/api/admin/categories");
}

export function createAdminCategory(input: Partial<AdminCategory>) {
  return adminRequest<AdminCategory>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateAdminCategory(id: number, input: Partial<AdminCategory>) {
  return adminRequest<AdminCategory>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteAdminCategory(id: number) {
  return adminRequest<{ deleted: boolean }>(`/api/admin/categories/${id}`, {
    method: "DELETE"
  });
}

export function listAdminPosts() {
  return adminRequest<AdminPost[]>("/api/admin/posts");
}

export function createAdminPost(input: Partial<AdminPost>) {
  return adminRequest<AdminPost>("/api/admin/posts", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateAdminPost(id: number, input: Partial<AdminPost>) {
  return adminRequest<AdminPost>(`/api/admin/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteAdminPost(id: number) {
  return adminRequest<{ deleted: boolean }>(`/api/admin/posts/${id}`, {
    method: "DELETE"
  });
}

export function listAdminQnA() {
  return adminRequest<AdminQnA[]>("/api/admin/qna");
}

export function createAdminQnA(input: Partial<AdminQnA>) {
  return adminRequest<AdminQnA>("/api/admin/qna", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateAdminQnA(id: number, input: Partial<AdminQnA>) {
  return adminRequest<AdminQnA>(`/api/admin/qna/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteAdminQnA(id: number) {
  return adminRequest<{ deleted: boolean }>(`/api/admin/qna/${id}`, {
    method: "DELETE"
  });
}

export function listAdminOrders(params?: { status?: string; payment_status?: string }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.payment_status) search.set("payment_status", params.payment_status);
  const suffix = search.toString();
  return adminRequest<AdminOrder[]>(suffix ? `/api/admin/orders?${suffix}` : "/api/admin/orders");
}

export function updateAdminOrder(id: number, input: { status?: string; payment_status?: string; admin_note?: string }) {
  return adminRequest<AdminOrder>(`/api/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function getPaymentSettings() {
  return adminRequest<PaymentSettings>("/api/admin/payment-settings");
}

export function updatePaymentSettings(input: PaymentSettings) {
  return adminRequest<PaymentSettings>("/api/admin/payment-settings", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function uploadAdminFile(file: File) {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildUrl("/api/admin/uploads"), {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    },
    body: formData
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    const message = payload?.error?.message || "Upload failed";
    throw new Error(message);
  }

  return payload.data as { url: string };
}
