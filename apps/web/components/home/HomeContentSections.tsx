"use client";

import { MouseEvent, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";

import type { HomePageContent } from "@/lib/content";

import HomeSlider from "./HomeSlider";

export type HomeEditorSectionKey =
  | "banners"
  | "intro"
  | "spotlights"
  | "features"
  | "aboutTeaser";

type HomeContentSectionsProps = {
  content: HomePageContent;
  editable?: boolean;
  disableNavigation?: boolean;
  selectedSection?: HomeEditorSectionKey | null;
  selectedBannerIndex?: number | null;
  onSelectSection?: (section: HomeEditorSectionKey) => void;
  onSelectBanner?: (index: number) => void;
  lockBannerPreview?: boolean;
  onOpenEditor?: (
    section: HomeEditorSectionKey,
    index?: number,
    mode?: "content" | "media"
  ) => void;
  onBannerAdd?: () => void;
  onBannerDuplicate?: (index: number) => void;
  onBannerDelete?: (index: number) => void;
  onBannerMove?: (index: number, direction: -1 | 1) => void;
  onSpotlightAdd?: () => void;
  onSpotlightDuplicate?: (index: number) => void;
  onSpotlightDelete?: (index: number) => void;
  onSpotlightMove?: (index: number, direction: -1 | 1) => void;
};

function sectionClass(
  editable: boolean | undefined,
  selectedSection: HomeEditorSectionKey | null | undefined,
  section: HomeEditorSectionKey
) {
  if (!editable) {
    return "";
  }
  return `admin-home-canvas-section ${
    selectedSection === section ? "admin-home-canvas-section--selected" : ""
  }`;
}

function preventCanvasNavigation(
  event: MouseEvent<HTMLElement>,
  disableNavigation: boolean | undefined
) {
  if (!disableNavigation) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (!target?.closest("a")) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
}

function EditButton({
  label,
  onClick,
  testId
}: {
  label: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      data-testid={testId}
      className="inline-flex min-h-11 items-center rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
      title={label}
    >
      {label}
    </button>
  );
}

function OverlayActions({
  onAdd,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
  disableMoveUp,
  disableMoveDown,
  disableDelete,
  visible = false
}: {
  onAdd?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  disableDelete?: boolean;
  visible?: boolean;
}) {
  const visibilityClass = visible
    ? "opacity-100 pointer-events-auto"
    : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto";

  return (
    <div
      className={`absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-sm transition ${visibilityClass}`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAdd?.();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
        title="Thêm"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDuplicate?.();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
        title="Nhân bản"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={disableMoveUp}
        onClick={(event) => {
          event.stopPropagation();
          onMoveUp?.();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Đưa lên"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={disableMoveDown}
        onClick={(event) => {
          event.stopPropagation();
          onMoveDown?.();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Đưa xuống"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={disableDelete}
        onClick={(event) => {
          event.stopPropagation();
          onDelete?.();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
        title="Xóa"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function HomeContentSections({
  content,
  editable = false,
  disableNavigation = false,
  selectedSection = null,
  selectedBannerIndex = null,
  onSelectSection,
  onSelectBanner,
  lockBannerPreview = false,
  onOpenEditor,
  onBannerAdd,
  onBannerDuplicate,
  onBannerDelete,
  onBannerMove,
  onSpotlightAdd,
  onSpotlightDuplicate,
  onSpotlightDelete,
  onSpotlightMove
}: HomeContentSectionsProps) {
  const intro = content.intro;
  const aboutTeaser = content.aboutTeaser;
  const introSecondaryHref = intro.secondaryCtaHref || "/pages/about-us";
  const introSecondaryLabel = intro.secondaryCtaLabel || "Tìm hiểu thêm";
  const introPrimaryHref = intro.primaryCtaHref || intro.ctaHref || "/collections/all";
  const introPrimaryLabel = intro.primaryCtaLabel || intro.ctaLabel || "Đặt hàng ngay";

  const handleLinkClick = (event: MouseEvent<HTMLElement>) => {
    if (!disableNavigation) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const activeBanners = useMemo(
    () =>
      content.banners
        .map((item, sourceIndex) => ({ item, sourceIndex }))
        .filter(({ item }) => item.isActive !== false)
        .sort((a, b) => a.item.order - b.item.order),
    [content.banners]
  );

  const selectedActiveBannerIndex = useMemo(() => {
    if (selectedBannerIndex === null) {
      return null;
    }
    const activeIndex = activeBanners.findIndex(
      ({ sourceIndex }) => sourceIndex === selectedBannerIndex
    );
    return activeIndex >= 0 ? activeIndex : null;
  }, [activeBanners, selectedBannerIndex]);

  return (
    <>
      <section
        className={sectionClass(editable, selectedSection, "banners")}
        onClick={() => onSelectSection?.("banners")}
        onClickCapture={(event) => preventCanvasNavigation(event, disableNavigation)}
      >
        <HomeSlider
          slides={content.banners}
          disableNavigation={disableNavigation}
          activeIndex={lockBannerPreview ? selectedActiveBannerIndex ?? undefined : undefined}
          disableAutoplay={lockBannerPreview}
          lockInteraction={lockBannerPreview}
        />
        {editable ? (
          <div className="container pb-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Banner chính
              </p>
              {activeBanners.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Chưa có banner.</p>
              ) : (
                activeBanners.map(({ item: banner, sourceIndex }, index) => (
                  <div
                    key={banner.id}
                    className={`group relative mt-3 rounded-xl border p-3 transition ${
                      selectedSection === "banners" && selectedBannerIndex === sourceIndex
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-slate-200"
                    }`}
                    onClick={() => {
                      onSelectSection?.("banners");
                      onSelectBanner?.(sourceIndex);
                    }}
                  >
                    <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
                      <EditButton
                        label="Sửa banner"
                        testId={`admin-home-edit-banners-${sourceIndex}`}
                        onClick={() => {
                          onSelectSection?.("banners");
                          onSelectBanner?.(sourceIndex);
                          onOpenEditor?.("banners", sourceIndex);
                        }}
                      />
                    </div>
                    <OverlayActions
                      onAdd={onBannerAdd}
                      onDuplicate={() => onBannerDuplicate?.(sourceIndex)}
                      onMoveUp={() => onBannerMove?.(sourceIndex, -1)}
                      onMoveDown={() => onBannerMove?.(sourceIndex, 1)}
                      onDelete={() => onBannerDelete?.(sourceIndex)}
                      disableMoveUp={index === 0}
                      disableMoveDown={index === activeBanners.length - 1}
                      disableDelete={activeBanners.length <= 1}
                    />
                    <div className="pr-52 pt-12">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Banner {index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{banner.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{banner.description}</p>
                      <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {banner.ctaLabel}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`section-home-introduce ${sectionClass(editable, selectedSection, "intro")}`}
        onClick={() => onSelectSection?.("intro")}
        onClickCapture={(event) => preventCanvasNavigation(event, disableNavigation)}
      >
        <div className="container container--hero-width">
          <div className="section-title text-center">
            <span className="sub-title">{intro.eyebrow}</span>
            <h2 className="title">{intro.title}</h2>
            {editable ? (
              <div className="mt-3 flex justify-center">
                <EditButton
                  label="Sửa"
                  testId="admin-home-edit-intro"
                  onClick={() => {
                    onSelectSection?.("intro");
                    onOpenEditor?.("intro");
                  }}
                />
              </div>
            ) : null}
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
                    onClick={handleLinkClick}
                  >
                    {introSecondaryLabel}
                  </Link>
                  <Link
                    href={introPrimaryHref}
                    className="button intro-cta intro-cta--primary"
                    data-testid="home-intro-primary-cta"
                    onClick={handleLinkClick}
                  >
                    {introPrimaryLabel}
                  </Link>
                </div>
              </div>
            </div>
            <div className="intro-image">
              <div className="home-square-media intro-media">
                <Link
                  href={introPrimaryHref}
                  className="image-use-effect3 intro-media__link"
                  onClick={handleLinkClick}
                >
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

      <section
        className={`section-home-banner ${sectionClass(editable, selectedSection, "spotlights")}`}
        onClick={() => onSelectSection?.("spotlights")}
        onClickCapture={(event) => preventCanvasNavigation(event, disableNavigation)}
        data-testid="home-spotlight-section"
      >
        <div className="container">
          <div className="spotlight3d-list">
            {content.spotlights.map((spotlight, index) => {
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
                      className={`group spotlight3d-stage ${hasForeground ? "" : "spotlight3d-stage--no-foreground"}`}
                    >
                      {editable ? (
                        <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
                          <EditButton
                            label="Nội dung"
                            testId={`admin-home-edit-spotlight-content-${index}`}
                            onClick={() => {
                              onSelectSection?.("spotlights");
                              onOpenEditor?.("spotlights", index, "content");
                            }}
                          />
                          <EditButton
                            label="Ảnh"
                            testId={`admin-home-edit-spotlight-${index}`}
                            onClick={() => {
                              onSelectSection?.("spotlights");
                              onOpenEditor?.("spotlights", index, "media");
                            }}
                          />
                        </div>
                      ) : null}
                      {editable ? (
                        <OverlayActions
                          onAdd={onSpotlightAdd}
                          onDuplicate={() => onSpotlightDuplicate?.(index)}
                          onMoveUp={() => onSpotlightMove?.(index, -1)}
                          onMoveDown={() => onSpotlightMove?.(index, 1)}
                          onDelete={() => onSpotlightDelete?.(index)}
                          disableMoveUp={index === 0}
                          disableMoveDown={index === content.spotlights.length - 1}
                          disableDelete={content.spotlights.length <= 1}
                        />
                      ) : null}
                      <Link href={ctaHref} className="spotlight3d-stage__link" onClick={handleLinkClick}>
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
                        <span className="spotlight3d-stage__shape spotlight3d-stage__shape--top" aria-hidden="true" />
                        <span className="spotlight3d-stage__shape spotlight3d-stage__shape--bottom" aria-hidden="true" />
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
                        onClick={handleLinkClick}
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

      <section
        className={`section-home-feature ${sectionClass(editable, selectedSection, "features")}`}
        onClick={() => onSelectSection?.("features")}
        onClickCapture={(event) => preventCanvasNavigation(event, disableNavigation)}
      >
        <div className="container">
          <div className="feature-grid">
            {content.features.map((feature, index) => (
              <div className="feature-block" key={feature.id || `home-feature-${index + 1}`}>
                <div className="feature-block__inner image-use-effect4 group relative">
                  {editable ? (
                    <div className="absolute right-3 top-3 z-20">
                      <EditButton
                        label="Sửa"
                        testId={`admin-home-edit-feature-${index}`}
                        onClick={() => {
                          onSelectSection?.("features");
                          onOpenEditor?.("features", index);
                        }}
                      />
                    </div>
                  ) : null}
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

      <section
        className={`section-home-aboutus ${sectionClass(editable, selectedSection, "aboutTeaser")}`}
        onClick={() => onSelectSection?.("aboutTeaser")}
        onClickCapture={(event) => preventCanvasNavigation(event, disableNavigation)}
      >
        <div className="container">
          <div className="section-content">
            <div className="aboutus-hero relative">
              {editable ? (
                <div className="absolute right-5 top-5 z-20">
                  <EditButton
                    label="Sửa"
                    testId="admin-home-edit-about-teaser"
                    onClick={() => {
                      onSelectSection?.("aboutTeaser");
                      onOpenEditor?.("aboutTeaser");
                    }}
                  />
                </div>
              ) : null}
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
                    <Link
                      href={aboutTeaser.primaryCtaHref || "/pages/lien-he"}
                      className="button"
                      onClick={handleLinkClick}
                    >
                      {aboutTeaser.primaryCtaLabel || "Liên hệ đặt hàng"}
                    </Link>
                  </span>
                  <span className="link2">
                    <Link
                      href={aboutTeaser.secondaryCtaHref || "/pages/locations"}
                      className="button"
                      onClick={handleLinkClick}
                    >
                      {aboutTeaser.secondaryCtaLabel || "Tìm hiểu thêm"}
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
