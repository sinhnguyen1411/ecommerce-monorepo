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
    badge: "CÔNG TY CỔ PHẦN NÔNG DƯỢC TAM BỐ",
    title: "Nông Dược Tam Bố",
    description: "Giải pháp sinh học đồng hành cùng nhà nông bền vững.",
    ctaLabel: "Khám phá sản phẩm",
    ctaHref: "/collections/all",
    desktopSrc:
      "https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg",
    mobileSrc:
      "https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg",
    alt: "Nông Dược Tam Bố",
    order: 1,
    isActive: true
  },
  {
    id: "banner-hero-2",
    badge: "CÔNG TY CỔ PHẦN NÔNG DƯỢC TAM BỐ",
    title: "Giải pháp sinh học",
    description: "Tối ưu dinh dưỡng và cải thiện năng suất canh tác.",
    ctaLabel: "Xem giải pháp",
    ctaHref: "/collections/all",
    desktopSrc:
      "https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg",
    mobileSrc:
      "https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg",
    alt: "Giải pháp sinh học Tam Bố",
    order: 2,
    isActive: true
  },
  {
    id: "banner-hero-3",
    badge: "CÔNG TY CỔ PHẦN NÔNG DƯỢC TAM BỐ",
    title: "Đồng hành cùng nhà nông",
    description: "Tư vấn kỹ thuật tại vườn và hỗ trợ vận hành 24/7.",
    ctaLabel: "Liên hệ tư vấn",
    ctaHref: "/pages/lien-he",
    desktopSrc:
      "https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg",
    mobileSrc:
      "https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg",
    alt: "Đồng hành cùng nhà nông",
    order: 3,
    isActive: true
  }
];

export type ContactSettings = {
  phone: string;
  mobilePhone: string;
  fax: string;
  email: string;
  address: string;
  businessHours: string;
  mapUrl: string;
  facebookUrl: string;
  zaloUrl: string;
};

export const defaultContactSettings: ContactSettings = {
  phone: siteConfig.phone,
  mobilePhone: siteConfig.phone,
  fax: siteConfig.fax,
  email: siteConfig.email,
  address: siteConfig.address,
  businessHours: "Tất cả các ngày trong tuần",
  mapUrl: "https://www.google.com/maps?q=11.6216306,108.2261405&hl=vi&z=16&output=embed",
  facebookUrl: siteConfig.social.facebook,
  zaloUrl: siteConfig.social.zalo
};

export type AboutStat = {
  label: string;
  value: string;
};

export type AboutSlide = {
  id: string;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
};

export type AboutHero = {
  eyebrow: string;
  title: string;
  lead: string;
  image: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  pills: string[];
};

export type AboutPageContent = {
  hero: AboutHero;
  stats: AboutStat[];
  slides: AboutSlide[];
  contact: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  storyHtml?: string;
};

