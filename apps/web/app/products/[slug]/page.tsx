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
  title: "Sản phẩm | Nông nghiệp TTC",
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

  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;
  const salePercent = onSale
    ? Math.round(
        ((product.compare_at_price || 0) - product.price) /
          (product.compare_at_price || 1) *
          100
      )
    : null;

  const categorySlug = product.categories?.[0]?.slug;
  const relatedProducts = categorySlug
    ? await getProducts({ category: categorySlug, limit: 4 })
    : [];

  return (
    <div>
      <section className="section-shell pb-6 pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink/60">
          <div>
            <Link className="hover:text-forest" href="/">
              Trang chủ
            </Link>{" "}
            /{" "}
            <Link className="hover:text-forest" href="/collections/all">
              Sản phẩm
            </Link>{" "}
            / <span>{product.name}</span>
          </div>
          <Link className="text-ink/60 hover:text-clay" href="/collections/all">
            &larr; Quay lại sản phẩm
          </Link>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <ProductGallery
            images={product.images || []}
            name={product.name}
            salePercent={salePercent}
          />
          <ProductDetailSidebar product={product} />
        </div>
      </section>

      <section className="section-shell pb-12">
        <ProductInfoHighlights />
      </section>

      <section className="section-shell pb-12">
        <ProductTabs description={product.description} />
      </section>

      <section className="section-shell pb-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Liên quan</p>
            <h2 className="mt-3 text-xl font-semibold">Sản phẩm gợi ý</h2>
          </div>
          <Link href="/collections/all" className="button btnlight">
            Xem tất cả
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid
            products={relatedProducts.filter((item) => item.id !== product.id).slice(0, 3)}
          />
        </div>
      </section>

      <section className="section-shell pb-16">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Đã xem</p>
          <h2 className="mt-3 text-xl font-semibold">Sản phẩm vừa xem</h2>
        </div>
        <div className="mt-6">
          <RecentlyViewed current={product} />
        </div>
      </section>
    </div>
  );
}
