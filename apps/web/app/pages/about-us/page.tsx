import { siteConfig } from "@/lib/site";
import { getPage } from "@/lib/api";
import { resolveAboutContent } from "@/lib/content";

export const metadata = {
  title: `Giới thiệu | ${siteConfig.name}`,
  description: "Thông tin về công ty, năng lực cung ứng và dịch vụ tư vấn nông nghiệp."
};

export default async function AboutUsPage() {
  const page = await getPage("about-us").catch(() => null);
  const content = resolveAboutContent(page?.content);
  const phoneDigits = siteConfig.phone.replace(/[^0-9+]/g, "");

  return (
    <div className="layout-pageDetail about-page about-page--story">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <a href="/" target="_self">
                  Trang chủ
                </a>
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
              <p className="about-eyebrow">{content.hero.eyebrow}</p>
              <h1>{content.hero.title}</h1>
              <p className="about-lead">{content.hero.lead}</p>
              <div className="about-hero-actions">
                <a className="button" href={content.hero.ctaHref || "/pages/lien-he"}>
                  {content.hero.ctaLabel || "Liên hệ tư vấn"}
                </a>
                <a
                  className="about-ghost"
                  href={content.hero.secondaryHref || "/pages/hoi-dap-cung-nha-nong"}
                >
                  {content.hero.secondaryLabel || "Hỏi đáp kỹ thuật"}
                </a>
              </div>
              {content.hero.pills?.length ? (
                <div className="about-pill-list">
                  {content.hero.pills.map((pill) => (
                    <span key={pill} className="about-pill">
                      {pill}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="about-hero-media">
              <img
                src={content.hero.image}
                alt={content.hero.imageAlt || content.hero.title}
                loading="eager"
                decoding="async"
              />
              <div className="about-hero-badge">
                <span>Đồng hành</span>
                <strong>{siteConfig.name}</strong>
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

      <section className="about-scroll">
        <div className="container">
          <div className="about-storyline">
            {content.slides.map((slide, index) => {
              const tag = slide.tag?.trim() || `Chặng ${(index + 1).toString().padStart(2, "0")}`;
              return (
                <article
                  key={slide.id || `${slide.title}-${index}`}
                  className={`about-slide ${index % 2 === 1 ? "about-slide--reverse" : ""}`}
                >
                  <div className="about-slide-media">
                    <img
                      src={slide.image}
                      alt={slide.imageAlt || slide.title}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="about-slide-step">{tag}</span>
                    <span className="about-slide-grass" aria-hidden="true" />
                  </div>
                  <div className="about-slide-content">
                    <span className="about-slide-tag">{tag}</span>
                    <h2>{slide.title}</h2>
                    <p>{slide.description}</p>
                    {slide.bullets?.length ? (
                      <ul className="about-slide-bullets">
                        {slide.bullets.map((item, bulletIndex) => (
                          <li key={`${slide.id}-${bulletIndex}`}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="about-slide-actions">
                      <a className="button" href={slide.ctaHref || content.hero.ctaHref || "/pages/lien-he"}>
                        {slide.ctaLabel || "Liên hệ tư vấn"}
                      </a>
                      <a className="about-slide-link" href="/collections/all">
                        Xem sản phẩm
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
            {content.storyHtml ? (
              <article className="about-slide about-slide--full">
                <div className="about-slide-content">
                  <span className="about-slide-tag">Hành trình</span>
                  <h2>Hành trình & định hướng</h2>
                  <div
                    className="content-pageDetail typeList-style"
                    dangerouslySetInnerHTML={{
                      __html: content.storyHtml
                    }}
                  />
                </div>
              </article>
            ) : null}
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
