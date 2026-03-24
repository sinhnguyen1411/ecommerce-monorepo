import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";

import ProductsClient from "../../products/ProductsClient";

export const metadata = {
  title: "Tất cả sản phẩm | Nông Dược Tam Bố",
  description: "Danh sách sản phẩm nông nghiệp và mức giá tại Tam Bố."
};

type CollectionsAllPageProps = {
  searchParams?: Promise<{
    category?: string;
    sort_by?: string;
    q?: string;
    price_min?: string;
    price_max?: string;
    vendor?: string;
    promo?: string;
  }>;
};

export default async function CollectionsAllPage({
  searchParams
}: CollectionsAllPageProps) {
  const resolvedSearchParams = await searchParams;
  const priceMin = resolvedSearchParams?.price_min
    ? Number(resolvedSearchParams.price_min)
    : undefined;
  const priceMax = resolvedSearchParams?.price_max
    ? Number(resolvedSearchParams.price_max)
    : undefined;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      category: resolvedSearchParams?.category,
      sort_by: resolvedSearchParams?.sort_by,
      q: resolvedSearchParams?.q,
      vendor: resolvedSearchParams?.vendor,
      price_min: Number.isNaN(priceMin as number) ? undefined : priceMin,
      price_max: Number.isNaN(priceMax as number) ? undefined : priceMax
    })
  ]);

  return (
    <div className="layout-collections">
      <div className="header-banner">
        <div className="breadcrumb-shop">
          <div className="container">
            <div className="breadcrumb-list">
              <ol className="breadcrumb breadcrumb-arrows">
                <li>
                  <Link href="/">Trang chủ</Link>
                </li>
                <li className="active">
                  <strong>Tất cả sản phẩm</strong>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <ProductsClient
        categories={categories}
        products={products}
        initialCategory={resolvedSearchParams?.category}
        initialSort={resolvedSearchParams?.sort_by}
        initialQuery={resolvedSearchParams?.q}
        initialMinPrice={resolvedSearchParams?.price_min}
        initialMaxPrice={resolvedSearchParams?.price_max}
        initialVendor={resolvedSearchParams?.vendor}
        initialPromotion={resolvedSearchParams?.promo}
      />
    </div>
  );
}

