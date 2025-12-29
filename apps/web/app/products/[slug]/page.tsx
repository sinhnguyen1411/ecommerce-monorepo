import Link from "next/link";
import { notFound } from "next/navigation";

import AddToCartButton from "@/components/cart/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import { getProduct, getProducts } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";

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

  const categorySlug = product.categories?.[0]?.slug;
  const relatedProducts = categorySlug
    ? await getProducts({ category: categorySlug, limit: 4 })
    : [];

  return (
    <div>
      <section className="section-shell pb-6 pt-12">
        <Link className="text-sm text-ink/60 hover:text-clay" href="/products">
          <- Quay lai san pham
        </Link>
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-mist">
              {product.images?.[0]?.url ? (
                <div className="relative h-96">
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center text-sm text-ink/50">
                  Chua co anh
                </div>
              )}
            </div>
            {product.images?.length > 1 ? (
              <div className="grid grid-cols-3 gap-4">
                {product.images.slice(1, 4).map((image) => (
                  <div
                    key={image.id}
                    className="relative h-24 overflow-hidden rounded-2xl bg-mist"
                  >
                    <img
                      src={image.url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="card-surface flex flex-col p-8">
            <div className="flex flex-wrap gap-2">
              {product.categories?.map((category) => (
                <span key={category.id} className="chip">
                  {category.name}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-semibold">{product.name}</h1>
            <p className="mt-4 text-sm text-ink/70">
              {product.description ||
                "San pham tu nong trai doi tac, dam bao chat luong va do tuoi moi."}
            </p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {formatCurrency(product.price)}
              </span>
              {onSale ? (
                <span className="text-sm text-ink/50 line-through">
                  {formatCurrency(product.compare_at_price)}
                </span>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <AddToCartButton product={product} />
              <AddToCartButton
                product={product}
                variant="ghost"
                label="Them vao danh sach"
              />
            </div>
            <div className="mt-8 space-y-3 text-sm text-ink/70">
              <div className="flex items-center justify-between">
                <span>Hoan tra</span>
                <Link className="text-forest" href="/pages/return-policy">
                  Xem chinh sach
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span>Dieu khoan</span>
                <Link className="text-forest" href="/pages/terms-of-service">
                  Xem chi tiet
                </Link>
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-forest/10 bg-white/70 p-5 text-sm text-ink/70">
              <p className="font-semibold">Ho tro nhanh</p>
              <p className="mt-2">Hotline: {siteConfig.phone}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link className="btn-ghost" href={siteConfig.social.zalo}>
                  Zalo
                </Link>
                <Link className="btn-ghost" href={siteConfig.social.messenger}>
                  Messenger
                </Link>
                <Link className="btn-ghost" href={siteConfig.social.facebook}>
                  Facebook
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell pb-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill">Lien quan</p>
            <h2 className="mt-3 text-2xl font-semibold">San pham goi y</h2>
          </div>
          <Link href="/products" className="btn-ghost">
            Xem tat ca
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {relatedProducts
            .filter((item) => item.id !== product.id)
            .slice(0, 3)
            .map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
        </div>
      </section>

      <section className="section-shell pb-16">
        <div>
          <p className="pill">Da xem</p>
          <h2 className="mt-3 text-2xl font-semibold">San pham vua xem</h2>
        </div>
        <div className="mt-6">
          <RecentlyViewed current={product} />
        </div>
      </section>
    </div>
  );
}
