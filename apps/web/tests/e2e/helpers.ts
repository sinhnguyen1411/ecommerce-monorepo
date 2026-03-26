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
    eyebrow: "TAM BO AGRICULTURAL PHARMACEUTICALS JSC",
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

type MockAdminRecord = Record<string, unknown>;

type MockAdminOrder = MockAdminRecord & {
  id: number;
};

type MockAdminPage = MockAdminRecord & {
  id: number;
  title: string;
  slug: string;
  content: string;
  draft_content?: string;
  updated_at: string;
};

type MockDashboardMap = {
  [key: string]: MockDashboardResponse;
  day: MockDashboardResponse;
  month: MockDashboardResponse;
  year: MockDashboardResponse;
};

type MockDashboardPoint = {
  key: string;
  label: string;
  orders: number;
  paid_revenue: number;
  pageviews: number;
  unique_visitors: number;
};

type MockDashboardResponse = {
  grain: "day" | "month" | "year";
  range_label: string;
  summary: {
    orders: number;
    paid_revenue: number;
    average_order_value: number;
    pageviews: number;
    unique_visitors: number;
  };
  series: MockDashboardPoint[];
  order_status_totals: Array<{ status: string; count: number }>;
  payment_status_totals: Array<{ status: string; count: number }>;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  recent_orders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    payment_status: string;
    created_at: string;
  }>;
};

type AdminApiOverrides = {
  products?: MockAdminRecord[];
  categories?: MockAdminRecord[];
  posts?: MockAdminRecord[];
  qna?: MockAdminRecord[];
  orders?: MockAdminOrder[];
  pages?: MockAdminPage[];
  paymentSettings?: MockAdminRecord;
  dashboard?: MockDashboardMap;
  failPaths?: string[];
};

