import Link from "next/link";

import PostCard from "@/components/blog/PostCard";
import PromoPopup from "@/components/common/PromoPopup";
import HomeContentSections from "@/components/home/HomeContentSections";
import ProductGrid from "@/components/product/ProductGrid";
import { getPage, getPosts, getProducts } from "@/lib/api";
import { resolveHomePageContent } from "@/lib/content";

export const metadata = {
  title: "Nông Dược Tam Bố | Nông Dược Tam Bố",
  description: "Sản phẩm nông nghiệp, tin tức mùa vụ và góc chia sẻ của Tam Bố."
};

export default async function HomePage() {
  const [featuredProducts, posts, homePage] = await Promise.all([
    getProducts({ featured: true, limit: 8 }).catch(() => []),
    getPosts().catch(() => []),
    getPage("home").catch(() => null)
  ]);

  const homeContent = resolveHomePageContent(homePage?.content);

  return (
    <main className="mainWrapper--content home-main">
      <PromoPopup settings={homeContent.promoPopup} />

      <HomeContentSections content={homeContent} />

      <section className="section-home-collection collection-product collection-product-slide">
        <div className="container">
          <div className="section-title text-center">
            <span className="sub-title style-italic">Sản phẩm nổi bật</span>
            <h2 className="title">
              <Link href="/collections/hot-products">Sản phẩm của Tam Bố</Link>
            </h2>
          </div>
          <div className="section-content">
            <div className="collection-grid">
              <ProductGrid products={featuredProducts} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-blogs">
        <div className="container">
          <div className="section-title text-center">
            <h2 className="title">
              <Link href="/blogs/news">Bài viết mới nhất</Link>
            </h2>
          </div>
          <div className="section-content">
            <div className="home-blogs">
              {posts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

