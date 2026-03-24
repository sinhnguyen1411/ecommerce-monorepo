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
    title: "Hành trình nông nghiệp bền vững cùng Nông Dược Tam Bố",
    lead:
      "Chúng tôi xây dựng giải pháp sinh học và dịch vụ tư vấn sát thực tế canh tác, giúp nhà vườn tối ưu năng suất và chất lượng theo từng mùa vụ.",
    image:
      "https://images.pexels.com/photos/30717830/pexels-photo-30717830.jpeg?cs=srgb&dl=pexels-1500mcoffee-30717830.jpg&fm=jpg",
    imageAlt: "Nhà vườn chăm sóc cây trồng tại nông trại",
    ctaLabel: "Liên hệ tư vấn",
    ctaHref: "/pages/lien-he",
    secondaryLabel: "Hỏi đáp kỹ thuật",
    secondaryHref: "/pages/hoi-dap-cung-nha-nong",
    pills: ["Chính hãng rõ nguồn gốc", "Tư vấn tại vườn", "Theo sát mùa vụ"]
  },
  stats: [
    { value: "15+ năm", label: "Đồng hành cùng nhà nông" },
    { value: "3.000+ hộ", label: "Nhà vườn tin chọn" },
    { value: "20+ điểm", label: "Hệ thống cửa hàng" }
  ],
  slides: [
    {
      id: "about-slide-1",
      tag: "Lịch sử",
      title: "Lịch sử hình thành",
      description:
        "Khởi đầu từ nhu cầu thực tế của nhà vườn, Tam Bố từng bước mở rộng đội ngũ và danh mục giải pháp sinh học.",
      bullets: [
        "Khởi nguồn từ nông hộ địa phương",
        "Mở rộng đội ngũ kỹ thuật thực địa",
        "Chuẩn hóa danh mục sản phẩm"
      ],
      image:
        "https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg",
      imageAlt: "Hành trình phát triển cùng nhà vườn",
      ctaLabel: "",
      ctaHref: ""
    },
    {
      id: "about-slide-2",
      tag: "Tầm nhìn & Sứ mệnh",
      title: "Tầm nhìn & sứ mệnh",
      description:
        "Kiên định với nông nghiệp bền vững, tối ưu năng suất đi cùng bảo vệ đất và hệ sinh thái canh tác.",
      bullets: [
        "Ưu tiên giải pháp sinh học an toàn",
        "Đồng hành kỹ thuật dài hạn",
        "Nâng giá trị nông sản cho nhà vườn"
      ],
      image:
        "https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?cs=srgb&dl=pexels-vi-t-anh-nguy-n-2150409023-31231189.jpg&fm=jpg",
      imageAlt: "Tầm nhìn bền vững và sứ mệnh đồng hành",
      ctaLabel: "",
      ctaHref: ""
    },
    {
      id: "about-slide-3",
      tag: "Hệ thống cửa hàng",
      title: "Hệ thống cửa hàng",
      description:
        "Mạng lưới điểm nhận hàng và tư vấn giúp bà con tiếp cận sản phẩm nhanh chóng, thuận tiện.",
      bullets: [
        "Tư vấn tại cửa hàng",
        "Hỗ trợ chọn giải pháp phù hợp",
        "Kết nối giao hàng nhanh"
      ],
      image:
        "https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg",
      imageAlt: "Hệ thống cửa hàng và điểm nhận hàng",
      ctaLabel: "Xem hệ thống cửa hàng",
      ctaHref: "/pages/locations"
    }
  ],
  contact: {
    title: "Kết nối cùng đội ngũ Nông Dược Tam Bố",
    description:
      "Gửi nhu cầu của bạn để được tư vấn nhanh, giải pháp phù hợp và hỗ trợ kỹ thuật theo mùa vụ.",
    ctaLabel: "Gửi yêu cầu",
    ctaHref: "/pages/lien-he"
  },
  storyHtml:
    `<p><strong>Công ty Cổ phần Nông Dược Tam Bố</strong> được thành lập với mục tiêu mang giải pháp sinh học và tư vấn kỹ thuật sát thực tế canh tác.</p>` +
    `<p>Chúng tôi phát triển theo hướng bền vững, chú trọng chất lượng sản phẩm và dịch vụ đồng hành dài hạn.</p>` +
    `<ul>` +
    `<li>Danh mục sản phẩm có nguồn gốc rõ ràng, ổn định.</li>` +
    `<li>Đội ngũ kỹ thuật hỗ trợ tận vườn theo mùa vụ.</li>` +
    `<li>Hệ thống cửa hàng giúp bà con tiếp cận nhanh.</li>` +
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

