import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { getCategories, getPosts, getProducts } from "@/lib/api";
import { formatDate, stripHtml } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export default async function HomePage() {
  const [categories, featuredProducts, posts] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 6 }),
    getPosts()
  ]);

  const latestPosts = posts.slice(0, 3);

  return (
    <div>
      <section className="section-shell pb-12 pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <p className="pill">Nong san sach - giao nhanh</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
              Ket noi nong trai, dua nong san tu vuon den ban an.
            </h1>
            <p className="mt-5 text-base text-ink/70 md:text-lg">
              San pham tu cac vuon trong doi tac, duoc chon loc va giao hang trong ngay.
              Tim thay mua vu moi, cong thuc doc quyen va tin tuc nong nghiep.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary">
                Mua san pham
              </Link>
              <Link href="/blog" className="btn-ghost">
                Doc tin tuc
              </Link>
            </div>
            <div className="mt-10 grid max-w-md gap-4 rounded-3xl bg-white/80 p-5 text-sm shadow-lg md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Giao hang
                </p>
                <p className="mt-2 font-semibold">Trong 24h</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Nguon hang
                </p>
                <p className="mt-2 font-semibold">Tu nong trai</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  Ho tro
                </p>
                <p className="mt-2 font-semibold">Tu van truc tiep</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sun/30 blur-3xl" />
            <div className="card-surface relative overflow-hidden p-6">
              <div className="absolute -right-10 top-8 h-32 w-32 rounded-full border border-forest/20" />
              <div className="relative h-72 overflow-hidden rounded-2xl bg-mist">
                <img
                  src="/hero.svg"
                  alt="Seasonal harvest"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                    Mua vu hien tai
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    Nong san dau mua
                  </p>
                </div>
                <span className="rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-forest">
                  Moi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="pill">Danh muc</p>
            <h2 className="mt-4 text-3xl font-semibold">Mua sam theo nhu cau</h2>
          </div>
          <Link className="btn-ghost" href="/products">
            Xem tat ca
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="card-surface group p-6 transition hover:-translate-y-1"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Danh muc</p>
              <h3 className="mt-3 text-xl font-semibold">{category.name}</h3>
              <p className="mt-2 text-sm text-ink/70">
                {category.description || "San pham noi bat cho mua vu nay."}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-forest">
                Kham pha
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="pill">Noi bat</p>
            <h2 className="mt-4 text-3xl font-semibold">San pham ban chay</h2>
          </div>
          <Link className="btn-ghost" href="/products">
            Xem them san pham
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.length === 0 ? (
            <div className="card-surface col-span-full p-10 text-center text-sm text-ink/70">
              Chua co san pham noi bat.
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
            <p className="pill">Tin tuc</p>
            <h2 className="mt-4 text-3xl font-semibold">Goc chia se</h2>
          </div>
          <Link className="btn-ghost" href="/blog">
            Doc them
          </Link>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {latestPosts.length === 0 ? (
            <div className="card-surface col-span-full p-10 text-center text-sm text-ink/70">
              Chua co bai viet.
            </div>
          ) : (
            latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="card-surface group flex flex-col gap-6 p-6 md:flex-row"
              >
                <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-mist md:h-44 md:w-48">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink/50">
                      Chua co anh
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                    {formatDate(post.published_at) || "Tin tuc"}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{post.title}</h3>
                  <p className="mt-3 text-sm text-ink/70">
                    {stripHtml(post.excerpt).slice(0, 140) ||
                      "Chia se ve mua vu, ky thuat va cach che bien."}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="card-surface grid gap-8 p-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="pill">Ban tin</p>
            <h2 className="mt-4 text-3xl font-semibold">
              Nhan thong tin ve mua vu moi.
            </h2>
            <p className="mt-3 text-sm text-ink/70">
              Dang ky de nhan thong tin uu dai va danh muc nong san theo mua.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <input className="field" placeholder="Email cua ban" />
            <button className="btn-secondary">Dang ky ngay</button>
          </div>
        </div>
      </section>

      <section className="section-shell py-12">
        <div className="grid gap-6 rounded-3xl bg-forest px-8 py-10 text-cream md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cream/70">
              Lien he
            </p>
            <h2 className="mt-4 text-3xl font-semibold">
              Can tu van nong san?
            </h2>
            <p className="mt-3 text-sm text-cream/70">
              Doi ngu TTC san sang ho tro tu van san pham, giao hang va hop tac.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
