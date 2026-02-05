"use client";

import { useEffect, useState } from "react";

import {
  ContactSettings,
  HomeBanner,
  NotificationSettings,
  PromoPopupSettings,
  defaultContactSettings,
  defaultHomeBanners,
  defaultNotificationSettings,
  defaultPromoPopupSettings
} from "@/lib/content";
import { fixMojibake } from "@/lib/format";

export const HOME_BANNERS_STORAGE_KEY = "admin_home_banners_v2";
export const CONTACT_SETTINGS_STORAGE_KEY = "admin_contact_settings_v1";
export const PROMO_POPUP_STORAGE_KEY = "admin_promo_popup_v1";
export const NOTIFICATION_SETTINGS_STORAGE_KEY = "admin_notifications_v1";
export const PROMO_POPUP_OPEN_EVENT = "promo-popup-open";

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

function sanitizeOptional(value: string): string;
function sanitizeOptional(value: string | null | undefined): string | null | undefined;
function sanitizeOptional(value: string | null | undefined) {
  return typeof value === "string" ? fixMojibake(value) : value;
}

const sanitizeHomeBanners = (input: HomeBanner[] | null) => {
  if (!Array.isArray(input)) {
    return { value: input, changed: false };
  }

  let changed = false;
  const next = input.map((banner) => {
    if (!banner || typeof banner !== "object") {
      return banner;
    }
    const updated: HomeBanner = { ...banner };
    const fields: (keyof HomeBanner)[] = [
      "id",
      "badge",
      "title",
      "description",
      "ctaLabel",
      "ctaHref",
      "desktopSrc",
      "mobileSrc",
      "alt"
    ];

    for (const field of fields) {
      const current = banner[field];
      if (typeof current === "string") {
        const fixed = fixMojibake(current);
        if (fixed !== current) {
          updated[field] = fixed;
          changed = true;
        }
      }
    }

    return updated;
  });

  return { value: next, changed };
};

const sanitizeContactSettings = (input: ContactSettings | null) => {
  if (!input) {
    return { value: input, changed: false };
  }

  let changed = false;
  const next: ContactSettings = { ...input };
  const fields: (keyof ContactSettings)[] = [
    "phone",
    "mobilePhone",
    "fax",
    "email",
    "address",
    "businessHours",
    "mapUrl",
    "facebookUrl",
    "zaloUrl"
  ];

  for (const field of fields) {
    const current = input[field];
    if (typeof current === "string") {
      const fixed = fixMojibake(current);
      if (fixed !== current) {
        next[field] = fixed;
        changed = true;
      }
    }
  }

  return { value: next, changed };
};

const sanitizePromoPopupSettings = (input: PromoPopupSettings | null) => {
  if (!input) {
    return { value: input, changed: false };
  }

  let changed = false;
  const next: PromoPopupSettings = {
    ...input,
    title: sanitizeOptional(input.title),
    subtitle: sanitizeOptional(input.subtitle),
    imageSrc: sanitizeOptional(input.imageSrc),
    imageAlt: sanitizeOptional(input.imageAlt),
    ctaLabel: sanitizeOptional(input.ctaLabel),
    ctaHref: sanitizeOptional(input.ctaHref),
    programs: Array.isArray(input.programs)
      ? input.programs.map((item) => ({
          title: sanitizeOptional(item?.title) || "",
          description: sanitizeOptional(item?.description) || ""
        }))
      : [],
    coupons: Array.isArray(input.coupons)
      ? input.coupons.map((item) => ({
          label: sanitizeOptional(item?.label) || "",
          code: sanitizeOptional(item?.code) || "",
          description: sanitizeOptional(item?.description) || ""
        }))
      : []
  };

  if (
    next.title !== input.title ||
    next.subtitle !== input.subtitle ||
    next.imageSrc !== input.imageSrc ||
    next.imageAlt !== input.imageAlt ||
    next.ctaLabel !== input.ctaLabel ||
    next.ctaHref !== input.ctaHref
  ) {
    changed = true;
  }

  if (Array.isArray(input.programs)) {
    input.programs.forEach((item, index) => {
      const nextItem = next.programs[index];
      if (!nextItem) return;
      if (nextItem.title !== item?.title || nextItem.description !== item?.description) {
        changed = true;
      }
    });
  }

  if (Array.isArray(input.coupons)) {
    input.coupons.forEach((item, index) => {
      const nextItem = next.coupons[index];
      if (!nextItem) return;
      if (
        nextItem.label !== item?.label ||
        nextItem.code !== item?.code ||
        nextItem.description !== item?.description
      ) {
        changed = true;
      }
    });
  }

  return { value: next, changed };
};