export type HomeIntroSection = {
  eyebrow: string;
  title: string;
  headline: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  imageSrc: string;
  imageAlt: string;
};

export type HomeSpotlightBlock = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  foregroundImageSrc?: string;
  foregroundImageAlt?: string;
  /** @deprecated Accent overlay text is no longer authored in admin/storefront. */
  accentText?: string;
};

export type HomeFeatureBlock = {
  id: string;
  title: string;
  description: string;
};

export type HomeAboutTeaser = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type HomePageContent = {
  banners: HomeBanner[];
  intro: HomeIntroSection;
  spotlights: HomeSpotlightBlock[];
  features: HomeFeatureBlock[];
  aboutTeaser: HomeAboutTeaser;
  promoPopup: PromoPopupSettings;
  notifications: NotificationSettings;
};

export const defaultHomePageContent: HomePageContent = {
  banners: [...defaultHomeBanners],
  intro: {
    eyebrow: "Định hướng phát triển sản phẩm",
    title: "Nông Dược Tam Bố",
    headline: "Giải pháp cho tương lai thông minh",
    description:
      "Nông Dược Tam Bố tự hào là đơn vị tiên phong trong việc xây dựng nền nông nghiệp xanh với giải pháp cho tương lai thông minh, bền vững. Với sứ mệnh đồng hành cùng nhà nông, Tam Bố không ngừng nghiên cứu và phát triển các dòng sản phẩm thân thiện với môi trường như phân bón hữu cơ, chế phẩm sinh học và giải pháp xử lý đất trồng an toàn. Chúng tôi hiểu rằng để phát triển lâu dài, nông nghiệp phải đi đôi với bảo vệ tài nguyên thiên nhiên, cải thiện chất lượng đất, nước và hệ sinh thái canh tác. Định hướng của Nông Dược Tam Bố là ứng dụng công nghệ cao vào sản xuất, tối ưu năng suất mà vẫn đảm bảo an toàn cho sức khỏe người tiêu dùng. Các sản phẩm như phân bón sinh học, chế phẩm xử lý tuyến trùng của Tam Bố không chỉ giúp cây trồng sinh trưởng mạnh mẽ mà còn góp phần giảm thiểu tác động tiêu cực đến môi trường. Chúng tôi cam kết mang đến cho bà con giải pháp canh tác hiệu quả, chi phí hợp lý và lợi ích lâu dài. Với Nông Dược Tam Bố, phát triển nông nghiệp xanh không chỉ là mục tiêu mà còn là trách nhiệm đối với thế hệ tương lai. Cùng Tam Bố, vun đắp nền nông nghiệp bền vững từ hôm nay!",
    ctaLabel: "Đặt hàng ngay",
    ctaHref: "/collections/all",
    primaryCtaLabel: "Đặt hàng ngay",
    primaryCtaHref: "/collections/all",
    secondaryCtaLabel: "Tìm hiểu thêm",
    secondaryCtaHref: "/pages/about-us",
    imageSrc:
      "https://images.pexels.com/photos/19000373/pexels-photo-19000373.jpeg?cs=srgb&dl=pexels-abdulkayum97-19000373.jpg&fm=jpg",
    imageAlt: "Nông Dược Tam Bố"
  },
  spotlights: [
    {
      id: "home-spotlight-1",
      title: "ORGANIC MASTER",
      description:
        "Phân bón hữu cơ Organic Master là giải pháp đột phá cho nông nghiệp xanh bền vững. Sản phẩm có hàm lượng OM 60%, Axit Fulvic 36% và Amino Acid 26,5%, nhập khẩu trực tiếp từ Nhật Bản. Organic Master giúp cải tạo đất bạc màu, phục hồi cây suy yếu, tăng năng suất cây trồng đến 40%. Sản phẩm nuôi dưỡng đất và cây trồng theo mô hình hữu cơ, an toàn, thân thiện môi trường và phát triển lâu dài.",
      bullets: [
        "Hàm lượng chất hữu cơ (OM): 60% + Giúp cải tạo đất, tăng độ tơi xốp, phục hồi đất bạc màu.",
        "Hàm lượng Axit Fulvic: 36% + Hỗ trợ cây hấp thụ dưỡng chất nhanh, mạnh rễ, bung đất.",
        "Hàm lượng Amino Acid: 26,5% + Tăng cường sức đề kháng cho cây, dưỡng xanh lá, dày trái, giúp phục hồi cây suy yếu."
      ],
      ctaLabel: "Xem chi tiết",
      ctaHref: "/collections/all",
      imageSrc:
        "https://images.pexels.com/photos/19455179/pexels-photo-19455179.jpeg?cs=srgb&dl=pexels-julian-cabrera-s-3685809-19455179.jpg&fm=jpg",
      imageAlt: "Organic Master",
      foregroundImageSrc: "",
      foregroundImageAlt: "Organic Master foreground"
    },
    {
      id: "home-spotlight-2",
      title: "MICROBIAL",
      description:
        "Chế phẩm vi sinh Microbial là sản phẩm sinh học tiên tiến được nghiên cứu và sản xuất với thành phần chính gồm chủng vi sinh Bacillus (SP1), kết hợp các chất thảo mộc, enzyme, tinh dầu quế, hợp chất protein lên men và chất bám dính đặc biệt. Nhờ sự kết hợp này, chế phẩm có khả năng tiêu diệt tuyến trùng, sâu bệnh và côn trùng gây hại như ruồi vàng, sên, rệp một cách mạnh mẽ, hiệu quả cao và kéo dài. Không chỉ tác động phòng trừ dịch hại, Microbial còn giúp phân giải xenlulo, tạo điều kiện lý tưởng cho sự phát triển của rễ cây, cải thiện môi trường đất, cân bằng độ pH và tăng khả năng hấp thu dinh dưỡng cho cây trồng. Sản phẩm đặc biệt phù hợp cho các loại cây công nghiệp (tiêu, cà phê), cây ăn trái (cam, quýt, bưởi) và rau màu. Với ưu điểm an toàn, thân thiện môi trường và hiệu quả vượt trội, chế phẩm vi sinh Microbial là giải pháp sinh học bền vững cho nhà nông hiện đại.",
      bullets: [
        "Tiêu diệt và ngăn chặn tuyến trùng hiệu quả",
        "Cân bằng độ pH và cải tạo đất",
        "Duy trì hệ vi sinh vật có lợi trong đất"
      ],
      ctaLabel: "Xem chi tiết",
      ctaHref: "/collections/all",
      imageSrc:
        "https://images.pexels.com/photos/9816769/pexels-photo-9816769.jpeg?cs=srgb&dl=pexels-brianjiz-9816769.jpg&fm=jpg",
      imageAlt: "Microbial",
      foregroundImageSrc: "",
      foregroundImageAlt: "Microbial foreground"
    }
  ],
  features: [
    {
      id: "home-feature-1",
      title: "FREESHIP TOÀN QUỐC",
      description:
        "Nông Dược Tam Bố miễn phí vận chuyển toàn quốc cho các sản phẩm như phân bón, chai xử lý tuyến trùng, hỗ trợ giao hàng nhanh chóng, đảm bảo chất lượng đến tận tay khách hàng."
    },
    {
      id: "home-feature-2",
      title: "TĂNG NĂNG SUẤT VƯỢT TRỘI",
      description:
        "Sản phẩm của Nông Dược Tam Bố giúp tăng năng suất cây trồng vượt trội, cải thiện chất lượng nông sản, tối ưu chi phí đầu tư và mang lại hiệu quả kinh tế bền vững cho nhà nông."
    },
    {
      id: "home-feature-3",
      title: "HỖ TRỢ 24/7",
      description:
        "Nông Dược Tam Bố cam kết hỗ trợ 24/7 cho khách hàng, tư vấn nhanh chóng về phân bón, chai xử lý tuyến trùng và các sản phẩm nông nghiệp chất lượng cao."
    }
  ],
  aboutTeaser: {
    eyebrow: "Nông Dược Tam Bố",
    title: "Nông nghiệp hữu cơ bền vững",
    subtitle: "Giải pháp cho tương lai thông minh",
    primaryCtaLabel: "Liên hệ đặt hàng",
    primaryCtaHref: "/pages/lien-he",
    secondaryCtaLabel: "Tìm hiểu thêm",
    secondaryCtaHref: "/pages/locations"
  },
  promoPopup: {
    ...defaultPromoPopupSettings,
    programs: [...defaultPromoPopupSettings.programs],
    coupons: [...defaultPromoPopupSettings.coupons]
  },
  notifications: {
    items: [...defaultNotificationSettings.items]
  }
};

