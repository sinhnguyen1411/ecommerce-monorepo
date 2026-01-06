import Link from "next/link";
import { notFound } from "next/navigation";

import RecentlyViewed from "@/components/RecentlyViewed";
import ProductDetailSidebar from "@/components/product/ProductDetailSidebar";
import ProductGrid from "@/components/product/ProductGrid";
import SaleBadge from "@/components/product/SaleBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProduct, getProducts } from "@/lib/api";

export const metadata = {
  title: "San pham | Nong Nghiep TTC",
  description: "Chi tiet san pham va thong tin mua hang."
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
            <div className="relative overflow-hidden rounded-[32px] bg-mist">
              {onSale ? (
                <div className="absolute left-4 top-4 z-10">
                  <SaleBadge />
                </div>
              ) : null}
              {product.images?.[0]?.url ? (
                <div className="relative h-[420px]">
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-[420px] items-center justify-center text-sm text-ink/50">
                  Dang cap nhat anh
                </div>
              )}
            </div>
            {product.images?.length > 1 ? (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1, 5).map((image) => (
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

          <ProductDetailSidebar product={product} />
        </div>
      </section>

      <section className="section-shell pb-12">
        <Tabs
          defaultValue="description"
          className="rounded-[28px] border border-forest/10 bg-white/90 p-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Mo ta</TabsTrigger>
            <TabsTrigger value="return">Doi tra</TabsTrigger>
            <TabsTrigger value="terms">Dieu khoan</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-4 text-sm text-ink/70">
            {product.description ||
              "San pham duoc chon loc tu cac nha vuon doi tac, dam bao do tuoi moi va nguon goc ro rang."}
          </TabsContent>
          <TabsContent value="return" className="pt-4 text-sm text-ink/70">
            Doi tra trong 24 gio neu san pham khong dat chat luong. Xem them tai{" "}
            <Link className="text-forest" href="/pages/return-policy">
              chinh sach doi tra
            </Link>
            .
          </TabsContent>
          <TabsContent value="terms" className="pt-4 text-sm text-ink/70">
            Don hang duoc xac nhan khi TTC lien he hoac nhan thanh toan thanh cong. Xem chi tiet tai{" "}
            <Link className="text-forest" href="/pages/terms-of-service">
              dieu khoan dich vu
            </Link>
            .
          </TabsContent>
        </Tabs>
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
        <div className="mt-6">
          <ProductGrid
            products={relatedProducts.filter((item) => item.id !== product.id).slice(0, 3)}
          />
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
