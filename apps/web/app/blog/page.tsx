import Link from "next/link";

import PostCard from "@/components/blog/PostCard";
import PostSidebar from "@/components/blog/PostSidebar";
import SectionTitle from "@/components/common/SectionTitle";
import { getPosts } from "@/lib/api";

export const metadata = {
  title: "Tin tuc | Nong Nghiep TTC",
  description: "Cap nhat tin tuc mua vu va goc chia se cua TTC."
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div>
      <section className="section-shell pb-10 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="pill">Tin tuc</p>
            <h1 className="mt-4 text-4xl font-semibold">Goc chia se</h1>
            <p className="mt-3 max-w-xl text-sm text-ink/70">
              Cap nhat ve mua vu, ky thuat va hanh trinh cua nong dan.
            </p>
          </div>
          <Link className="btn-ghost" href="/products">
            Mua san pham
          </Link>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.5fr]">
          <div>
            <SectionTitle
              eyebrow="Bai viet moi"
              title="Doc tin tuc nong nghiep"
              description="Tong hop tin moi nhat ve mua vu va thi truong."
            />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {posts.length === 0 ? (
                <div className="rounded-[28px] border border-forest/10 bg-white/80 p-10 text-center text-sm text-ink/70">
                  Chua co bai viet.
                </div>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </div>
          <div className="space-y-6">
            <PostSidebar posts={posts.slice(0, 5)} />
            <div className="rounded-[28px] border border-forest/10 bg-forest p-6 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                Ban tin
              </p>
              <h3 className="mt-3 text-xl font-semibold">Nhan thong tin mua vu moi.</h3>
              <p className="mt-2 text-sm text-white/70">
                Dang ky de nhan cap nhat va uu dai.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60"
                  placeholder="Email cua ban"
                />
                <button className="h-10 rounded-full bg-sun text-sm font-semibold text-ink">
                  Dang ky
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
