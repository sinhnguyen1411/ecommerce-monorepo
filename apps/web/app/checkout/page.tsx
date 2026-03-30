import { redirect } from "next/navigation";

export const metadata = {
  title: "Thanh toán | Nông Dược Tam Bố",
  description: "Trang thanh toán đã được gộp vào giỏ hàng."
};

export default function CheckoutPage() {
  redirect("/cart");
}