const sanitizeNotificationSettings = (input: NotificationSettings | null) => {
  if (!input || !Array.isArray(input.items)) {
    return { value: input, changed: false };
  }

  let changed = false;
  const items = input.items.map((item) => ({
    ...item,
    id: sanitizeOptional(item?.id) || "",
    title: sanitizeOptional(item?.title) || "",
    description: sanitizeOptional(item?.description) || "",
    href: sanitizeOptional(item?.href) || ""
  }));

  input.items.forEach((item, index) => {
    const nextItem = items[index];
    if (!nextItem) return;
    if (
      nextItem.id !== item?.id ||
      nextItem.title !== item?.title ||
      nextItem.description !== item?.description ||
      nextItem.href !== item?.href
    ) {
      changed = true;
    }
  });

  return { value: { ...input, items }, changed };
};

const normalizeHomeBanners = (input: HomeBanner[] | null): HomeBanner[] => {
  if (!Array.isArray(input) || input.length === 0) {
    return [...defaultHomeBanners];
  }

  return input.map((banner, index) => {
    const fallback = defaultHomeBanners[index] || defaultHomeBanners[0];
    const order = Number.isFinite(banner.order) ? Number(banner.order) : index + 1;
    return {
      id: banner.id || `banner-${order}`,
      badge: banner.badge || fallback?.badge || "Banner nổi bật",
      title: banner.title || fallback?.title || "Banner",
      description: banner.description || fallback?.description || "",
      ctaLabel: banner.ctaLabel || fallback?.ctaLabel || "Xem chi tiết",
      ctaHref: banner.ctaHref || fallback?.ctaHref || "/",
      desktopSrc: banner.desktopSrc || fallback?.desktopSrc || "",
      mobileSrc: banner.mobileSrc || banner.desktopSrc || fallback?.mobileSrc || "",
      alt: banner.alt || banner.title || fallback?.alt || "Banner",
      order,
      isActive: banner.isActive !== false
    };
  });
};

const normalizeContactSettings = (input: ContactSettings | null): ContactSettings => {
  if (!input) {
    return { ...defaultContactSettings };
  }
  return {
    ...defaultContactSettings,
    ...input
  };
};

const normalizePromoPopupSettings = (
  input: PromoPopupSettings | null
): PromoPopupSettings => {
  if (!input) {
    return {
      ...defaultPromoPopupSettings,
      programs: [...defaultPromoPopupSettings.programs],
      coupons: [...defaultPromoPopupSettings.coupons]
    };
  }

  const programs = Array.isArray(input.programs) && input.programs.length > 0
    ? input.programs
    : defaultPromoPopupSettings.programs;
  const coupons = Array.isArray(input.coupons) && input.coupons.length > 0
    ? input.coupons
    : defaultPromoPopupSettings.coupons;
  const oldPromoImage =
    "https://images.pexels.com/photos/7464636/pexels-photo-7464636.jpeg?cs=srgb&dl=pexels-rdne-7464636.jpg&fm=jpg";
  const delaySeconds = Number.isFinite(input.delaySeconds)
    ? Math.max(0, Number(input.delaySeconds))
    : defaultPromoPopupSettings.delaySeconds;

  return {
    ...defaultPromoPopupSettings,
    ...input,
    title: input.title || defaultPromoPopupSettings.title,
    subtitle: input.subtitle || defaultPromoPopupSettings.subtitle,
    imageSrc: input.imageSrc === oldPromoImage ? defaultPromoPopupSettings.imageSrc : input.imageSrc || defaultPromoPopupSettings.imageSrc,
    imageAlt: input.imageAlt || defaultPromoPopupSettings.imageAlt,
    ctaLabel: input.ctaLabel || defaultPromoPopupSettings.ctaLabel,
    ctaHref: input.ctaHref || defaultPromoPopupSettings.ctaHref,
    programs: programs.map((item) => ({
      title: item?.title || "Ưu đãi",
      description: item?.description || ""
    })),
    coupons: coupons.map((item) => ({
      label: item?.label || "Mã ưu đãi",
      code: item?.code || "",
      description: item?.description || ""
    })),
    delaySeconds,
    isActive: input.isActive !== false
  };
};

const normalizeNotificationSettings = (
  input: NotificationSettings | null
): NotificationSettings => {
  if (!input || !Array.isArray(input.items)) {
    return {
      ...defaultNotificationSettings,
      items: [...defaultNotificationSettings.items]
    };
  }

  if (input.items.length === 0) {
    return { items: [] };
  }

  return {
    items: input.items.map((item, index) => ({
      id: item?.id || `notify-${index + 1}`,
      title: item?.title || "Thông báo mới",
      description: item?.description || "",
      href: item?.href || "/",
      isActive: item?.isActive !== false
    }))
  };
};

