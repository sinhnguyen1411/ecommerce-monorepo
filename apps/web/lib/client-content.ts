"use client";

import { useEffect, useState } from "react";

import {
  ContactSettings,
  HomeBanner,
  defaultContactSettings,
  defaultHomeBanners
} from "@/lib/content";

export const HOME_BANNERS_STORAGE_KEY = "admin_home_banners_v1";
export const CONTACT_SETTINGS_STORAGE_KEY = "admin_contact_settings_v1";

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const normalizeHomeBanners = (input: HomeBanner[] | null): HomeBanner[] => {
  if (!Array.isArray(input) || input.length === 0) {
    return [...defaultHomeBanners];
  }

  return input.map((banner, index) => {
    const order = Number.isFinite(banner.order) ? Number(banner.order) : index + 1;
    return {
      id: banner.id || `banner-${order}`,
      title: banner.title || "Banner",
      description: banner.description || "",
      ctaLabel: banner.ctaLabel || "Xem chi tiết",
      ctaHref: banner.ctaHref || "/",
      desktopSrc: banner.desktopSrc || defaultHomeBanners[0]?.desktopSrc || "",
      mobileSrc: banner.mobileSrc || banner.desktopSrc || defaultHomeBanners[0]?.mobileSrc || "",
      alt: banner.alt || banner.title || "Banner",
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

export const loadHomeBanners = (): HomeBanner[] => {
  if (typeof window === "undefined") {
    return [...defaultHomeBanners];
  }
  const stored = parseJson<HomeBanner[]>(
    window.localStorage.getItem(HOME_BANNERS_STORAGE_KEY)
  );
  return normalizeHomeBanners(stored);
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
  return normalizeContactSettings(stored);
};

export const saveContactSettings = (settings: ContactSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CONTACT_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings)
  );
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
