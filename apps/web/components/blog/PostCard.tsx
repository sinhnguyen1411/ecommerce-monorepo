import Link from "next/link";

import { Post } from "@/lib/api";
import { formatDate, stripHtml } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export default function PostCard({ post }: { post: Post }) {
  const excerpt = stripHtml(post.excerpt || post.content || "").trim();

  return (
    <article className="article-loop col-lg-4 col-md-6 col-12">
      <div className="article-inner">
        <div className="article-image">
          <Link
            href={`/blogs/news/${post.slug}`}
            className="blog-post-thumbnail"
            title={post.title}
            rel="nofollow"
          >
            {post.cover_image ? (
              <img src={post.cover_image} alt={post.title} />
            ) : (
              <div className="no-image">Đang cập nhật ảnh</div>
            )}
          </Link>
        </div>
        <div className="article-detail">
          <div className="article-title">
            <h3 className="post-title">
              <Link href={`/blogs/news/${post.slug}`} title={post.title}>
                {post.title}
              </Link>
            </h3>
          </div>
          <p className="entry-content">
            {excerpt ? `${excerpt.slice(0, 160)}...` : "Đang cập nhật nội dung."}
          </p>
          <div className="article-post-meta">
            <span className="author">bởi: {siteConfig.email}</span>
            <span className="date">
              <time>{formatDate(post.published_at) || "Tin tức"}</time>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
