import Link from "next/link";

import { getPosts } from "@/lib/api";
import { formatDate, stripHtml } from "@/lib/format";

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
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.length === 0 ? (
            <div className="card-surface col-span-full p-10 text-center text-sm text-ink/70">
              Chua co bai viet.
            </div>
          ) : (
            posts.map((post) => (
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
                  <h2 className="mt-3 text-xl font-semibold">{post.title}</h2>
                  <p className="mt-3 text-sm text-ink/70">
                    {stripHtml(post.excerpt).slice(0, 160) ||
                      "Chia se ve nguon nong san va mua vu."}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