export function cloneHomePageContent(content: HomePageContent): HomePageContent {
  return {
    banners: content.banners.map((item) => ({ ...item })),
    intro: { ...content.intro },
    spotlights: content.spotlights.map((item) => ({
      ...item,
      bullets: [...item.bullets]
    })),
    features: content.features.map((item) => ({ ...item })),
    aboutTeaser: { ...content.aboutTeaser },
    promoPopup: {
      ...content.promoPopup,
      programs: content.promoPopup.programs.map((item) => ({ ...item })),
      coupons: content.promoPopup.coupons.map((item) => ({ ...item }))
    },
    notifications: {
      items: content.notifications.items.map((item) => ({ ...item }))
    }
  };
}

export function parseHomePageContent(raw?: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<HomePageContent>;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    void err;
  }
  return null;
}

const normalizeHomeBannerList = (input: unknown, fallback: HomeBanner[]) => {
  if (!Array.isArray(input) || input.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }
  return input.map((item, index) => {
    const base = fallback[index] || fallback[fallback.length - 1] || fallback[0];
    const source = item && typeof item === "object" ? (item as Partial<HomeBanner>) : {};
    const orderValue = Number(source.order);
    return {
      id: source.id || `home-banner-${index + 1}`,
      badge: typeof source.badge === "string" ? source.badge : base.badge,
      title: typeof source.title === "string" ? source.title : base.title,
      description:
        typeof source.description === "string" ? source.description : base.description,
      ctaLabel: typeof source.ctaLabel === "string" ? source.ctaLabel : base.ctaLabel,
      ctaHref: typeof source.ctaHref === "string" ? source.ctaHref : base.ctaHref,
      desktopSrc:
        typeof source.desktopSrc === "string" ? source.desktopSrc : base.desktopSrc,
      mobileSrc:
        typeof source.mobileSrc === "string"
          ? source.mobileSrc
          : typeof source.desktopSrc === "string"
            ? source.desktopSrc
            : base.mobileSrc,
      alt: typeof source.alt === "string" ? source.alt : base.alt,
      order: Number.isFinite(orderValue) && orderValue > 0 ? orderValue : index + 1,
      isActive: source.isActive !== false
    };
  });
};