export const defaultAboutContent: AboutPageContent = {
  hero: {
    eyebrow: "Giới thiệu",
    title: "Nông Dược Tam Bố đồng hành cùng mùa vụ bền vững",
    lead:
      "Chúng tôi cung cấp vật tư nông nghiệp chính hãng và tư vấn kỹ thuật sát thực tế canh tác, giúp nhà vườn tối ưu năng suất và chất lượng nông sản theo từng mùa vụ.",
    image:
      "https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg",
    imageAlt: "Nhà vườn chăm sóc cây trồng tại nông trại",
    ctaLabel: "Liên hệ tư vấn",
    ctaHref: "/pages/lien-he",
    secondaryLabel: "Hỏi đáp kỹ thuật",
    secondaryHref: "/pages/hoi-dap-cung-nha-nong",
    pills: ["Nguồn gốc rõ ràng", "Tư vấn tại vườn", "Theo sát mùa vụ"]
  },
  stats: [
    { value: "15+ năm", label: "Kinh nghiệm đồng hành nhà vườn" },
    { value: "3.000+", label: "Hộ nông tin chọn" },
    { value: "120+", label: "Danh mục sản phẩm sinh học" }
  ],
  slides: [
    {
      id: "about-slide-1",
      tag: "Chặng 01",
      title: "Khảo sát vườn và đánh giá thổ nhưỡng",
      description:
        "Đội ngũ kỹ thuật khảo sát thực địa, xác định nhu cầu dinh dưỡng và rủi ro sâu bệnh theo mùa vụ.",
      bullets: ["Đo độ pH và cấu trúc đất", "Phân tích nhu cầu dưỡng chất", "Lập kế hoạch chăm sóc theo mùa"],
      image:
        "https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg",
      imageAlt: "Khảo sát vườn và đánh giá mùa vụ",
      ctaLabel: "Đặt lịch khảo sát",
      ctaHref: "/pages/lien-he"
    },
    {
      id: "about-slide-2",
      tag: "Chặng 02",
      title: "Tối ưu dinh dưỡng và phòng trừ sinh học",
      description:
        "Chúng tôi xây dựng giải pháp dinh dưỡng cân bằng, ưu tiên sinh học để giảm chi phí và bảo vệ môi trường.",
      bullets: ["Lựa chọn phân bón phù hợp", "Giải pháp phòng trừ an toàn", "Theo dõi hiệu quả sau sử dụng"],
      image:
        "https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg",
      imageAlt: "Giải pháp dinh dưỡng và phòng trừ",
      ctaLabel: "Nhận giải pháp",
      ctaHref: "/pages/lien-he"
    },
    {
      id: "about-slide-3",
      tag: "Chặng 03",
      title: "Theo dõi sau bán hàng và tư vấn liên tục",
      description:
        "Kỹ thuật viên luôn cập nhật tình hình vườn, hỗ trợ xử lý nhanh khi có biến động thời tiết hay sâu bệnh.",
      bullets: ["Tư vấn trực tuyến 24/7", "Cập nhật lịch chăm sóc định kỳ", "Hỗ trợ tận nơi khi cần"],
      image:
        "https://images.pexels.com/photos/19455179/pexels-photo-19455179.jpeg?cs=srgb&dl=pexels-julian-cabrera-s-3685809-19455179.jpg&fm=jpg",
      imageAlt: "Theo dõi vườn và tư vấn liên tục",
      ctaLabel: "Kết nối chuyên gia",
      ctaHref: "/pages/lien-he"
    },
    {
      id: "about-slide-4",
      tag: "Chặng 04",
      title: "Phát triển bền vững và tăng giá trị nông sản",
      description:
        "Định hướng dài hạn giúp nhà vườn nâng cao chất lượng, duy trì năng suất ổn định và nâng cao giá trị nông sản.",
      bullets: ["Giảm chi phí đầu vào", "Gia tăng chất lượng thu hoạch", "Tư vấn chiến lược mùa vụ dài hạn"],
      image:
        "https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg",
      imageAlt: "Nông sản bền vững và giá trị cao",
      ctaLabel: "Liên hệ tư vấn",
      ctaHref: "/pages/lien-he"
    }
  ],
  contact: {
    title: "Kết nối cùng đội ngũ Nông Dược Tam Bố",
    description:
      "Hãy để chúng tôi đồng hành cùng nhà vườn trong từng mùa vụ với giải pháp phù hợp và đội ngũ kỹ thuật tận tâm.",
    ctaLabel: "Gửi yêu cầu",
    ctaHref: "/pages/lien-he"
  },
  storyHtml:
    `<p><strong>Công ty Cổ phần Nông Dược Tam Bố</strong> cung cấp vật tư nông nghiệp chính hãng và dịch vụ tư vấn kỹ thuật canh tác cho nhà vườn tại khu vực Di Linh - Lâm Đồng.</p>` +
    `<p>Chúng tôi đồng hành cùng bà con từ khâu lựa chọn giống, giải pháp dinh dưỡng, đến quy trình chăm sóc tối ưu năng suất và chất lượng nông sản theo từng mùa vụ.</p>` +
    `<h3>Hướng đi của chúng tôi</h3>` +
    `<ul>` +
    `<li>Tập trung vào danh mục sản phẩm có nguồn gốc rõ ràng, chất lượng ổn định.</li>` +
    `<li>Tư vấn dựa trên thực tế canh tác tại địa phương.</li>` +
    `<li>Hỗ trợ kỹ thuật trong suốt vòng đời cây trồng.</li>` +
    `</ul>`
};

