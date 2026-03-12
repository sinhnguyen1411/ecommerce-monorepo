"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, X } from "lucide-react";

import { PROMO_POPUP_OPEN_EVENT } from "@/lib/client-content";
import { PromoPopupSettings } from "@/lib/content";

const SESSION_KEY = "promo_popup_seen_v1";

export default function PromoPopup({ settings }: { settings: PromoPopupSettings }) {
  const [open, setOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const signature = useMemo(
    () =>
      JSON.stringify({
        title: settings.title,
        subtitle: settings.subtitle,
        imageSrc: settings.imageSrc,
        imageAlt: settings.imageAlt,
        programs: settings.programs,
        coupons: settings.coupons,
        ctaLabel: settings.ctaLabel,
        ctaHref: settings.ctaHref,
        isActive: settings.isActive,
        delaySeconds: settings.delaySeconds
      }),
    [
      settings.title,
      settings.subtitle,
      settings.imageSrc,
      settings.imageAlt,
      settings.programs,
      settings.coupons,
      settings.ctaLabel,
      settings.ctaHref,
      settings.isActive,
      settings.delaySeconds
    ]
  );

  const totalCount = useMemo(
    () => settings.programs.length + settings.coupons.length,
    [settings.programs.length, settings.coupons.length]
  );

  useEffect(() => {
    if (!settings.isActive) {
      setOpen(false);
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (open) {
      return;
    }
    const storedSignature = window.sessionStorage.getItem(SESSION_KEY);
    if (storedSignature === signature) {
      return;
    }

    const delay = Math.max(0, settings.delaySeconds || 0) * 1000;
    const timer = window.setTimeout(() => {
      setOpen(true);
      window.sessionStorage.setItem(SESSION_KEY, signature);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, settings.delaySeconds, settings.isActive, signature]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOpen = () => {
      if (!settings.isActive) {
        return;
      }
      setOpen(true);
      window.sessionStorage.setItem(SESSION_KEY, signature);
    };

    window.addEventListener(PROMO_POPUP_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(PROMO_POPUP_OPEN_EVENT, handleOpen);
    };
  }, [settings.isActive, signature]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setCopiedCode(null);
    }
  };

  if (!open || !settings.isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative z-50 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
          onClick={() => setOpen(false)}
          aria-label="Đóng popup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid gap-0 md:grid-cols-[240px_1fr]">
          <div className="relative h-56 w-full md:h-full">
            <Image
              src={settings.imageSrc}
              alt={settings.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 240px"
            />
          </div>
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">
              Ưu đãi ({totalCount})
            </p>
            <h2 className="mt-3 text-3xl font-bold text-forest md:text-4xl">
              {settings.title}
            </h2>
            <p className="mt-2 text-sm text-ink/70">{settings.subtitle}</p>

            <div className="mt-4 space-y-3 text-sm text-ink/80">
              {settings.programs.map((program, index) => (
                <div key={`${program.title}-${index}`} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-forest" />
                  <div>
                    <p className="font-semibold text-ink">{program.title}</p>
                    <p className="text-ink/70">{program.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {settings.coupons.map((coupon, index) => (
                <div
                  key={`${coupon.code}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest/15 bg-forest/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-forest">{coupon.label}</p>
                    <p className="text-xs text-ink/70">{coupon.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-dashed border-forest/40 bg-white px-3 py-1 text-xs font-semibold text-forest">
                      {coupon.code}
                    </span>
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
                      onClick={() => handleCopy(coupon.code)}
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedCode === coupon.code ? "Đã sao chép" : "Sao chép mã"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link
                href={settings.ctaHref}
                className="inline-flex items-center justify-center rounded-full bg-forest px-6 py-2 text-sm font-semibold text-white transition hover:bg-forest/90"
              >
                {settings.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
