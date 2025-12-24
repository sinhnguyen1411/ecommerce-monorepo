import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buildAssetUrl, getPostBySlug } from "@/lib/directus";
import { formatDate } from "@/lib/format";

type BlogDetailPageProps = {
  params: {
    slug: string;
  };
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <section className="section-shell pb-6 pt-12">
        <Link className="text-sm text-ink/60 hover:text-ember" href="/blog">
          <- Back to journal
        </Link>
      </section>

      <section className="section-shell pb-16">
        <div className="card-surface overflow-hidden">
          <div className="relative h-64 bg-sand md:h-80">
            {post.cover_image ? (
              <Image
                src={buildAssetUrl(post.cover_image)}
                alt={post.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">
                No cover image
              </div>
            )}
          </div>
          <div className="p-8">
            <p className="pill">Journal entry</p>
            <h1 className="mt-4 text-3xl font-semibold">{post.title}</h1>
            <p className="mt-3 text-sm text-ink/60">
              {formatDate(post.published_at) || "Editorial"}
            </p>
            <div
              className="rich-content mt-6"
              dangerouslySetInnerHTML={{
                __html:
                  post.content ||
                  "<p>Write your story in Directus to populate this entry.</p>"
              }}
            />
          </div>
        </div>
      </section>
    </article>
  );
}

