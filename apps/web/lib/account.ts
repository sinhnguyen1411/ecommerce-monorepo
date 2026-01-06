import { getUserToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function buildUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function authRequest<T>(path: string, options?: RequestInit) {
  const token = getUserToken();
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    const message = payload?.error?.message || "Request failed";
    throw new Error(message);
  }

  return payload.data as T;
}

export type UserProfile = {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
};

export type Address = {
  id: number;
  full_name: string;
  phone: string;
  address_line: string;
  province?: string;
  district?: string;
  is_default: boolean;
};

export type OrderItemSummary = {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
};

export type OrderSummary = {
  id: number;
  order_number: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  items: OrderItemSummary[];
};

export function getProfile() {
  return authRequest<UserProfile>("/api/account/profile");
}

export function updateProfile(input: { name: string; phone: string }) {
  return authRequest<UserProfile>("/api/account/profile", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function listAddresses() {
  return authRequest<Address[]>("/api/account/addresses");
}

export function createAddress(input: Omit<Address, "id">) {
  return authRequest<Address[]>("/api/account/addresses", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateAddress(id: number, input: Omit<Address, "id"> | Address) {
  return authRequest<Address[]>(`/api/account/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteAddress(id: number) {
  return authRequest<{ deleted: boolean }>(`/api/account/addresses/${id}`, {
    method: "DELETE"
  });
}

export function listOrders() {
  return authRequest<OrderSummary[]>("/api/account/orders");
}
