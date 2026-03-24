import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import PostCard from "@/components/blog/PostCard";
import PostSidebar from "@/components/blog/PostSidebar";
import { getPost, getPosts } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Tin t\u1EE9c - Khoa h\u1ECDc n\u00F4ng nghi\u1EC7p | N\u00F4ng D\u01B0\u1EE3c Tam B\u1ED1",
  description: "B\u00E0i vi\u1EBFt v\u00E0 g\u00F3c chia s\u1EBB c\u1EE7a Tam B\u1ED1."
};

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([
    getPost(slug).catch(() => null),
    getPosts()
  ]);

  if (!post) {
    notFound();
  }

  const related = posts.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <article className="blog-detail pb-16 pt-8">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">{"Trang ch\u1EE7"}</Link>
              </li>
              <li>
                <Link href="/blogs/news">{"Tin t\u1EE9c"}</Link>
              </li>
              <li className="active">
                <span>
                  <strong>{post.title}</strong>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-lg-9 col-md-12 col-12 column-left mg-page">
            <div className="article-detail">
              <div className="article-image">
                {post.cover_image ? (
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    width={1200}
                    height={675}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 100vw, 900px"
                  />
                ) : (
                  <div className="no-image">{"\u0110ang c\u1EADp nh\u1EADt \u1EA3nh"}</div>
                )}
              </div>
              <div className="article-content">
                <h1 className="article-title">{post.title}</h1>
                <div className="article-post-meta">
                  <span className="author">{"b\u1EDFi: "}{siteConfig.email}</span>
                  <span className="date">
                    <time>{formatDate(post.published_at) || "Tin t\u1EE9c"}</time>
                  </span>
                </div>
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{
                    __html: post.content || "<p>N\u1ED9i dung \u0111ang \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt.</p>"
                  }}
                />
              </div>
            </div>

            <div className="related-posts">
              <div className="related-posts__head">
                <h2>{"Xem th\u00EAm"}</h2>
                <Link href="/blogs/news" className="button btnlight">
                  {"Xem t\u1EA5t c\u1EA3"}
                </Link>
              </div>
              <div className="row blog-posts">
                {related.map((item) => (
                  <PostCard key={item.id} post={item} />
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-12 col-12 column-right mg-page">
            <aside className="sidebar-blogs blogs-sticky">
              <PostSidebar posts={posts.slice(0, 5)} />
              <div className="sidebar-box">
                <p className="sidebar-title">{"Li\u00EAn h\u1EC7 nhanh"}</p>
                <p className="sidebar-text">
                  {"C\u1EA7n t\u01B0 v\u1EA5n v\u1EC1 n\u00F4ng s\u1EA3n? G\u1ECDi hotline \u0111\u1EC3 \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3."}
                </p>
                <p className="sidebar-hotline">{siteConfig.phone}</p>
              </div>
              <Link className="button btnlight" href="/collections/all">
                {"Mua s\u1EA3n ph\u1EA9m"}
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}
