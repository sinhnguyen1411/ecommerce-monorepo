import Link from "next/link";

import ProductGrid from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/api";

export const metadata = {
  title: "Tìm kiếm | Nông nghiệp TTC",
  description: "Kết quả tìm kiếm sản phẩm tại TTC."
};

type SearchPageProps = {
  searchParams?: {
    q?: string;
    type?: string;
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q?.trim() || "";
  const products = await getProducts({ q: query });
  const filtered = query
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase())
      )
    : products;

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Tìm kiếm</p>
          <h1 className="mt-3 text-2xl font-semibold">Kết quả tìm kiếm</h1>
          <p className="mt-3 max-w-xl text-sm text-ink/70">
            {query
              ? `Từ khóa: ${query} (${filtered.length} sản phẩm)`
              : "Nhập từ khóa để tìm kiếm sản phẩm."}
          </p>
        </div>
      </section>

      <section className="section-shell pb-16">
        {filtered.length === 0 ? (
          <div className="border border-forest/10 bg-white p-10 text-center text-sm text-ink/70">
            Không tìm thấy sản phẩm phù hợp.
            <div className="mt-4">
              <Link href="/collections/all" className="button btnlight">
                Xem tất cả sản phẩm
              </Link>
            </div>
          </div>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </section>
    </div>
  );
}
