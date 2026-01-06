import Link from "next/link";
import { notFound } from "next/navigation";

import PostCard from "@/components/blog/PostCard";
import PostSidebar from "@/components/blog/PostSidebar";
import { getPost, getPosts } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Tin tuc | Nong Nghiep TTC",
  description: "Bai viet va goc chia se cua TTC."
};

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

      <section className="section-shell pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.5fr]">
          <div>
            <div className="overflow-hidden rounded-[32px] border border-forest/10 bg-white/90">
              <div className="relative h-64 bg-mist md:h-96">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                    Dang cap nhat anh
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
                    __html: post.content || "<p>Noi dung dang duoc cap nhat.</p>"
                  }}
                />
              </div>
            </div>

            <div className="mt-10">
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
                  <PostCard key={item.id} post={item} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <PostSidebar posts={posts.slice(0, 5)} />
            <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
              <h3 className="text-lg font-semibold">Lien he nhanh</h3>
              <p className="mt-3 text-sm text-ink/70">
                Can tu van ve nong san? Goi hotline de duoc ho tro.
              </p>
              <p className="mt-3 text-sm font-semibold text-forest">{siteConfig.phone}</p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
