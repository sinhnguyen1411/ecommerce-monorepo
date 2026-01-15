import { getProducts } from "@/lib/api";

import CartClient from "./CartClient";

export const metadata = {
  title: "Giỏ hàng | Nông nghiệp TTC",
  description: "Xem và cập nhật giỏ hàng mua sắm."
};

export default async function CartPage() {
  const suggestedProducts = await getProducts({ limit: 4 });

  return <CartClient suggestedProducts={suggestedProducts} />;
}
