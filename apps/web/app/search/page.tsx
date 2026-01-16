import Link from "next/link";

import ProductGrid from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/api";

export const metadata = {
  title: "Tìm kiếm | Nông Dược Tam Bố",
  description: "Kết quả tìm kiếm sản phẩm tại Tam Bố."
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
                  <strong>Tìm kiếm</strong>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="section-collection">
          <div className="toolbar-products">
            <div className="head-title">
              <h1 className="title">Kết quả tìm kiếm</h1>
              <div className="product-count">
                <div className="count">
                  <b>{filtered.length}</b> sản phẩm
                </div>
              </div>
            </div>
          </div>
          <p className="search-note">
            {query ? `Từ khóa: "${query}"` : "Nhập từ khóa để tìm kiếm sản phẩm."}
          </p>

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
        </div>
      </div>
    </div>
  );
}
