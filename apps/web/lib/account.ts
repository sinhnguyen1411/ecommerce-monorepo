import { authRequest } from "./auth-client";

export type UserProfile = {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  birthdate?: string;
  is_email_verified?: boolean;
  emailVerificationStatus?: string;
  has_password: boolean;
  onboarding_required: boolean;
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
  line_total: number;
};

export type OrderSummary = {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  address_line?: string;
  province?: string;
  district?: string;
  note: string;
  delivery_time: string;
  promo_code: string;
  shipping_method: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  payment_proof_url: string;
  created_at: string;
  updated_at: string;
  items: OrderItemSummary[];
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function buildUrl(path: string) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

export function getProfile() {
  return authRequest<UserProfile>("/api/account/profile", undefined, { auth: true });
}

export function updateProfile(input: { name: string; phone: string; birthdate: string }) {
  return authRequest<UserProfile>(
    "/api/account/profile",
    {
      method: "PATCH",
      body: JSON.stringify(input)
    },
    { auth: true }
  );
}

export function completeOnboarding(input: {
  full_name: string;
  phone: string;
  birthdate: string;
  address_line: string;
  province: string;
  district: string;
  password: string;
  password_confirm: string;
}) {
  return authRequest<UserProfile>(
    "/api/account/onboarding/complete",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    { auth: true }
  );
}

export function listAddresses() {
  return authRequest<Address[]>("/api/account/addresses", undefined, { auth: true });
}

export function createAddress(input: Omit<Address, "id">) {
  return authRequest<Address[]>(
    "/api/account/addresses",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    { auth: true }
  );
}

export function updateAddress(id: number, input: Omit<Address, "id"> | Address) {
  return authRequest<Address[]>(
    `/api/account/addresses/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    },
    { auth: true }
  );
}

export function deleteAddress(id: number) {
  return authRequest<{ deleted: boolean }>(
    `/api/account/addresses/${id}`,
    {
      method: "DELETE"
    },
    { auth: true }
  );
}

export function listOrders() {
  return authRequest<OrderSummary[]>("/api/account/orders", undefined, { auth: true });
}

export function getOrderDetail(id: number) {
  return authRequest<OrderSummary>(`/api/account/orders/${id}`, undefined, { auth: true });
}

export function updateOrderNote(id: number, note: string) {
  return authRequest<OrderSummary>(
    `/api/account/orders/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ note })
    },
    { auth: true }
  );
}

export async function uploadOrderPaymentProof(id: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildUrl(`/api/account/orders/${id}/payment-proof`), {
    method: "POST",
    body: formData,
    cache: "no-store",
    credentials: "include"
  });

  const payload = (await response.json()) as ApiEnvelope<OrderSummary>;
  if (!response.ok || !payload.success) {
    const message = payload?.error?.message || "Upload failed";
    throw new Error(message);
  }

  return payload.data;
}
