import Link from "next/link";

import PostCard from "@/components/blog/PostCard";
import PostSidebar from "@/components/blog/PostSidebar";
import { getPosts } from "@/lib/api";

export const metadata = {
  title: "Kiến thức nông nghiệp | Nông Dược Tam Bố",
  description: "Cập nhật tin tức mùa vụ và góc chia sẻ của Tam Bố."
};

export default async function NewsPage() {
  const posts = await getPosts();

  return (
    <section className="blog-wrapper pb-16 pt-8">
      <div className="container">
        <div className="row">
          <div className="col-lg-9 col-md-12 col-12 column-left mg-page">
            <div className="heading-page">
              <h1>Tin tức</h1>
            </div>
            <div className="row blog-posts">
              {posts.length === 0 ? (
                <div className="blog-empty">Chưa có bài viết.</div>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </div>
          <div className="col-lg-3 col-md-12 col-12 column-right mg-page">
            <aside className="sidebar-blogs blogs-sticky">
              <PostSidebar posts={posts.slice(0, 5)} />
              <div className="sidebar-box">
                <p className="sidebar-title">Bản tin</p>
                <p className="sidebar-text">Đăng ký để nhận cập nhật và ưu đãi.</p>
                <div className="sidebar-form">
                  <input className="field" placeholder="Email của bạn" />
                  <button className="button">Đăng ký</button>
                </div>
              </div>
              <Link className="button btnlight" href="/collections/all">
                Mua sản phẩm
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
