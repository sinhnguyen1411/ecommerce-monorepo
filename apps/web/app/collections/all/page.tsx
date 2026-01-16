import { getCategories, getProducts } from "@/lib/api";

import ProductsClient from "../../products/ProductsClient";

export const metadata = {
  title: "Tất cả sản phẩm | Nông Dược Tam Bố",
  description: "Danh sách sản phẩm nông nghiệp và mức giá tại Tam Bố."
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
    <div className="layout-collections">
      <div className="header-banner">
        <div className="breadcrumb-shop">
          <div className="container">
            <div className="breadcrumb-list">
              <ol className="breadcrumb breadcrumb-arrows">
                <li>
                  <a href="/" target="_self">
                    Trang chủ
                  </a>
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
