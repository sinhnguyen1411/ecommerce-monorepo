import Link from "next/link";

import PostCard from "@/components/blog/PostCard";
import SectionTitle from "@/components/common/SectionTitle";
import ProductGrid from "@/components/product/ProductGrid";
import { getCategories, getPosts, getProducts } from "@/lib/api";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Nong Nghiep TTC | Trang chu",
  description: "San pham nong nghiep, tin tuc mua vu va cong dong nha nong."
};

export default async function HomePage() {
  const [categories, featuredProducts, posts] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 6 }),
    getPosts()
  ]);

  return (
    <div>
      <section className="section-shell pb-8 pt-8">
        <div className="grid gap-8 rounded-[32px] border border-forest/10 bg-white/80 p-7 md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <p className="pill">Nong san TTC</p>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Giao nong san tu vuon den ban an trong ngay.
            </h1>
            <p className="text-sm text-ink/70">
              Lua chon san pham tuoi sach, dat hang nhanh, tu van tan tinh. Dong bo du lieu tu he thong quan ly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">
                Mua san pham
              </Link>
              <Link href="/blog" className="rounded-full border border-forest/20 px-5 py-2 text-sm font-semibold text-forest">
                Doc tin tuc
              </Link>
            </div>
            <div className="grid gap-4 rounded-2xl bg-mist p-4 text-xs text-ink/70 sm:grid-cols-3">
              <div>
                <p className="uppercase tracking-[0.2em]">Giao nhanh</p>
                <p className="mt-1 font-semibold">24 - 48 gio</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em]">Nguon hang</p>
                <p className="mt-1 font-semibold">Nong trai doi tac</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em]">Ho tro</p>
                <p className="mt-1 font-semibold">Tu van truc tiep</p>
              </div>
            </div>
          </div>
          <div className="relative h-[260px] overflow-hidden rounded-3xl bg-mist md:h-full">
            <img src="/hero.svg" alt="Hero" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="section-shell py-10">
        <SectionTitle
          eyebrow="Danh muc"
          title="San pham theo mua vu"
          description="Chon nhanh theo tung nhom san pham duoc ua chuong."
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="rounded-[24px] border border-forest/10 bg-white/80 p-5 transition hover:-translate-y-1"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Danh muc</p>
              <h3 className="mt-3 text-lg font-semibold">{category.name}</h3>
              <p className="mt-2 text-sm text-ink/70">
                {category.description || "San pham noi bat theo mua."}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Noi bat" title="Gian hang san pham" />
          <Link href="/products" className="text-sm font-semibold text-forest">
            Xem tat ca
          </Link>
        </div>
        <div className="mt-6 rounded-[32px] border border-forest/10 bg-white/90 p-6">
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <section className="section-shell py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Tin tuc" title="Goc chia se" />
          <Link href="/blog" className="text-sm font-semibold text-forest">
            Doc them
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="section-shell py-10">
        <div className="grid gap-6 rounded-[32px] border border-forest/10 bg-forest px-8 py-10 text-white md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Ban tin</p>
            <h2 className="mt-3 text-2xl font-semibold">Nhan thong tin mua vu moi.</h2>
            <p className="mt-2 text-sm text-white/70">Cap nhat san pham va uu dai tu TTC.</p>
          </div>
          <div className="flex flex-col gap-3">
            <input className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60" placeholder="Email cua ban" />
            <button className="h-10 rounded-full bg-sun text-sm font-semibold text-ink">Dang ky</button>
          </div>
        </div>
      </section>

      <section className="section-shell pb-16 pt-10">
        <div className="grid gap-6 rounded-[32px] border border-forest/10 bg-white/90 p-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Lien he</p>
            <h2 className="mt-3 text-2xl font-semibold">Can tu van nong san?</h2>
            <p className="mt-2 text-sm text-ink/70">Doi ngu TTC luon san sang ho tro.</p>
          </div>
          <div className="space-y-2 text-sm text-ink/70">
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
