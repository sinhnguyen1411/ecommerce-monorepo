import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AddToCartButton from "@/components/cart/AddToCartButton";
import { buildAssetUrl, getProductBySlug } from "@/lib/directus";
import { formatPrice } from "@/lib/format";

type ProductDetailPageProps = {
  params: {
    slug: string;
  };
};

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const images = product.product_images ?? [];
  const onSale =
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price;

  return (
    <div>
      <section className="section-shell pb-6 pt-12">
        <Link className="text-sm text-ink/60 hover:text-ember" href="/products">
          <- Back to products
        </Link>
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-sand">
              {images[0]?.image ? (
                <div className="relative h-96">
                  <Image
                    src={buildAssetUrl(images[0].image)}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center text-sm text-ink/50">
                  No image available
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-3 gap-4">
                {images.slice(1, 4).map((image) => (
                  <div
                    key={image.id}
                    className="relative h-24 overflow-hidden rounded-2xl bg-sand"
                  >
                    <Image
                      src={buildAssetUrl(image.image)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="card-surface flex flex-col p-8">
            <p className="pill">Product detail</p>
            <h1 className="mt-5 text-3xl font-semibold">{product.name}</h1>
            <p className="mt-4 text-sm text-ink/70">
              {product.description ||
                "A versatile staple selected for freshness, provenance, and flavor."}
            </p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {formatPrice(product.price)}
              </span>
              {onSale ? (
                <span className="text-sm text-ink/50 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <AddToCartButton product={product} />
              <AddToCartButton
                product={product}
                variant="ghost"
                label="Add to list"
              />
            </div>
            <div className="mt-8 grid gap-4 rounded-2xl border border-moss/10 bg-white/70 p-5 text-sm text-ink/70">
              <div className="flex items-center justify-between">
                <span>Harvested</span>
                <span className="font-semibold">Within 48 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage</span>
                <span className="font-semibold">Cool, dry, breathable</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Packaging</span>
                <span className="font-semibold">Compostable wrap</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

