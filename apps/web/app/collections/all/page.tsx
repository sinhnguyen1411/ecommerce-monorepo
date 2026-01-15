import Link from "next/link";

import { getCategories, getProducts } from "@/lib/api";

import ProductsClient from "../../products/ProductsClient";

export const metadata = {
  title: "Sản phẩm | Nông nghiệp TTC",
  description: "Danh sách sản phẩm nông sản và mức giá tại TTC."
};

type CollectionsAllPageProps = {
  searchParams?: {
    category?: string;
    sort_by?: string;
    q?: string;
    price_min?: string;
    price_max?: string;
    vendor?: string;
    color?: string;
    size?: string;
  };
};

export default async function CollectionsAllPage({
  searchParams
}: CollectionsAllPageProps) {
  const priceMin = searchParams?.price_min ? Number(searchParams.price_min) : undefined;
  const priceMax = searchParams?.price_max ? Number(searchParams.price_max) : undefined;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      category: searchParams?.category,
      sort_by: searchParams?.sort_by,
      q: searchParams?.q,
      vendor: searchParams?.vendor,
      price_min: Number.isNaN(priceMin as number) ? undefined : priceMin,
      price_max: Number.isNaN(priceMax as number) ? undefined : priceMax
    })
  ]);

  return (
    <div>
      <section className="section-shell pb-8 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Sản phẩm</p>
            <h1 className="mt-3 text-2xl font-semibold">Chợ nông sản TTC</h1>
            <p className="mt-3 max-w-xl text-sm text-ink/70">
              Lọc theo danh mục, giá và mùa vụ. Tất cả dữ liệu đồng bộ từ hệ thống
              quản lý.
            </p>
          </div>
          <Link className="button btnlight" href="/blogs/news">
            Đọc tin tức
          </Link>
        </div>
      </section>

      <ProductsClient
        categories={categories}
        products={products}
        initialCategory={searchParams?.category}
        initialSort={searchParams?.sort_by}
        initialQuery={searchParams?.q}
        initialMinPrice={searchParams?.price_min}
        initialMaxPrice={searchParams?.price_max}
        initialVendor={searchParams?.vendor}
        initialColors={searchParams?.color}
        initialSizes={searchParams?.size}
      />
    </div>
  );
}
