import Link from "next/link";
import { notFound } from "next/navigation";

import RecentlyViewed from "@/components/RecentlyViewed";
import ProductDetailSidebar from "@/components/product/ProductDetailSidebar";
import ProductGallery from "@/components/product/ProductGallery";
import ProductGrid from "@/components/product/ProductGrid";
import ProductInfoHighlights from "@/components/product/ProductInfoHighlights";
import ProductTabs from "@/components/product/ProductTabs";
import { getProduct, getProducts } from "@/lib/api";

export const metadata = {
  title: "Sản phẩm | Nông Dược Tam Bố",
  description: "Chi tiết sản phẩm và thông tin mua hàng."
};

type ProductDetailPageProps = {
  params: {
    slug: string;
  };
};

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps) {
  const product = await getProduct(params.slug).catch(() => null);

  if (!product) {
    notFound();
  }

  const categorySlug = product.categories?.[0]?.slug;
  const relatedProducts = categorySlug
    ? await getProducts({ category: categorySlug, limit: 4 })
    : [];

  return (
    <div className="layout-productDetail layout-pageProduct">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li>
                <Link href="/collections/all">Sản phẩm</Link>
              </li>
              <li className="active">
                <span>
                  <strong>{product.name}</strong>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="productDetail-information productDetail_style__01">
        <div className="container">
          <div className="productDetail-main">
            <div className="row">
              <div className="col-lg-5 col-md-12 col-12 product-gallery">
                <ProductGallery images={product.images || []} name={product.name} />
              </div>
              <div className="col-lg-7 col-md-12 col-12 product-info">
                <ProductDetailSidebar product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="productDetail-subinfo">
        <div className="container">
          <ProductInfoHighlights />
        </div>
      </div>

      <div className="productDetail-description">
        <div className="container">
          <div className="product-tabs">
            <ProductTabs description={product.description} />
          </div>
        </div>
      </div>

      <div className="productDetail-related">
        <div className="container">
          <div className="product-related">
            <div className="product-related__head">
              <h2>Sản phẩm liên quan</h2>
              <Link href="/collections/all" className="button btnlight">
                Xem tất cả
              </Link>
            </div>
            <ProductGrid
              products={relatedProducts.filter((item) => item.id !== product.id).slice(0, 5)}
            />
          </div>
        </div>
      </div>

      <div className="productDetail-viewed">
        <div className="container">
          <div className="product-viewed">
            <h2>Sản phẩm đã xem</h2>
            <RecentlyViewed current={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