export function parseAboutContent(raw?: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AboutPageContent;
    if (parsed && typeof parsed === "object" && "hero" in parsed && "slides" in parsed) {
      return parsed;
    }
  } catch (err) {
    void err;
  }
  return null;
}

export function cloneAboutContent(content: AboutPageContent): AboutPageContent {
  return {
    hero: { ...content.hero, pills: [...content.hero.pills] },
    stats: content.stats.map((item) => ({ ...item })),
    slides: content.slides.map((slide) => ({ ...slide, bullets: [...slide.bullets] })),
    contact: { ...content.contact },
    storyHtml: content.storyHtml || ""
  };
}

export function resolveAboutContent(raw?: string | null): AboutPageContent {
  const fallback = cloneAboutContent(defaultAboutContent);
  const parsed = parseAboutContent(raw);
  if (!parsed) {
    if (raw) {
      fallback.storyHtml = raw;
    }
    return fallback;
  }

  const hero = { ...fallback.hero, ...parsed.hero };
  hero.pills = Array.isArray(parsed.hero?.pills) ? parsed.hero.pills : fallback.hero.pills;

  return {
    hero,
    stats: Array.isArray(parsed.stats) && parsed.stats.length ? parsed.stats : fallback.stats,
    slides: Array.isArray(parsed.slides) && parsed.slides.length ? parsed.slides : fallback.slides,
    contact: { ...fallback.contact, ...parsed.contact },
    storyHtml: parsed.storyHtml || fallback.storyHtml
  };
}



export type PromoProgram = {
  title: string;
  description: string;
};

export type PromoCoupon = {
  label: string;
  code: string;
  description: string;
};

export type PromoPopupSettings = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  programs: PromoProgram[];
  coupons: PromoCoupon[];
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  delaySeconds: number;
};

export const defaultPromoPopupSettings: PromoPopupSettings = {
  title: "ORGANIC MASTER",
  subtitle: "Liên hệ ngay với chúng tôi",
  imageSrc:
    "https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?cs=srgb&dl=pexels-reneasmussen-1459339.jpg&fm=jpg",
  imageAlt: "Cây cà phê và trái cà phê",
  programs: [
    {
      title: "Ưu đãi freeship 100%",
      description: "Nhanh tay đặt hàng để nhận miễn phí vận chuyển."
    },
    {
      title: "Mua 3 tặng 1",
      description: "Áp dụng cho các dòng Organic Master 1L."
    }
  ],
  coupons: [
    {
      label: "Giảm 60%",
      code: "FREESHIPTTC",
      description: "Áp dụng cho đơn hàng từ 1.000.000đ"
    },
    {
      label: "Giảm 10%",
      code: "TAMBO10",
      description: "Cho khách hàng mới đặt hàng lần đầu"
    }
  ],
  ctaLabel: "Liên hệ tư vấn",
  ctaHref: "/pages/lien-he",
  isActive: true,
  delaySeconds: 5
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  isActive: boolean;
};

export type NotificationSettings = {
  items: NotificationItem[];
};

export const defaultNotificationSettings: NotificationSettings = {
  items: [
    {
      id: "notify-freeship",
      title: "Freeship toàn quốc",
      description: "Miễn phí vận chuyển cho đơn hàng đủ điều kiện.",
      href: "/collections/all",
      isActive: true
    },
    {
      id: "notify-sale",
      title: "Sản phẩm đang sale mạnh",
      description: "Khám phá ngay các sản phẩm ưu đãi hot.",
      href: "/collections/hot-products",
      isActive: true
    },
    {
      id: "notify-support",
      title: "Tư vấn kỹ thuật 24/7",
      description: "Liên hệ để được hỗ trợ nhanh chóng từ chuyên gia.",
      href: "/pages/lien-he",
      isActive: true
    }
  ]
};
