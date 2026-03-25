"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { HomeBanner } from "@/lib/content";

type HomeSliderProps = {
  slides: HomeBanner[];
  intervalMs?: number;
  disableNavigation?: boolean;
  activeIndex?: number;
  disableAutoplay?: boolean;
  lockInteraction?: boolean;
};

export default function HomeSlider({
  slides,
  intervalMs = 5000,
  disableNavigation = false,
  activeIndex,
  disableAutoplay = false,
  lockInteraction = false
}: HomeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const activeSlides = useMemo(() => {
    return [...slides]
      .filter((slide) => slide.isActive !== false)
      .sort((a, b) => a.order - b.order);
  }, [slides]);

  const controlledActiveIndex =
    typeof activeIndex === "number" && activeSlides.length > 0
      ? Math.min(Math.max(activeIndex, 0), activeSlides.length - 1)
      : null;
  const isInteractionLocked = lockInteraction || controlledActiveIndex !== null;

  const scrollToSlide = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.scrollTo({ left: track.clientWidth * index, behavior });
  }, []);

  useEffect(() => {
    if (!activeSlides.length || disableAutoplay || controlledActiveIndex !== null) {
      return;
    }

    const id = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % activeSlides.length;
        scrollToSlide(next);
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [activeSlides.length, controlledActiveIndex, disableAutoplay, intervalMs, scrollToSlide]);

  useEffect(() => {
    if (controlledActiveIndex !== null) {
      setActive(controlledActiveIndex);
      scrollToSlide(controlledActiveIndex, "auto");
      return;
    }
    setActive(0);
    scrollToSlide(0, "auto");
  }, [activeSlides.length, controlledActiveIndex, scrollToSlide]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    if (controlledActiveIndex !== null) {
      const expectedLeft = track.clientWidth * controlledActiveIndex;
      if (Math.abs(track.scrollLeft - expectedLeft) > 1) {
        scrollToSlide(controlledActiveIndex, "auto");
      }
      return;
    }
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== active) {
      setActive(next);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || isInteractionLocked) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (
      !disableNavigation &&
      target?.closest("a, button, input, textarea, select, [role='button']")
    ) {
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
    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
  };

  const handleDotClick = (index: number) => {
    if (isInteractionLocked) {
      return;
    }
    scrollToSlide(index);
    setActive(index);
  };

  return (
    <section className="section-home-slider">
      <div className="home-slider">
        <div
          className={`home-slider__track ${isInteractionLocked ? "pointer-events-none" : ""}`}
          ref={trackRef}
          style={isInteractionLocked ? { overflowX: "hidden", touchAction: "none" } : undefined}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {activeSlides.map((slide, index) => {
            const ctaHref = slide.ctaHref || "/";
            const eyebrow = slide.eyebrow?.trim() || slide.badge?.trim() || "";
            return (
              <div key={`${slide.desktopSrc}-${index}`} className="home-slide">
                <Link
                  href={ctaHref}
                  className="home-slide__link"
                  onClick={(event) => {
                    if (!disableNavigation) {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
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
                        {eyebrow ? <p className="home-slider__eyebrow">{eyebrow}</p> : null}
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
                            onClick={(event) => {
                              if (!disableNavigation) {
                                return;
                              }
                              event.preventDefault();
                              event.stopPropagation();
                            }}
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
              disabled={isInteractionLocked}
              aria-label={`Chuyển đến banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
