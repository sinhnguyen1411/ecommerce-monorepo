"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { loadHomeBanners } from "@/lib/client-content";
import type { HomeBanner } from "@/lib/content";

type HomeSliderProps = {
  slides: HomeBanner[];
  intervalMs?: number;
};

export default function HomeSlider({ slides, intervalMs = 5000 }: HomeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [resolvedSlides, setResolvedSlides] = useState<HomeBanner[]>(slides);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const syncSlides = () => {
      const nextSlides = loadHomeBanners();
      setResolvedSlides(nextSlides.length ? nextSlides : slides);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncSlides();
      }
    };

    syncSlides();
    window.addEventListener("storage", syncSlides);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", syncSlides);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [slides]);

  const activeSlides = useMemo(() => {
    const source = resolvedSlides.length ? resolvedSlides : slides;
    return [...source]
      .filter((slide) => slide.isActive !== false)
      .sort((a, b) => a.order - b.order);
  }, [resolvedSlides, slides]);

  useEffect(() => {
    if (!activeSlides.length) {
      return;
    }

    const id = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % activeSlides.length;
        const track = trackRef.current;
        if (track) {
          track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [activeSlides.length, intervalMs]);

  useEffect(() => {
    setActive(0);
    const track = trackRef.current;
    if (track) {
      track.scrollTo({ left: 0 });
    }
  }, [activeSlides.length]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== active) {
      setActive(next);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest("a, button, input, textarea, select, [role='button']")) {
      return;
    }
    isDragging.current = true;
    dragStartX.current = event.clientX;
    dragScrollLeft.current = track.scrollLeft;
    track.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !isDragging.current) {
      return;
    }
    const delta = event.clientX - dragStartX.current;
    track.scrollLeft = dragScrollLeft.current - delta;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    isDragging.current = false;
    track.releasePointerCapture(event.pointerId);
  };

  const handleDotClick = (index: number) => {
    const track = trackRef.current;
    if (track) {
      track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
    }
    setActive(index);
  };

  return (
    <section className="section-home-slider">
      <div className="home-slider">
        <div
          className="home-slider__track"
          ref={trackRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {activeSlides.map((slide, index) => {
            const label = slide.ctaLabel?.toLowerCase() || "";
            const normalizedLabel = label
              .normalize("NFD")
              .replace(/\p{Diacritic}/gu, "");
            const rawHref = slide.ctaHref || "";
            const isHero3 = slide.id === "banner-hero-3";
            const isContactLabel =
              normalizedLabel.includes("lien he") ||
              normalizedLabel.includes("lienhe");
            const isContactHref = rawHref.includes("lien-he");
            const ctaHref =
              isHero3 || isContactLabel || isContactHref
                ? "/pages/lien-he"
                : rawHref || "/";
            return (
              <div key={`${slide.desktopSrc}-${index}`} className="home-slide">
                <Link href={ctaHref} className="home-slide__link">
                  <picture>
                    <source media="(min-width: 768px)" srcSet={slide.desktopSrc} />
                    <source media="(max-width: 767px)" srcSet={slide.mobileSrc} />
                    <img src={slide.desktopSrc} alt={slide.alt} />
                  </picture>
                </Link>
                {(slide.title || slide.description || slide.ctaLabel || slide.badge) && (
                  <div className="pointer-events-none absolute inset-0 flex items-end md:items-center">
                    <div className="mx-auto w-full max-w-5xl px-6 pb-8 md:px-10 md:pb-0">
                      <div className="home-slider__card pointer-events-auto max-w-lg p-5 sm:p-6">
                        {slide.badge ? (
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                            {slide.badge}
                          </p>
                        ) : null}
                        {slide.title ? (
                          <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                            {slide.title}
                          </h2>
                        ) : null}
                        {slide.description ? (
                          <p className="mt-2 text-sm text-slate-700">
                            {slide.description}
                          </p>
                        ) : null}
                        {slide.ctaLabel ? (
                          <Link
                            href={ctaHref}
                            className="home-slider__cta mt-4 inline-flex items-center justify-center rounded-full bg-[var(--color-cta)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]/40"
                          >
                            {slide.ctaLabel}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="home-slider__pagination" aria-hidden="true">
          {activeSlides.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              className={index === active ? "is-active" : undefined}
              onClick={() => handleDotClick(index)}
              aria-label={`Chuyển đến banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
