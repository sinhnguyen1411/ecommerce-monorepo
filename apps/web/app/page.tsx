import Image from "next/image";
import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { buildAssetUrl, getFeaturedProducts, getLatestPosts } from "@/lib/directus";
import { formatDate, stripHtml } from "@/lib/format";

export default async function HomePage() {
  const [featuredProducts, latestPosts] = await Promise.all([
    getFeaturedProducts(),
    getLatestPosts()
  ]);

  return (
    <div>
      <section className="section-shell pb-12 pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <p className="pill">Seasonal market + journal</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
              Grow the pantry, feed the table, and share the story.
            </h1>
            <p className="mt-5 text-base text-ink/70 md:text-lg">
              Curated produce, slow-crafted pantry goods, and field notes from small
              farms. Everything you need to launch a grounded, modern ecommerce
              presence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary">
                Shop seasonal picks
              </Link>
              <Link href="/blog" className="btn-ghost">
                Read the journal
              </Link>
            </div>
            <div className="mt-10 grid max-w-md gap-4 rounded-3xl bg-cream/80 p-5 text-sm shadow-soft md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Delivery
                </p>
                <p className="mt-2 font-semibold">48h within metro</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Harvest
                </p>
                <p className="mt-2 font-semibold">Weekly refresh</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Support
                </p>
                <p className="mt-2 font-semibold">Direct with farms</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-ember/20 blur-3xl" />
            <div className="card-surface relative overflow-hidden p-6">
              <div className="absolute -right-10 top-8 h-32 w-32 rounded-full border border-moss/20" />
              <div className="relative h-72 overflow-hidden rounded-2xl bg-sand">
                <Image
                  src="/hero.svg"
                  alt="Seasonal harvest illustration"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                    Harvest highlight
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    Early autumn selections
                  </p>
                </div>
                <span className="rounded-full border border-moss/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-moss">
                  New
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="pill">Featured</p>
            <h2 className="mt-4 text-3xl font-semibold">Customer favorites</h2>
          </div>
          <Link className="btn-ghost" href="/products">
            View all products
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.length === 0 ? (
            <div className="card-surface col-span-full p-10 text-center text-sm text-ink/70">
              Add featured products in Directus to populate this section.
            </div>
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="pill">Journal</p>
            <h2 className="mt-4 text-3xl font-semibold">From the field</h2>
          </div>
          <Link className="btn-ghost" href="/blog">
            Read more posts
          </Link>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {latestPosts.length === 0 ? (
            <div className="card-surface col-span-full p-10 text-center text-sm text-ink/70">
              Publish your first blog post in Directus to see it here.
            </div>
          ) : (
            latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="card-surface group flex flex-col gap-6 p-6 md:flex-row"
              >
                <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-sand md:h-44 md:w-48">
                  {post.cover_image ? (
                    <Image
                      src={buildAssetUrl(post.cover_image)}
                      alt={post.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink/50">
                      No cover image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                    {formatDate(post.published_at) || "Editorial"}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{post.title}</h3>
                  <p className="mt-3 text-sm text-ink/70">
                    {stripHtml(post.content).slice(0, 140) ||
                      "Thoughtful notes on sourcing, harvest timing, and seasonal cooking."}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section id="about" className="section-shell py-12">
        <div className="card-surface grid gap-8 p-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="pill">Our story</p>
            <h2 className="mt-4 text-3xl font-semibold">
              Built for long-term handover.
            </h2>
          </div>
          <div className="space-y-4 text-sm text-ink/70">
            <p>
              The frontend reads directly from Directus, so edits and new products
              happen instantly through the CMS. This keeps maintenance lean and
              avoids custom admin dashboards.
            </p>
            <p>
              The Go API service is already scaffolded, ready to add checkout,
              orders, and integrations as the business grows.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

