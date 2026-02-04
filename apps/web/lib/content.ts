import { siteConfig } from "@/lib/site";

export type HomeBanner = {
  id: string;
  badge: string;
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
    badge: "CTCP NÔNG DƯỢC TAM BỐ",
    title: "Nông Dược Tam Bố",
    description: "Giải pháp sinh học đồng hành cùng nhà nông bền vững.",
    ctaLabel: "Khám phá sản phẩm",
    ctaHref: "/collections/all",
    desktopSrc:
      "https://as1.ftcdn.net/v2/jpg/06/28/96/60/1000_F_628966079_4cHFENaQ0ZOQLSmZpTdw9Jlyv5SlGb9d.jpg",
    mobileSrc:
      "https://as1.ftcdn.net/v2/jpg/06/28/96/60/1000_F_628966079_4cHFENaQ0ZOQLSmZpTdw9Jlyv5SlGb9d.jpg",
    alt: "Nông Dược Tam Bố",
    order: 1,
    isActive: true
  },
  {
    id: "banner-hero-2",
    badge: "CTY Cổ Phần Nông Dược Tam Bố",
    title: "Giải pháp sinh học",
    description: "Tối ưu dinh dưỡng và cải thiện năng suất canh tác.",
    ctaLabel: "Xem giải pháp",
    ctaHref: "/collections/all",
    desktopSrc:
      "https://as2.ftcdn.net/v2/jpg/06/42/64/91/1000_F_642649143_R3J5ooyUZXCrd5yovLuMI3iODQKhYc2G.jpg",
    mobileSrc:
      "https://as2.ftcdn.net/v2/jpg/06/42/64/91/1000_F_642649143_R3J5ooyUZXCrd5yovLuMI3iODQKhYc2G.jpg",
    alt: "Giải pháp sinh học Tam Bố",
    order: 2,
    isActive: true
  },
  {
    id: "banner-hero-3",
    badge: "CTY Cổ Phần Nông Dược Tam Bố",
    title: "Đồng hành cùng nhà nông",
    description: "Tư vấn kỹ thuật tại vườn và hỗ trợ vận hành 24/7.",
    ctaLabel: "Liên hệ tư vấn",
    ctaHref: "/pages/lien-he",
    desktopSrc:
      "https://as2.ftcdn.net/v2/jpg/04/03/59/47/1000_F_403594707_GWQgi5ee0QI0SnCFu1aAn5NuxD4x2xH9.jpg",
    mobileSrc:
      "https://as2.ftcdn.net/v2/jpg/04/03/59/47/1000_F_403594707_GWQgi5ee0QI0SnCFu1aAn5NuxD4x2xH9.jpg",
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