export const mockAdminApi = async (page: Page, overrides: AdminApiOverrides = {}) => {
  const navDefaultOrder = [
    "home",
    "products",
    "categories",
    "posts",
    "about",
    "qna",
    "orders",
    "payments",
    "contact"
  ];
  const normalizeNavOrder = (raw: unknown) => {
    if (!Array.isArray(raw)) {
      return [...navDefaultOrder];
    }
    const valid = new Set(navDefaultOrder);
    const seen = new Set<string>();
    const next: string[] = [];
    raw.forEach((value) => {
      const id = String(value || "").trim();
      if (!id || id === "overview" || !valid.has(id) || seen.has(id)) {
        return;
      }
      seen.add(id);
      next.push(id);
    });
    navDefaultOrder.forEach((id) => {
      if (!seen.has(id)) {
        next.push(id);
      }
    });
    return next;
  };

  const normalizeUIPreferences = (raw: unknown) => {
    const fallback = {
      sidebar_mode: "rail",
      density: "compact",
      orders_columns: ["order", "customer", "total", "payment", "delivery", "actions"]
    };
    if (!raw || typeof raw !== "object") {
      return fallback;
    }

    const source = raw as Record<string, unknown>;
    const sidebar_mode =
      source.sidebar_mode === "full" || source.sidebar_mode === "rail"
        ? source.sidebar_mode
        : fallback.sidebar_mode;
    const density =
      source.density === "comfortable" || source.density === "compact"
        ? source.density
        : fallback.density;

    const allowed = new Set([
      "order",
      "customer",
      "total",
      "payment",
      "delivery",
      "payment_method",
      "shipping_method",
      "actions"
    ]);
    const essentials = ["order", "customer", "total", "payment", "delivery", "actions"];
    const seen = new Set<string>();
    const orders_columns: string[] = [];
    if (Array.isArray(source.orders_columns)) {
      source.orders_columns.forEach((entry) => {
        const value = String(entry || "").trim();
        if (!value || !allowed.has(value) || seen.has(value)) {
          return;
        }
        seen.add(value);
        orders_columns.push(value);
      });
    }
    essentials.forEach((id) => {
      if (!seen.has(id)) {
        seen.add(id);
        orders_columns.push(id);
      }
    });

    return {
      sidebar_mode,
      density,
      orders_columns
    };
  };

  const profile = {
    id: 1,
    email: "admin@tam-bo.vn",
    name: "Quản trị viên",
    role: "ADMIN",
    nav_order: [...navDefaultOrder],
    ui_preferences: normalizeUIPreferences(null)
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


  const statusTotals = {
    order: [
      { status: "pending", count: 6 },
      { status: "confirmed", count: 4 },
      { status: "shipping", count: 3 },
      { status: "completed", count: 8 },
      { status: "cancelled", count: 1 }
    ],
    payment: [
      { status: "pending", count: 5 },
      { status: "proof_submitted", count: 4 },
      { status: "paid", count: 10 },
      { status: "rejected", count: 1 }
    ]
  };

  const dashboardTopProducts = [
    { product_id: 10, product_name: "Phan huu co Tam Bo", quantity_sold: 42, revenue: 2520000 },
    { product_id: 12, product_name: "Vi sinh dat", quantity_sold: 29, revenue: 1740000 },
    { product_id: 15, product_name: "Chelate vi luong", quantity_sold: 18, revenue: 1080000 },
    { product_id: 16, product_name: "Xu ly re", quantity_sold: 12, revenue: 720000 },
    { product_id: 20, product_name: "Dinh duong la", quantity_sold: 10, revenue: 500000 }
  ];

  const dashboardRecentOrders = [
    {
      id: 201,
      order_number: "TB202603160006",
      customer_name: "Tran Van B",
      total: 680000,
      status: "pending",
      payment_status: "proof_submitted",
      created_at: "2026-03-16T16:20:00+07:00"
    },
    {
      id: 200,
      order_number: "TB202603160005",
      customer_name: "Le Thi C",
      total: 520000,
      status: "confirmed",
      payment_status: "paid",
      created_at: "2026-03-16T15:40:00+07:00"
    },
    {
      id: 199,
      order_number: "TB202603160004",
      customer_name: "Pham Van D",
      total: 370000,
      status: "shipping",
      payment_status: "paid",
      created_at: "2026-03-16T14:55:00+07:00"
    },
    {
      id: 198,
      order_number: "TB202603160003",
      customer_name: "Nguyen Thi E",
      total: 240000,
      status: "pending",
      payment_status: "pending",
      created_at: "2026-03-16T13:10:00+07:00"
    },
    {
      id: 197,
      order_number: "TB202603160002",
      customer_name: "Do Van F",
      total: 910000,
      status: "completed",
      payment_status: "paid",
      created_at: "2026-03-16T11:45:00+07:00"
    },
    {
      id: 196,
      order_number: "TB202603160001",
      customer_name: "Bui Thi G",
      total: 450000,
      status: "completed",
      payment_status: "paid",
      created_at: "2026-03-16T10:30:00+07:00"
    }
  ];

  const dashboard: MockDashboardMap = {
    day: {
      grain: "day",
      range_label: "30 ngay gan nhat",
      summary: {
        orders: 18,
        paid_revenue: 5260000,
        average_order_value: 292222,
        pageviews: 1240,
        unique_visitors: 486
      },
      series: [
        { key: "2026-03-11", label: "11/03", orders: 1, paid_revenue: 220000, pageviews: 92, unique_visitors: 38 },
        { key: "2026-03-12", label: "12/03", orders: 3, paid_revenue: 680000, pageviews: 118, unique_visitors: 41 },
        { key: "2026-03-13", label: "13/03", orders: 2, paid_revenue: 450000, pageviews: 144, unique_visitors: 52 },
        { key: "2026-03-14", label: "14/03", orders: 4, paid_revenue: 1280000, pageviews: 176, unique_visitors: 65 },
        { key: "2026-03-15", label: "15/03", orders: 3, paid_revenue: 960000, pageviews: 168, unique_visitors: 61 },
        { key: "2026-03-16", label: "16/03", orders: 5, paid_revenue: 1670000, pageviews: 210, unique_visitors: 77 }
      ],
      order_status_totals: statusTotals.order,
      payment_status_totals: statusTotals.payment,
      top_products: dashboardTopProducts,
      recent_orders: dashboardRecentOrders
    },
    month: {
      grain: "month",
      range_label: "12 thang gan nhat",
      summary: {
        orders: 126,
        paid_revenue: 58420000,
        average_order_value: 463650,
        pageviews: 12540,
        unique_visitors: 4210
      },
      series: [
        { key: "2025-11", label: "11/2025", orders: 14, paid_revenue: 5200000, pageviews: 1110, unique_visitors: 388 },
        { key: "2025-12", label: "12/2025", orders: 18, paid_revenue: 7900000, pageviews: 1240, unique_visitors: 441 },
        { key: "2026-01", label: "01/2026", orders: 21, paid_revenue: 9150000, pageviews: 1430, unique_visitors: 503 },
        { key: "2026-02", label: "02/2026", orders: 27, paid_revenue: 12670000, pageviews: 1580, unique_visitors: 546 },
        { key: "2026-03", label: "03/2026", orders: 32, paid_revenue: 15500000, pageviews: 1710, unique_visitors: 602 }
      ],
      order_status_totals: statusTotals.order,
      payment_status_totals: statusTotals.payment,
      top_products: dashboardTopProducts,
      recent_orders: dashboardRecentOrders
    },
    year: {
      grain: "year",
      range_label: "5 nam gan nhat",
      summary: {
        orders: 420,
        paid_revenue: 215400000,
        average_order_value: 512857,
        pageviews: 48200,
        unique_visitors: 17100
      },
      series: [
        { key: "2022", label: "2022", orders: 52, paid_revenue: 22800000, pageviews: 6200, unique_visitors: 2210 },
        { key: "2023", label: "2023", orders: 74, paid_revenue: 34400000, pageviews: 8410, unique_visitors: 3010 },
        { key: "2024", label: "2024", orders: 88, paid_revenue: 45200000, pageviews: 9460, unique_visitors: 3320 },
        { key: "2025", label: "2025", orders: 96, paid_revenue: 49600000, pageviews: 10820, unique_visitors: 3840 },
        { key: "2026", label: "2026", orders: 110, paid_revenue: 63400000, pageviews: 13310, unique_visitors: 4720 }
      ],
      order_status_totals: statusTotals.order,
      payment_status_totals: statusTotals.payment,
      top_products: dashboardTopProducts,
      recent_orders: dashboardRecentOrders
    }
  };

  const pages = [
    {
      id: 11,
      title: "Giới thiệu",
      slug: "about-us",
      content: "{}",
      draft_content: "{}",
      updated_at: "2024-06-01T08:00:00Z"
    },
    {
      id: 12,
      title: "Trang chủ",
      slug: "home",
      content: JSON.stringify({
        banners: demoBanners,
        promoPopup: {
          title: "Ưu đãi hôm nay",
          subtitle: "Xem lại ưu đãi và mã giảm giá",
          imageSrc:
            "https://images.unsplash.com/photo-1457530378978-8bac673b8062?auto=format&fit=crop&w=800&q=80",
          imageAlt: "Ưu đãi",
          programs: [],
          coupons: [],
          ctaLabel: "Xem chi tiết",
          ctaHref: "/collections/all",
          isActive: true,
          delaySeconds: 2
        },
        notifications: {
          items: [
            {
              id: "notify-test-1",
              title: "Thông báo thử nghiệm",
              description: "Nội dung test",
              href: "/collections/all",
              isActive: true
            }
          ]
        }
      }),
      draft_content: JSON.stringify({
        banners: demoBanners
      }),
      updated_at: "2024-06-01T08:00:00Z"
    }
  ];

  const {
    products: productData = products,
    categories: categoryData = categories,
    posts: postData = posts,
    qna: qnaData = qna,
    orders: orderData = orders,
    pages: pageData = pages,
    paymentSettings: paymentData = paymentSettings,
    dashboard: dashboardData = dashboard,
    failPaths = []
  } = overrides;
  const mutableProducts = structuredClone(productData) as MockAdminRecord[];
  const mutableOrders = structuredClone(orderData) as MockAdminOrder[];
  const mutablePages = structuredClone(pageData) as MockAdminPage[];

  await page.route("**/api/admin/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
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

    if (url.pathname.endsWith("/api/admin/me") && method === "GET") {
      data = profile;
    } else if (url.pathname.endsWith("/api/admin/me/preferences") && method === "PATCH") {
      const payload = (route.request().postDataJSON() || {}) as {
        nav_order?: unknown;
        ui_preferences?: unknown;
      };
      if (payload.nav_order !== undefined) {
        profile.nav_order = normalizeNavOrder(payload.nav_order);
      }
      if (payload.ui_preferences !== undefined) {
        profile.ui_preferences = normalizeUIPreferences(payload.ui_preferences);
      }
      data = profile;
    } else if (url.pathname.endsWith("/api/admin/products") && method === "GET") {
      data = mutableProducts;
    } else if (/\/api\/admin\/products\/\d+$/.test(url.pathname) && method === "PATCH") {
      const productId = Number(url.pathname.split("/").pop());
      const payload = (route.request().postDataJSON() || {}) as Record<string, unknown>;
      const index = mutableProducts.findIndex((item) => Number(item.id) === productId);
      if (index >= 0) {
        mutableProducts[index] = {
          ...mutableProducts[index],
          ...payload,
        };
      }
      data = index >= 0 ? mutableProducts[index] : {};
    } else if (url.pathname.endsWith("/api/admin/products") && method === "POST") {
      const payload = (route.request().postDataJSON() || {}) as Record<string, unknown>;
      const nextId =
        mutableProducts.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
      const created = {
        id: nextId,
        name: String(payload.name || ""),
        slug: String(payload.slug || ""),
        description: String(payload.description || ""),
        price: Number(payload.price || 0),
        compare_at_price:
          payload.compare_at_price === undefined ? null : Number(payload.compare_at_price),
        featured: Boolean(payload.featured),
        status: String(payload.status || "published"),
        tags: String(payload.tags || ""),
        sort_order: Number(payload.sort_order || 0),
        images: [],
        categories: (categoryData as MockAdminRecord[]).filter((category) =>
          Array.isArray(payload.category_ids) &&
          payload.category_ids.includes(category.id as number)
        )
      };
      mutableProducts.unshift(created);
      data = created;
    } else if (/\/api\/admin\/products\/\d+\/images$/.test(url.pathname) && method === "PUT") {
      const productId = Number(url.pathname.split("/").slice(-2)[0]);
      const payload = (route.request().postDataJSON() || {}) as {
        images?: Array<{ id?: number; url?: string; sort_order?: number }>;
      };
      const index = mutableProducts.findIndex((item) => Number(item.id) === productId);
      if (index >= 0) {
        const current = mutableProducts[index] as Record<string, unknown>;
        const existingImages = Array.isArray(current.images) ? current.images : [];
        let nextImageId = existingImages.reduce(
          (max: number, image: any) => Math.max(max, Number(image?.id) || 0),
          0
        );
        const images = Array.isArray(payload.images) ? payload.images : [];
        current.images = images.map((image, order) => ({
          id: image.id || ++nextImageId,
          url: String(image.url || ""),
          sort_order: order + 1
        }));
      }
      data = index >= 0 ? mutableProducts[index] : {};
    } else if (/\/api\/admin\/products\/\d+\/images$/.test(url.pathname) && method === "POST") {
      const productId = Number(url.pathname.split("/").slice(-2)[0]);
      const payload = (route.request().postDataJSON() || {}) as Record<string, unknown>;
      const index = mutableProducts.findIndex((item) => Number(item.id) === productId);
      if (index >= 0) {
        const current = mutableProducts[index] as Record<string, unknown>;
        const existingImages = Array.isArray(current.images) ? current.images : [];
        const nextImageId = existingImages.reduce(
          (max: number, image: any) => Math.max(max, Number(image?.id) || 0),
          0
        ) + 1;
        current.images = [
          ...existingImages,
          {
            id: nextImageId,
            url: String(payload.url || ""),
            sort_order: Number(payload.sort_order || existingImages.length + 1)
          }
        ];
      }
      data = index >= 0 ? mutableProducts[index] : {};
    } else if (url.pathname.endsWith("/api/admin/categories")) {
      data = categoryData;
    } else if (url.pathname.endsWith("/api/admin/posts")) {
      data = postData;
    } else if (url.pathname.endsWith("/api/admin/qna")) {
      data = qnaData;
    } else if (url.pathname.endsWith("/api/admin/pages") && method === "GET") {
      data = mutablePages;
    } else if (url.pathname.endsWith("/api/admin/pages") && method === "POST") {
      const payload = (route.request().postDataJSON() || {}) as Record<string, unknown>;
      const nextId =
        mutablePages.reduce(
          (max: number, item: MockAdminPage) => Math.max(max, Number(item.id) || 0),
          0
        ) + 1;
      const created = {
        id: nextId,
        title: String(payload.title || "Trang chủ"),
        slug: String(payload.slug || "home"),
        content:
          payload.save_mode === "draft" ? "{}" : String(payload.content || "{}"),
        draft_content: String(payload.content || "{}"),
        updated_at: new Date().toISOString()
      };
      mutablePages.unshift(created);
      data = created;
    } else if (/\/api\/admin\/pages\/\d+$/.test(url.pathname) && method === "PATCH") {
      const pageId = Number(url.pathname.split("/").pop());
      const payload = (route.request().postDataJSON() || {}) as Record<string, unknown>;
      const index = mutablePages.findIndex((item) => Number(item.id) === pageId);
      if (index >= 0) {
        const nextContent =
          typeof payload.content === "string"
            ? payload.content
            : mutablePages[index].content;
        const saveMode = String(payload.save_mode || "publish");
        mutablePages[index] = {
          ...mutablePages[index],
          title:
            typeof payload.title === "string" ? payload.title : mutablePages[index].title,
          slug: typeof payload.slug === "string" ? payload.slug : mutablePages[index].slug,
          content:
            saveMode === "draft" ? mutablePages[index].content : nextContent,
          draft_content: nextContent,
          updated_at: new Date().toISOString()
        };
      }
      data = index >= 0 ? mutablePages[index] : {};
    } else if (url.pathname.endsWith("/api/admin/orders")) {
      data = mutableOrders;
    } else if (url.pathname.endsWith("/api/admin/dashboard")) {
      const grain = url.searchParams.get("grain") || "day";
      data = dashboardData[grain] || dashboardData.day || {};
    } else if (/\/api\/admin\/orders\/\d+$/.test(url.pathname) && method === "PATCH") {
      const orderId = Number(url.pathname.split("/").pop());
      const payload = (route.request().postDataJSON() || {}) as Record<string, unknown>;
      const index = mutableOrders.findIndex((item) => item.id === orderId);
      if (index >= 0) {
        mutableOrders[index] = {
          ...mutableOrders[index],
          ...payload
        };
      }
      data = index >= 0 ? mutableOrders[index] : {};
    } else if (url.pathname.endsWith("/api/admin/payment-settings")) {
      data = paymentData;
    } else if (url.pathname.endsWith("/api/admin/uploads") && method === "POST") {
      data = {
        url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80"
      };
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data })
    });
  });
};
