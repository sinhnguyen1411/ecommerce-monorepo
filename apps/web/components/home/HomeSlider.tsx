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
    const nextSlides = loadHomeBanners();
    setResolvedSlides(nextSlides.length ? nextSlides : slides);
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
          {activeSlides.map((slide, index) => (
            <div key={`${slide.desktopSrc}-${index}`} className="home-slide">
              <Link href={slide.ctaHref} className="home-slide__link">
                <picture>
                  <source media="(min-width: 768px)" srcSet={slide.desktopSrc} />
                  <source media="(max-width: 767px)" srcSet={slide.mobileSrc} />
                  <img src={slide.desktopSrc} alt={slide.alt} />
                </picture>
              </Link>
              {(slide.title || slide.description || slide.ctaLabel) && (
                <div className="pointer-events-none absolute inset-0 flex items-end md:items-center">
                  <div className="mx-auto w-full max-w-5xl px-6 pb-8 md:px-10 md:pb-0">
                    <div className="pointer-events-auto max-w-lg rounded-2xl border border-white/40 bg-white/90 p-5 shadow-lg backdrop-blur sm:p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Banner nổi bật
                      </p>
                      {slide.title ? (
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                          {slide.title}
                        </h2>
                      ) : null}
                      {slide.description ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {slide.description}
                        </p>
                      ) : null}
                      {slide.ctaLabel ? (
                        <Link
                          href={slide.ctaHref}
                          className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--color-cta)] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]/40"
                        >
                          {slide.ctaLabel}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