const normalizePromoPopup = (input: unknown, fallback: PromoPopupSettings) => {
  const source = input && typeof input === "object"
    ? (input as Partial<PromoPopupSettings>)
    : {};

  const programs = Array.isArray(source.programs) && source.programs.length
    ? source.programs
    : fallback.programs;
  const coupons = Array.isArray(source.coupons) && source.coupons.length
    ? source.coupons
    : fallback.coupons;
  const delaySeconds = Number(source.delaySeconds);

  return {
    ...fallback,
    ...source,
    title: typeof source.title === "string" ? source.title : fallback.title,
    subtitle: typeof source.subtitle === "string" ? source.subtitle : fallback.subtitle,
    imageSrc: typeof source.imageSrc === "string" ? source.imageSrc : fallback.imageSrc,
    imageAlt: typeof source.imageAlt === "string" ? source.imageAlt : fallback.imageAlt,
    ctaLabel: typeof source.ctaLabel === "string" ? source.ctaLabel : fallback.ctaLabel,
    ctaHref: typeof source.ctaHref === "string" ? source.ctaHref : fallback.ctaHref,
    programs: programs.map((item, index) => ({
      title:
        typeof item?.title === "string"
          ? item.title
          : fallback.programs[index]?.title || "Ưu đãi",
      description:
        typeof item?.description === "string"
          ? item.description
          : fallback.programs[index]?.description || ""
    })),
    coupons: coupons.map((item, index) => ({
      label:
        typeof item?.label === "string"
          ? item.label
          : fallback.coupons[index]?.label || "Mã ưu đãi",
      code:
        typeof item?.code === "string" ? item.code : fallback.coupons[index]?.code || "",
      description:
        typeof item?.description === "string"
          ? item.description
          : fallback.coupons[index]?.description || ""
    })),
    delaySeconds: Number.isFinite(delaySeconds) && delaySeconds >= 0 ? delaySeconds : fallback.delaySeconds,
    isActive: source.isActive !== false
  };
};

