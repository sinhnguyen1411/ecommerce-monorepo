import Link from "next/link";
import { notFound } from "next/navigation";

import { getPost, getPosts } from "@/lib/api";
import { formatDate, stripHtml } from "@/lib/format";

type BlogDetailPageProps = {
  params: {
    slug: string;
  };
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const [post, posts] = await Promise.all([
    getPost(params.slug).catch(() => null),
    getPosts()
  ]);

  if (!post) {
    notFound();
  }

  const related = posts.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <article>
      <section className="section-shell pb-6 pt-12">
        <Link className="text-sm text-ink/60 hover:text-clay" href="/blog">
          <- Quay lai tin tuc
        </Link>
      </section>

      <section className="section-shell pb-10">
        <div className="card-surface overflow-hidden">
          <div className="relative h-64 bg-mist md:h-80">
            {post.cover_image ? (
              <img
                src={post.cover_image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                Chua co anh
              </div>
            )}
          </div>
          <div className="p-8">
            <p className="pill">Tin tuc</p>
            <h1 className="mt-4 text-3xl font-semibold">{post.title}</h1>
            <p className="mt-3 text-sm text-ink/60">
              {formatDate(post.published_at) || "Tin tuc"}
            </p>
            <div
              className="rich-content mt-6"
              dangerouslySetInnerHTML={{
                __html:
                  post.content ||
                  "<p>Noi dung dang duoc cap nhat.</p>"
              }}
            />
          </div>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill">Bai viet lien quan</p>
            <h2 className="mt-3 text-2xl font-semibold">Doc them</h2>
          </div>
          <Link href="/blog" className="btn-ghost">
            Xem tat ca
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {related.map((item) => (
            <Link
              key={item.id}
              href={`/blog/${item.slug}`}
              className="card-surface group flex flex-col gap-4 p-6"
            >
              <div className="h-40 overflow-hidden rounded-2xl bg-mist">
                {item.cover_image ? (
                  <img
                    src={item.cover_image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-ink/50">
                    Chua co anh
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  {formatDate(item.published_at) || "Tin tuc"}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-ink/70">
                  {stripHtml(item.excerpt).slice(0, 120)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
