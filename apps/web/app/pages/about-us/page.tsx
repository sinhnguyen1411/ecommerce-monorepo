import Image from "next/image";
import Link from "next/link";

import BrandLogo from "@/components/brand/BrandLogo";
import BrandSignature from "@/components/brand/BrandSignature";
import { brandMeta } from "@/lib/brand";
import { getPage } from "@/lib/api";
import { resolveAboutContent } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: `Giới thiệu | ${siteConfig.name}`,
  description: "Thông tin về công ty, năng lực cung ứng và dịch vụ tư vấn nông nghiệp."
};

export default async function AboutUsPage() {
  const page = await getPage("about-us").catch(() => null);
  const content = resolveAboutContent(page?.content);
  const phoneDigits = siteConfig.phone.replace(/[^0-9+]/g, "");
  const storyHtml = content.storyHtml?.trim() || "";

  return (
    <div className="layout-pageDetail about-page about-page--story">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="active">
                <strong>Giới thiệu</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <section className="about-story-hero">
        <div className="container">
          <div className="about-hero-grid">
            <div className="about-hero-text">
              <div className="about-story-chip">
                <BrandSignature
                  mode="about"
                  priority
                  logoSizes="56px"
                  className="about-story-chip__signature"
                  logoClassName="about-story-chip__logo"
                  titleClassName="about-story-chip__title"
                  sublineClassName="about-story-chip__subline"
                />
              </div>
              <p className="about-eyebrow">{content.hero.eyebrow}</p>
              <h1>{content.hero.title}</h1>
              <p className="about-lead">{content.hero.lead}</p>
              {content.hero.pills.length ? (
                <div className="about-hero-pills">
                  {content.hero.pills.map((pill) => (
                    <span key={pill} className="about-hero-pill">
                      {pill}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="about-hero-actions">
                {content.hero.ctaLabel ? (
                  <a className="button" href={content.hero.ctaHref || "/pages/lien-he"}>
                    {content.hero.ctaLabel}
                  </a>
                ) : null}
                {content.hero.secondaryLabel ? (
                  <a
                    className="about-hero-secondary"
                    href={content.hero.secondaryHref || "/pages/hoi-dap-cung-nha-nong"}
                  >
                    {content.hero.secondaryLabel}
                  </a>
                ) : null}
              </div>
            </div>
            <div className="about-hero-media">
              <Image
                src={content.hero.image}
                alt={content.hero.imageAlt || content.hero.title}
                fill
                priority
                sizes="(max-width: 991px) 92vw, 42vw"
              />
              <div className="about-hero-badge">
                <span>Đồng hành cùng</span>
                <strong>{brandMeta.shortName}</strong>
              </div>
              <div className="about-hero-seal" aria-hidden="true">
                <BrandLogo
                  variant="seal-master"
                  decorative
                  priority
                  sizes="(max-width: 767px) 56px, 68px"
                  className="w-14 drop-shadow-[0_10px_18px_rgba(24,32,18,0.22)] sm:w-[68px]"
                />
              </div>
            </div>
          </div>
          {content.stats.length ? (
            <div className="about-stat-grid">
              {content.stats.map((stat) => (
                <div key={stat.label} className="about-stat">
                  <p className="about-stat-value">{stat.value}</p>
                  <p className="about-stat-label">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {storyHtml ? (
        <section className="about-story-block">
          <div className="container">
            <div className="about-story-panel">
              <div className="about-story-panel__header">
                <p className="about-eyebrow">{brandMeta.storyLabel}</p>
                <h2>Hành trình xây dựng thương hiệu và năng lực đồng hành</h2>
              </div>
              <div className="about-story-panel__identity">
                <p className="about-story-panel__legal">{brandMeta.legalName}</p>
                <p className="about-story-panel__tagline">{brandMeta.tagline}</p>
              </div>
              <div className="about-story-prose" dangerouslySetInnerHTML={{ __html: storyHtml }} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="about-pillars">
        <div className="container">
          <div className="about-section-header">
            <p className="about-eyebrow">Trọng tâm</p>
            <h2>3 trụ cột phát triển</h2>
            <p className="about-section-lead">
              Tóm tắt những giá trị cốt lõi đang dẫn dắt hành trình và hệ thống sản phẩm, dịch vụ
              của chúng tôi.
            </p>
          </div>
          <div className="about-pillar-grid">
            {content.slides.slice(0, 3).map((slide, index) => {
              const tag = slide.tag?.trim() || `Trụ cột ${(index + 1).toString().padStart(2, "0")}`;
              return (
                <article key={slide.id || `${slide.title}-${index}`} className="about-pillar-card">
                  <div className="about-pillar-media">
                    <Image
                      src={slide.image}
                      alt={slide.imageAlt || slide.title}
                      fill
                      sizes="(max-width: 767px) 92vw, (max-width: 991px) 44vw, 28vw"
                    />
                    <span className="about-pillar-tag">{tag}</span>
                  </div>
                  <div className="about-pillar-body">
                    <h3>{slide.title}</h3>
                    <p>{slide.description}</p>
                    {slide.bullets?.length ? (
                      <ul className="about-pillar-bullets">
                        {slide.bullets.slice(0, 3).map((item, bulletIndex) => (
                          <li key={`${slide.id}-${bulletIndex}`}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {slide.ctaLabel ? (
                      <a className="about-pillar-cta" href={slide.ctaHref || "/pages/lien-he"}>
                        {slide.ctaLabel}
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-cta about-cta--story">
        <div className="container">
          <div className="about-cta-card">
            <div>
              <h2>{content.contact.title}</h2>
              <p>{content.contact.description}</p>
            </div>
            <div className="about-cta-actions">
              <a className="button" href={content.contact.ctaHref || "/pages/lien-he"}>
                {content.contact.ctaLabel || "Gửi yêu cầu"}
              </a>
              <a className="about-cta-link" href={`tel:${phoneDigits}`}>
                Hotline {siteConfig.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
