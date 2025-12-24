import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/directus";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="pill">Catalog</p>
            <h1 className="mt-4 text-4xl font-semibold">Seasonal marketplace</h1>
            <p className="mt-3 max-w-xl text-sm text-ink/70">
              Browse the full lineup, from fresh harvest boxes to pantry staples.
              All products sync directly from Directus.
            </p>
          </div>
          <Link className="btn-ghost" href="/blog">
            Pair with our journal
          </Link>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="card-surface col-span-full p-10 text-center text-sm text-ink/70">
              Add published products in Directus to populate this catalog.
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

