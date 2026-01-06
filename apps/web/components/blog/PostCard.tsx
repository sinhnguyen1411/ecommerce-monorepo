import Link from "next/link";

import { Post } from "@/lib/api";
import { formatDate, stripHtml } from "@/lib/format";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[28px] border border-forest/10 bg-white/80">
      <div className="aspect-[4/3] w-full overflow-hidden bg-mist">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink/50">Dang cap nhat anh</div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
          {formatDate(post.published_at) || "Tin tuc"}
        </p>
        <h3 className="text-lg font-semibold">{post.title}</h3>
        <p className="text-sm text-ink/70">{stripHtml(post.excerpt).slice(0, 120)}</p>
      </div>
    </Link>
  );
}
