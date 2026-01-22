import { siteConfig } from "@/lib/site";

export type HomeBanner = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  order: number;
  isActive: boolean;
};

export const defaultHomeBanners: HomeBanner[] = [
  {
    id: "banner-hero-1",
    title: "Nông Dược Tam Bố",
    description: "Giải pháp sinh học đồng hành cùng nhà nông bền vững.",
    ctaLabel: "Khám phá sản phẩm",
    ctaHref: "/collections/all",
    desktopSrc: "/tam-bo/home/slide_1_img.svg",
    mobileSrc: "/tam-bo/home/slide_1_mb.svg",
    alt: "Nông Dược Tam Bố",
    order: 1,
    isActive: true
  },
  {
    id: "banner-hero-2",
    title: "Giải pháp sinh học",
    description: "Tối ưu dinh dưỡng và cải thiện năng suất canh tác.",
    ctaLabel: "Xem giải pháp",
    ctaHref: "/collections/all",
    desktopSrc: "/tam-bo/home/slide_2_img.svg",
    mobileSrc: "/tam-bo/home/slide_2_mb.svg",
    alt: "Giải pháp sinh học Tam Bố",
    order: 2,
    isActive: true
  },
  {
    id: "banner-hero-3",
    title: "Đồng hành cùng nhà nông",
    description: "Tư vấn kỹ thuật và hỗ trợ vận hành 24/7.",
    ctaLabel: "Liên hệ tư vấn",
    ctaHref: "/pages/lien-he",
    desktopSrc: "/tam-bo/home/slide_3_img.svg",
    mobileSrc: "/tam-bo/home/slide_3_mb.svg",
    alt: "Đồng hành cùng nhà nông",
    order: 3,
    isActive: true
  }
];

export type ContactSettings = {
  phone: string;
  fax: string;
  email: string;
  address: string;
  businessHours: string;
  mapUrl: string;
};

export const defaultContactSettings: ContactSettings = {
  phone: siteConfig.phone,
  fax: siteConfig.fax,
  email: siteConfig.email,
  address: siteConfig.address,
  businessHours: "Tất cả các ngày trong tuần",
  mapUrl: "https://www.google.com/maps?q=11.6216306,108.2261405&hl=vi&z=16&output=embed"
};
