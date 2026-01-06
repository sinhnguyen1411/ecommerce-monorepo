import Link from "next/link";

import { Post } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function PostSidebar({ posts }: { posts: Post[] }) {
  return (
    <div className="rounded-[28px] border border-forest/10 bg-white/80 p-6">
      <h3 className="text-lg font-semibold">Bai viet moi</h3>
      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="block">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
              {formatDate(post.published_at) || "Tin tuc"}
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">{post.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