const normalizeNotifications = (input: unknown, fallback: NotificationSettings) => {
  const source = input && typeof input === "object"
    ? (input as Partial<NotificationSettings>)
    : {};
  const items = Array.isArray(source.items) ? source.items : fallback.items;
  return {
    items: items.map((item, index) => ({
      id: typeof item?.id === "string" ? item.id : `notify-${index + 1}`,
      title:
        typeof item?.title === "string"
          ? item.title
          : fallback.items[index]?.title || "Thông báo",
      description:
        typeof item?.description === "string"
          ? item.description
          : fallback.items[index]?.description || "",
      href: typeof item?.href === "string" ? item.href : fallback.items[index]?.href || "/",
      isActive: item?.isActive !== false
    }))
  };
};

const normalizeIntro = (input: unknown, fallback: HomeIntroSection): HomeIntroSection => {
  const source = input && typeof input === "object"
    ? (input as Partial<HomeIntroSection> & { ctaLabel?: string; ctaHref?: string })
    : {};
  const legacyCtaLabel =
    typeof source.ctaLabel === "string" ? source.ctaLabel : fallback.primaryCtaLabel;
  const legacyCtaHref =
    typeof source.ctaHref === "string" ? source.ctaHref : fallback.primaryCtaHref;
  return {
    eyebrow: typeof source.eyebrow === "string" ? source.eyebrow : fallback.eyebrow,
    title: typeof source.title === "string" ? source.title : fallback.title,
    headline: typeof source.headline === "string" ? source.headline : fallback.headline,
    description:
      typeof source.description === "string" ? source.description : fallback.description,
    ctaLabel: legacyCtaLabel,
    ctaHref: legacyCtaHref,
    primaryCtaLabel:
      typeof source.primaryCtaLabel === "string" ? source.primaryCtaLabel : legacyCtaLabel,
    primaryCtaHref:
      typeof source.primaryCtaHref === "string" ? source.primaryCtaHref : legacyCtaHref,
    secondaryCtaLabel:
      typeof source.secondaryCtaLabel === "string"
        ? source.secondaryCtaLabel
        : fallback.secondaryCtaLabel,
    secondaryCtaHref:
      typeof source.secondaryCtaHref === "string"
        ? source.secondaryCtaHref
        : fallback.secondaryCtaHref,
    imageSrc: typeof source.imageSrc === "string" ? source.imageSrc : fallback.imageSrc,
    imageAlt: typeof source.imageAlt === "string" ? source.imageAlt : fallback.imageAlt
  };
};

