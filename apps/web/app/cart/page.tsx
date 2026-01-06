import { getProducts } from "@/lib/api";

import CartClient from "./CartClient";

export const metadata = {
  title: "Gio hang | Nong Nghiep TTC",
  description: "Xem va cap nhat gio hang mua sam."
};

export default async function CartPage() {
  const suggestedProducts = await getProducts({ limit: 4 });

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <div>
          <p className="pill">Gio hang</p>
          <h1 className="mt-4 text-4xl font-semibold">Tong quan don hang</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/70">
            Kiem tra san pham, uu dai va chon thoi gian giao.
          </p>
        </div>
      </section>

      <CartClient suggestedProducts={suggestedProducts} />
    </div>
  );
}
