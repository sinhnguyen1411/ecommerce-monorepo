"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Slide = {
  href: string;
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
};

type HomeSliderProps = {
  slides: Slide[];
  intervalMs?: number;
};

export default function HomeSlider({ slides, intervalMs = 5000 }: HomeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  useEffect(() => {
    if (!slides.length) {
      return;
    }

    const id = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % slides.length;
        const track = trackRef.current;
        if (track) {
          track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

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
          {slides.map((slide, index) => (
            <div key={`${slide.desktopSrc}-${index}`} className="home-slide">
              <Link href={slide.href} className="home-slide__link">
                <picture>
                  <source media="(min-width: 768px)" srcSet={slide.desktopSrc} />
                  <source media="(max-width: 767px)" srcSet={slide.mobileSrc} />
                  <img src={slide.desktopSrc} alt={slide.alt} />
                </picture>
              </Link>
            </div>
          ))}
        </div>
        <div className="home-slider__pagination" aria-hidden="true">
          {slides.map((_, index) => (
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
