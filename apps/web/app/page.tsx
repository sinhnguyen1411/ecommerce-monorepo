import Link from "next/link";
import Image from "next/image";

import PostCard from "@/components/blog/PostCard";
import PromoPopup from "@/components/common/PromoPopup";
import HomeSlider from "@/components/home/HomeSlider";
import ProductGrid from "@/components/product/ProductGrid";
import { getPage, getPosts, getProducts } from "@/lib/api";
import { resolveHomePageContent } from "@/lib/content";

export const metadata = {
  title: "Nông Dược Tam Bố | Nông Dược Tam Bố",
  description: "Sản phẩm nông nghiệp, tin tức mùa vụ và góc chia sẻ của Tam Bố."
};

const renderFeatureIcon = (index: number) => {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-label="Freeship toàn quốc">
        <path d="M3 16V6h11v10" />
        <path d="M14 10h4l3 3v3h-3" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-label="Tăng năng suất vượt trội">
        <path d="M3 17l6-6 4 4 7-7" />
        <path d="M14 8h6v6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Hỗ trợ 24/7">
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13v5a2 2 0 0 0 2 2h2v-6H6" />
      <path d="M20 13v5a2 2 0 0 1-2 2h-2v-6h2" />
    </svg>
  );
};

export default async function HomePage() {
  const [featuredProducts, posts, homePage] = await Promise.all([
    getProducts({ featured: true, limit: 8 }).catch(() => []),
    getPosts().catch(() => []),
    getPage("home").catch(() => null)
  ]);

  const homeContent = resolveHomePageContent(homePage?.content);
  const intro = homeContent.intro;
  const aboutTeaser = homeContent.aboutTeaser;
  const introSecondaryHref = intro.secondaryCtaHref || "/pages/about-us";
  const introSecondaryLabel = intro.secondaryCtaLabel || "Tìm hiểu thêm";
  const introPrimaryHref = intro.primaryCtaHref || intro.ctaHref || "/collections/all";
  const introPrimaryLabel = intro.primaryCtaLabel || intro.ctaLabel || "Đặt hàng ngay";

  return (
    <main className="mainWrapper--content home-main">
      <PromoPopup settings={homeContent.promoPopup} />
      <HomeSlider slides={homeContent.banners} />

      <section className="section-home-introduce">
        <div className="container container--hero-width">
          <div className="section-title text-center">
            <span className="sub-title">{intro.eyebrow}</span>
            <h2 className="title">{intro.title}</h2>
          </div>
          <div className="intro-grid">
            <div className="intro-content">
              <div className="block-introduce home-square-card">
                <div className="block-introduce__eyebrow">{intro.eyebrow}</div>
                <div className="block-introduce__title">{intro.headline}</div>
                <div className="block-introduce__desc">{intro.description}</div>
                <div className="block-introduce__link">
                  <Link
                    href={introSecondaryHref}
                    className="button intro-cta intro-cta--secondary"
                    data-testid="home-intro-secondary-cta"
                  >
                    {introSecondaryLabel}
                  </Link>
                  <Link
                    href={introPrimaryHref}
                    className="button intro-cta intro-cta--primary"
                    data-testid="home-intro-primary-cta"
                  >
                    {introPrimaryLabel}
                  </Link>
                </div>
              </div>
            </div>
            <div className="intro-image">
              <div className="home-square-media intro-media">
                <Link href={introPrimaryHref} className="image-use-effect3 intro-media__link">
                  <Image
                    src={intro.imageSrc}
                    alt={intro.imageAlt || intro.title}
                    width={640}
                    height={520}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 90vw, 520px"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-home-banner" data-testid="home-spotlight-section">
        <div className="container">
          <div className="spotlight3d-list">
            {homeContent.spotlights.map((spotlight, index) => {
              const isReverse = index % 2 === 1;
              const hasForeground = Boolean(spotlight.foregroundImageSrc?.trim());
              const ctaHref = spotlight.ctaHref || "/collections/all";

              return (
                <div
                  key={spotlight.id || `home-spotlight-${index + 1}`}
                  className={`spotlight3d-item ${isReverse ? "is-reverse" : ""}`}
                  data-testid={`home-spotlight-${index}`}
                >
                  <div className="spotlight3d-item__media" data-testid={`home-spotlight-media-${index}`}>
                    <div
                      className={`spotlight3d-stage ${hasForeground ? "" : "spotlight3d-stage--no-foreground"}`}
                    >
                      <Link href={ctaHref} className="spotlight3d-stage__link">
                        <Image
                          src={spotlight.imageSrc}
                          alt={spotlight.imageAlt || spotlight.title}
                          width={760}
                          height={640}
                          className="spotlight3d-stage__bg"
                          sizes="(max-width: 767px) 94vw, (max-width: 1023px) 88vw, 46vw"
                        />
                        <span className="spotlight3d-stage__veil" aria-hidden="true" />
                        <span className="spotlight3d-stage__grain" aria-hidden="true" />
                        <span
                          className="spotlight3d-stage__shape spotlight3d-stage__shape--top"
                          aria-hidden="true"
                        />
                        <span
                          className="spotlight3d-stage__shape spotlight3d-stage__shape--bottom"
                          aria-hidden="true"
                        />
                        {hasForeground ? (
                          <span className="spotlight3d-stage__foreground" aria-hidden="true">
                            <Image
                              src={spotlight.foregroundImageSrc || ""}
                              alt={spotlight.foregroundImageAlt || spotlight.title}
                              width={520}
                              height={620}
                              className="spotlight3d-stage__foreground-image"
                              sizes="(max-width: 767px) 64vw, (max-width: 1023px) 48vw, 30vw"
                            />
                          </span>
                        ) : null}
                      </Link>
                    </div>
                  </div>

                  <div className="spotlight3d-item__content" data-testid={`home-spotlight-content-${index}`}>
                    <article className="spotlight3d-card">
                      <div className="spotlight3d-card__body">
                        <h3 className="spotlight3d-card__title">{spotlight.title}</h3>
                        <p className="spotlight3d-card__text">{spotlight.description}</p>
                        {spotlight.bullets.length ? (
                          <div className="spotlight3d-card__benefits">
                            <p className="spotlight3d-card__label">Hiệu quả nổi bật</p>
                            <ul className="spotlight3d-card__chips">
                              {spotlight.bullets.slice(0, 3).map((item, bulletIndex) => (
                                <li key={`${spotlight.id}-bullet-${bulletIndex}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                      <Link
                        href={ctaHref}
                        className="button spotlight3d-card__cta"
                        data-testid={`home-spotlight-cta-${index}`}
                      >
                        {spotlight.ctaLabel || "Xem chi tiết"}
                      </Link>
                    </article>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-home-feature">
        <div className="container">
          <div className="feature-grid">
            {homeContent.features.map((feature, index) => (
              <div className="feature-block" key={feature.id || `home-feature-${index + 1}`}>
                <div className="feature-block__inner image-use-effect4">
                  <div className="feature-block__img">
                    <div className="feature-block__icon" aria-hidden="true">
                      {renderFeatureIcon(index)}
                    </div>
                  </div>
                  <div className="feature-block__title">
                    <h4>{feature.title}</h4>
                  </div>
                  <div className="feature-block__content">
                    <p>{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="section-home-aboutus">
        <div className="container">
          <div className="section-content">
            <div className="aboutus-hero">
              <div className="aboutus-hero__decor aboutus-hero__leaf" aria-hidden="true">
                <svg viewBox="0 0 120 120" role="img">
                  <path
                    d="M20 80C20 40 58 18 96 20c2 38-18 76-58 76-6 0-12-1-18-4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="aboutus-hero__decor aboutus-hero__arrow" aria-hidden="true">
                <svg viewBox="0 0 120 120" role="img">
                  <path
                    d="M20 92l48-48 14 14 18-18v52H48l18-18-14-14-32 32z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="aboutus-block text-center">
                <div className="aboutus-block__text">
                  <h4>{aboutTeaser.eyebrow}</h4>
                  <h3>{aboutTeaser.title}</h3>
                  <p>{aboutTeaser.subtitle}</p>
                </div>
                <div className="aboutus-block__link">
                  <span className="link1">
                    <Link href={aboutTeaser.primaryCtaHref || "/pages/lien-he"} className="button">
                      {aboutTeaser.primaryCtaLabel || "Liên hệ đặt hàng"}
                    </Link>
                  </span>
                  <span className="link2">
                    <Link href={aboutTeaser.secondaryCtaHref || "/pages/locations"} className="button">
                      {aboutTeaser.secondaryCtaLabel || "Tìm hiểu thêm"}
                    </Link>
                  </span>
                </div>
              </div>
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


