import Link from "next/link";

import { Post } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function PostSidebar({ posts }: { posts: Post[] }) {
  return (
    <div className="group-sidebox">
      <div className="sidebox-title">
        <h3 className="htitle">{"B\u00E0i vi\u1EBFt m\u1EDBi nh\u1EA5t"}</h3>
      </div>
      <div className="sidebox-content sidebox-content-togged">
        <div className="list-blogs">
          {posts.map((post) => (
            <article key={post.id} className="item-article">
              <Link
                href={`/blogs/news/${post.slug}`}
                className="item-article__image"
                title={post.title}
              >
                {post.cover_image ? (
                  <img src={post.cover_image} alt={post.title} />
                ) : (
                  <div className="no-image">{"\u0110ang c\u1EADp nh\u1EADt \u1EA3nh"}</div>
                )}
              </Link>
              <div className="item-article__detail">
                <p className="title">
                  <Link className="link" href={`/blogs/news/${post.slug}`} title={post.title}>
                    {post.title}
                  </Link>
                </p>
                <p className="meta-post">{formatDate(post.published_at) || "Tin t\u1EE9c"}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
