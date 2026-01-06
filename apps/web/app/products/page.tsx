import Link from "next/link";

import { getCategories, getProducts } from "@/lib/api";

import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "San pham | Nong Nghiep TTC",
  description: "Danh sach san pham nong san va muc gia tai TTC."
};

type ProductsPageProps = {
  searchParams?: {
    category?: string;
    sort?: string;
  };
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts()
  ]);

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="pill">San pham</p>
            <h1 className="mt-4 text-4xl font-semibold">Cho nong san TTC</h1>
            <p className="mt-3 max-w-xl text-sm text-ink/70">
              Loc theo danh muc, gia va mua vu. Tat ca du lieu dong bo tu he thong quan ly.
            </p>
          </div>
          <Link className="btn-ghost" href="/blog">
            Doc tin tuc
          </Link>
        </div>
      </section>

      <ProductsClient
        categories={categories}
        products={products}
        initialCategory={searchParams?.category}
        initialSort={searchParams?.sort}
      />
    </div>
  );
}
