import Link from "next/link";
import { notFound } from "next/navigation";

import PostCard from "@/components/blog/PostCard";
import PostSidebar from "@/components/blog/PostSidebar";
import { getPost, getPosts } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Kiến thức nông nghiệp | Nông nghiệp TTC",
  description: "Bài viết và góc chia sẻ của TTC."
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
    <article className="blog-detail pb-16 pt-8">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li>
                <Link href="/blogs/news">Tin tức</Link>
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
                  <img src={post.cover_image} alt={post.title} />
                ) : (
                  <div className="no-image">Đang cập nhật ảnh</div>
                )}
              </div>
              <div className="article-content">
                <h1 className="article-title">{post.title}</h1>
                <div className="article-post-meta">
                  <span className="author">bởi: {siteConfig.email}</span>
                  <span className="date">
                    <time>{formatDate(post.published_at) || "Tin tức"}</time>
                  </span>
                </div>
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{
                    __html: post.content || "<p>Nội dung đang được cập nhật.</p>"
                  }}
                />
              </div>
            </div>

            <div className="related-posts">
              <div className="related-posts__head">
                <h2>Đọc thêm</h2>
                <Link href="/blogs/news" className="button btnlight">
                  Xem tất cả
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
                <p className="sidebar-title">Liên hệ nhanh</p>
                <p className="sidebar-text">
                  Cần tư vấn về nông sản? Gọi hotline để được hỗ trợ.
                </p>
                <p className="sidebar-hotline">{siteConfig.phone}</p>
              </div>
              <Link className="button btnlight" href="/collections/all">
                Mua sản phẩm
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}