const normalizeSpotlights = (input: unknown, fallback: HomeSpotlightBlock[]) => {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const next = source.map((item, index) => {
    const base = fallback[index] || fallback[fallback.length - 1];
    const current = item && typeof item === "object"
      ? (item as Partial<HomeSpotlightBlock>)
      : {};
    const legacy = current as Partial<HomeSpotlightBlock> & {
      CTALabel?: string;
      CTAHref?: string;
    };
    return {
      id: typeof current.id === "string" ? current.id : base.id,
      title: typeof current.title === "string" ? current.title : base.title,
      description:
        typeof current.description === "string" ? current.description : base.description,
      bullets:
        Array.isArray(current.bullets) && current.bullets.length
          ? current.bullets.filter((value): value is string => typeof value === "string")
          : [...base.bullets],
      ctaLabel:
        typeof current.ctaLabel === "string"
          ? current.ctaLabel
          : typeof legacy.CTALabel === "string"
            ? legacy.CTALabel
            : base.ctaLabel,
      ctaHref:
        typeof current.ctaHref === "string"
          ? current.ctaHref
          : typeof legacy.CTAHref === "string"
            ? legacy.CTAHref
            : base.ctaHref,
      imageSrc: typeof current.imageSrc === "string" ? current.imageSrc : base.imageSrc,
      imageAlt: typeof current.imageAlt === "string" ? current.imageAlt : base.imageAlt,
      foregroundImageSrc:
        typeof current.foregroundImageSrc === "string"
          ? current.foregroundImageSrc
          : typeof base.foregroundImageSrc === "string"
            ? base.foregroundImageSrc
            : "",
      foregroundImageAlt:
        typeof current.foregroundImageAlt === "string"
          ? current.foregroundImageAlt
          : typeof base.foregroundImageAlt === "string"
            ? base.foregroundImageAlt
            : ""
    };
  });
  return next.length ? next : fallback.map((item) => ({ ...item, bullets: [...item.bullets] }));
};

const normalizeFeatures = (input: unknown, fallback: HomeFeatureBlock[]) => {
  const source = Array.isArray(input) ? input : fallback;
  const next = source.slice(0, 3).map((item, index) => {
    const base = fallback[index] || fallback[fallback.length - 1];
    const current = item && typeof item === "object"
      ? (item as Partial<HomeFeatureBlock>)
      : {};
    return {
      id: typeof current.id === "string" ? current.id : base.id,
      title: typeof current.title === "string" ? current.title : base.title,
      description:
        typeof current.description === "string" ? current.description : base.description
    };
  });
  while (next.length < 3) {
    next.push({ ...fallback[next.length] });
  }
  return next;
};

const normalizeAboutTeaser = (input: unknown, fallback: HomeAboutTeaser): HomeAboutTeaser => {
  const source = input && typeof input === "object"
    ? (input as Partial<HomeAboutTeaser>)
    : {};
  return {
    eyebrow: typeof source.eyebrow === "string" ? source.eyebrow : fallback.eyebrow,
    title: typeof source.title === "string" ? source.title : fallback.title,
    subtitle: typeof source.subtitle === "string" ? source.subtitle : fallback.subtitle,
    primaryCtaLabel:
      typeof source.primaryCtaLabel === "string"
        ? source.primaryCtaLabel
        : fallback.primaryCtaLabel,
    primaryCtaHref:
      typeof source.primaryCtaHref === "string"
        ? source.primaryCtaHref
        : fallback.primaryCtaHref,
    secondaryCtaLabel:
      typeof source.secondaryCtaLabel === "string"
        ? source.secondaryCtaLabel
        : fallback.secondaryCtaLabel,
    secondaryCtaHref:
      typeof source.secondaryCtaHref === "string"
        ? source.secondaryCtaHref
        : fallback.secondaryCtaHref
  };
};

export function resolveHomePageContent(
  raw?: string | null | Partial<HomePageContent>
): HomePageContent {
  const fallback = cloneHomePageContent(defaultHomePageContent);
  const parsed =
    typeof raw === "string" || typeof raw === "undefined" || raw === null
      ? parseHomePageContent(raw)
      : raw;
  if (!parsed) {
    return fallback;
  }

  return {
    banners: normalizeHomeBannerList(parsed.banners, fallback.banners),
    intro: normalizeIntro(parsed.intro, fallback.intro),
    spotlights: normalizeSpotlights(parsed.spotlights, fallback.spotlights),
    features: normalizeFeatures(parsed.features, fallback.features),
    aboutTeaser: normalizeAboutTeaser(parsed.aboutTeaser, fallback.aboutTeaser),
    promoPopup: normalizePromoPopup(parsed.promoPopup, fallback.promoPopup),
    notifications: normalizeNotifications(parsed.notifications, fallback.notifications)
  };
}
