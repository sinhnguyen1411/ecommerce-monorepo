import type { Page } from "@playwright/test";

export const viewports = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1024", width: 1024, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 }
];

const bannerStorageKey = "admin_home_banners_v1";
const contactStorageKey = "admin_contact_settings_v1";

const demoBanners = [
  {
    id: "banner-demo-1",
    badge: "Banner nổi bật",
    title: "Nông Dược Tam Bố",
    description: "Giải pháp sinh học đồng hành cùng nhà nông bền vững.",
    ctaLabel: "Khám phá sản phẩm",
    ctaHref: "/collections/all",
    desktopSrc:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=80",
    mobileSrc:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=720&q=80",
    alt: "Nông Dược Tam Bố",
    order: 1,
    isActive: true
  }
];

const demoContactSettings = {
  phone: "0900 111 222",
  mobilePhone: "0900 111 222",
  fax: "0251 111 222",
  email: "support@tam-bo.vn",
  address: "123 Đường Nông Nghiệp, Lâm Đồng",
  businessHours: "Thứ 2 - Chủ nhật, 08:00 - 18:00",
  mapUrl: "https://www.google.com/maps?q=11.6216306,108.2261405&hl=vi&z=16&output=embed",
  facebookUrl: "https://www.facebook.com/tambo-demo",
  zaloUrl: "https://zalo.me/0900111222"
};

export const seedContentStorage = async (page: Page) => {
  await page.addInitScript(
    ({ bannerKey, contactKey, banners, contact }) => {
      window.localStorage.setItem(bannerKey, JSON.stringify(banners));
      window.localStorage.setItem(contactKey, JSON.stringify(contact));
    },
    {
      bannerKey: bannerStorageKey,
      contactKey: contactStorageKey,
      banners: demoBanners,
      contact: demoContactSettings
    }
  );
};

type AdminApiOverrides = {
  products?: typeof products;
  categories?: typeof categories;
  posts?: typeof posts;
  qna?: typeof qna;
  orders?: typeof orders;
  paymentSettings?: typeof paymentSettings;
  failPaths?: string[];
};

export const mockAdminApi = async (page: Page, overrides: AdminApiOverrides = {}) => {
  const profile = {
    id: 1,
    email: "admin@tam-bo.vn",
    name: "Quản trị viên",
    role: "ADMIN"
  };

  const categories = [
    {
      id: 1,
      name: "Hữu cơ",
      slug: "huu-co",
      description: "Nhóm sản phẩm hữu cơ",
      sort_order: 1
    }
  ];

  const products = [
    {
      id: 10,
      name: "Phân hữu cơ Tam Bố",
      slug: "phan-huu-co-tam-bo",
      description: "Mô tả ngắn",
      price: 120000,
      compare_at_price: 150000,
      featured: true,
      status: "published",
      tags: "huu-co",
      sort_order: 1,
      images: [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80",
          sort_order: 1
        }
      ],
      categories: [
        {
          id: 1,
          name: "Hữu cơ",
          slug: "huu-co"
        }
      ]
    }
  ];

  const posts = [
    {
      id: 5,
      title: "Kinh nghiệm canh tác",
      slug: "kinh-nghiem-canh-tac",
      excerpt: "Chia sẻ kinh nghiệm",
      content: "Nội dung",
      cover_image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      status: "published",
      tags: "cam-nang",
      sort_order: 1,
      published_at: "2024-06-01"
    }
  ];

  const qna = [
    {
      id: 7,
      question: "Làm sao để chọn phân bón phù hợp?",
      answer: "Đánh giá theo mùa vụ và mục tiêu năng suất.",
      status: "published",
      sort_order: 1
    }
  ];

  const orders = [
    {
      id: 20,
      order_number: "TB-0001",
      customer_name: "Nguyễn Văn A",
      email: "khach@example.com",
      phone: "0900 000 111",
      address: "45 Đường Nông Trại, Lâm Đồng",
      note: "Giao trong giờ hành chính",
      delivery_time: "Sáng",
      promo_code: "",
      shipping_method: "Giao nhanh",
      subtotal: 120000,
      shipping_fee: 20000,
      discount_total: 0,
      total: 140000,
      payment_method: "bank_transfer",
      payment_status: "pending",
      status: "pending",
      payment_proof_url: "",
      admin_note: "",
      created_at: "2024-06-01T08:00:00Z",
      items: [
        {
          product_id: 10,
          name: "Phân hữu cơ Tam Bố",
          quantity: 2,
          unit_price: 60000
        }
      ]
    }
  ];

  const paymentSettings = {
    id: 1,
    cod_enabled: true,
    bank_transfer_enabled: true,
    bank_qr_enabled: true,
    bank_name: "Vietcombank",
    bank_account: "0123456789",
    bank_holder: "Nông Dược Tam Bố",
    bank_qr_payload: "000201010212",
    bank_id: "VCB",
    bank_qr_template: "compact"
  };

  const {
    products: productData = products,
    categories: categoryData = categories,
    posts: postData = posts,
    qna: qnaData = qna,
    orders: orderData = orders,
    paymentSettings: paymentData = paymentSettings,
    failPaths = []
  } = overrides;

  await page.route("**/api/admin/**", async (route) => {
    const url = new URL(route.request().url());
    if (failPaths.includes(url.pathname)) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { message: "Không thể tải dữ liệu quản trị." }
        })
      });
      return;
    }
    let data: unknown = {};

    if (url.pathname.endsWith("/api/admin/me")) {
      data = profile;
    } else if (url.pathname.endsWith("/api/admin/products")) {
      data = productData;
    } else if (url.pathname.endsWith("/api/admin/categories")) {
      data = categoryData;
    } else if (url.pathname.endsWith("/api/admin/posts")) {
      data = postData;
    } else if (url.pathname.endsWith("/api/admin/qna")) {
      data = qnaData;
    } else if (url.pathname.endsWith("/api/admin/orders")) {
      data = orderData;
    } else if (url.pathname.endsWith("/api/admin/payment-settings")) {
      data = paymentData;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data })
    });
  });
};
