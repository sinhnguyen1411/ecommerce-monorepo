import { authRequest } from "./auth-client";

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
  return authRequest<UserProfile>("/api/account/profile", undefined, { auth: true });
}

export function updateProfile(input: { name: string; phone: string }) {
  return authRequest<UserProfile>(
    "/api/account/profile",
    {
      method: "PATCH",
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