export const loadHomeBanners = (): HomeBanner[] => {
  if (typeof window === "undefined") {
    return [...defaultHomeBanners];
  }
  const stored = parseJson<HomeBanner[]>(
    window.localStorage.getItem(HOME_BANNERS_STORAGE_KEY)
  );
  const { value: sanitized, changed } = sanitizeHomeBanners(stored);
  if (changed && Array.isArray(sanitized)) {
    window.localStorage.setItem(
      HOME_BANNERS_STORAGE_KEY,
      JSON.stringify(sanitized)
    );
  }
  return normalizeHomeBanners(sanitized);
};

export const saveHomeBanners = (banners: HomeBanner[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HOME_BANNERS_STORAGE_KEY, JSON.stringify(banners));
};

export const loadContactSettings = (): ContactSettings => {
  if (typeof window === "undefined") {
    return { ...defaultContactSettings };
  }
  const stored = parseJson<ContactSettings>(
    window.localStorage.getItem(CONTACT_SETTINGS_STORAGE_KEY)
  );
  const { value: sanitized, changed } = sanitizeContactSettings(stored);
  if (changed && sanitized) {
    window.localStorage.setItem(
      CONTACT_SETTINGS_STORAGE_KEY,
      JSON.stringify(sanitized)
    );
  }
  return normalizeContactSettings(sanitized);
};

export const saveContactSettings = (settings: ContactSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CONTACT_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings)
  );
};

export const loadPromoPopupSettings = (): PromoPopupSettings => {
  if (typeof window === "undefined") {
    return {
      ...defaultPromoPopupSettings,
      programs: [...defaultPromoPopupSettings.programs],
      coupons: [...defaultPromoPopupSettings.coupons]
    };
  }
  const stored = parseJson<PromoPopupSettings>(
    window.localStorage.getItem(PROMO_POPUP_STORAGE_KEY)
  );
  const { value: sanitized, changed } = sanitizePromoPopupSettings(stored);
  if (changed && sanitized) {
    window.localStorage.setItem(
      PROMO_POPUP_STORAGE_KEY,
      JSON.stringify(sanitized)
    );
  }
  return normalizePromoPopupSettings(sanitized);
};

export const loadNotificationSettings = (): NotificationSettings => {
  if (typeof window === "undefined") {
    return {
      ...defaultNotificationSettings,
      items: [...defaultNotificationSettings.items]
    };
  }
  const stored = parseJson<NotificationSettings>(
    window.localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY)
  );
  const { value: sanitized, changed } = sanitizeNotificationSettings(stored);
  if (changed && sanitized) {
    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_STORAGE_KEY,
      JSON.stringify(sanitized)
    );
  }
  return normalizeNotificationSettings(sanitized);
};

export const savePromoPopupSettings = (settings: PromoPopupSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PROMO_POPUP_STORAGE_KEY,
    JSON.stringify(settings)
  );
  window.dispatchEvent(new Event("promo-popup-updated"));
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    NOTIFICATION_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings)
  );
  window.dispatchEvent(new Event("notification-settings-updated"));
};

export const usePromoPopupSettings = () => {
  const [settings, setSettings] = useState<PromoPopupSettings>(() => {
    if (typeof window === "undefined") {
      return {
        ...defaultPromoPopupSettings,
        programs: [...defaultPromoPopupSettings.programs],
        coupons: [...defaultPromoPopupSettings.coupons]
      };
    }
    return loadPromoPopupSettings();
  });

  useEffect(() => {
    setSettings(loadPromoPopupSettings());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(loadPromoPopupSettings());
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("promo-popup-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("promo-popup-updated", handleUpdate);
    };
  }, []);

  return settings;
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window === "undefined") {
      return {
        ...defaultNotificationSettings,
        items: [...defaultNotificationSettings.items]
      };
    }
    return loadNotificationSettings();
  });

  useEffect(() => {
    setSettings(loadNotificationSettings());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(loadNotificationSettings());
    };
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("notification-settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("notification-settings-updated", handleUpdate);
    };
  }, []);

  return settings;
};

export const useHomeBanners = () => {
  const [banners, setBanners] = useState<HomeBanner[]>([...defaultHomeBanners]);

  useEffect(() => {
    setBanners(loadHomeBanners());
  }, []);

  return banners;
};

export const useContactSettings = () => {
  const [settings, setSettings] = useState<ContactSettings>({
    ...defaultContactSettings
  });

  useEffect(() => {
    setSettings(loadContactSettings());
  }, []);

  return settings;
};
