"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CreditCard,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Home,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  Trash2,
  Newspaper,
  Package,
  Phone,
  ShoppingCart,
  Megaphone
} from "lucide-react";

import AdminShell, { AdminNavItem } from "@/components/admin/AdminShell";
import AdminOverview from "@/components/admin/AdminOverview";
import {
  AdminField,
  AdminPagination,
  AdminSectionHeader,
  inputClass,
  selectClass,
  textareaClass
} from "@/components/admin/AdminHelpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { AdminDialogContent } from "@/components/admin/AdminDialog";
import { formatCurrency } from "@/lib/format";
import {
  AdminCategory,
  AdminOrder,
  AdminPost,
  AdminProduct,
  AdminProfile,
  AdminQnA,
  PaymentSettings,
  addAdminProductImage,
  adminLogout,
  adminMe,
  createAdminCategory,
  createAdminPage,
  createAdminPost,
  createAdminProduct,
  createAdminQnA,
  deleteAdminCategory,
  deleteAdminPost,
  deleteAdminProduct,
  deleteAdminQnA,
  getPaymentSettings,
  listAdminCategories,
  listAdminOrders,
  listAdminPages,
  listAdminPosts,
  listAdminProducts,
  listAdminQnA,
  updateAdminCategory,
  updateAdminOrder,
  updateAdminPage,
  updateAdminPost,
  updateAdminProduct,
  updateAdminQnA,
  updatePaymentSettings,
  uploadAdminFile
} from "@/lib/admin";
import type {
  AboutPageContent,
  AboutSlide,
  ContactSettings,
  HomeBanner,
  HomePageContent,
  NotificationItem,
  NotificationSettings,
  PromoCoupon,
  PromoPopupSettings,
  PromoProgram
} from "@/lib/content";
import {
  cloneAboutContent,
  cloneHomePageContent,
  defaultAboutContent,
  defaultContactSettings,
  defaultHomePageContent,
  resolveAboutContent,
  resolveHomePageContent
} from "@/lib/content";
import {
  HOME_BANNERS_STORAGE_KEY,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
  PROMO_POPUP_STORAGE_KEY,
  loadContactSettings,
  saveContactSettings,
} from "@/lib/client-content";

const sectionLabels: Record<string, string> = {
  overview: "Tổng quan",
  home: "Trang chủ",
  products: "Sản phẩm",
  categories: "Danh mục",
  posts: "Tin tức",
  about: "Giới thiệu",
  qna: "Hỏi đáp",
  orders: "Đơn hàng",
  payments: "Thanh toán",
  contact: "Liên hệ"
};

type HomeGroupKey =
  | "banners"
  | "intro"
  | "spotlights"
  | "features"
  | "aboutTeaser"
  | "promoPopup"
  | "notifications";

const LEGACY_HOME_BANNERS_V1_KEY = "admin_home_banners_v1";
const MIN_SPOTLIGHT_BLOCKS = 1;

type HomeSpotlightItem = HomePageContent["spotlights"][number];
type SpotlightMoveDirection = -1 | 1;

const createHomeSpotlightId = () =>
  `home-spotlight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const cloneLastSpotlightBlock = (
  spotlights: HomePageContent["spotlights"]
): HomeSpotlightItem => {
  const fallback =
    defaultHomePageContent.spotlights[defaultHomePageContent.spotlights.length - 1] ||
    defaultHomePageContent.spotlights[0] || {
      id: "home-spotlight-default",
      title: "",
      description: "",
      bullets: [],
      ctaLabel: "Xem chi tiết",
      ctaHref: "/collections/all",
      imageSrc: "",
      imageAlt: ""
    };
  const base = spotlights[spotlights.length - 1] || fallback;
  const baseTitle = base.title.trim();

  return {
    ...base,
    id: createHomeSpotlightId(),
    title: baseTitle ? `${baseTitle} (Bản sao)` : "Block mới (Bản sao)",
    bullets: [...base.bullets]
  };
};

const reorderList = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return items;
  }
  next.splice(toIndex, 0, moved);
  return next;
};

const createHomeDirtyMap = (): Record<HomeGroupKey, boolean> => ({
  banners: false,
  intro: false,
  spotlights: false,
  features: false,
  aboutTeaser: false,
  promoPopup: false,
  notifications: false
});

const createHomeSavedAtMap = (
  savedAt: string | null = null
): Record<HomeGroupKey, string | null> => ({
  banners: savedAt,
  intro: savedAt,
  spotlights: savedAt,
  features: savedAt,
  aboutTeaser: savedAt,
  promoPopup: savedAt,
  notifications: savedAt
});

const parseStorageJson = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};
export default function AdminDashboardPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [qna, setQnA] = useState<AdminQnA[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [error, setError] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [homePageId, setHomePageId] = useState<number | null>(null);
  const [homeSnapshot, setHomeSnapshot] = useState<HomePageContent>(
    cloneHomePageContent(defaultHomePageContent)
  );
  const [homeDraft, setHomeDraft] = useState<HomePageContent>(
    cloneHomePageContent(defaultHomePageContent)
  );
  const [homeDirtyMap, setHomeDirtyMap] = useState<Record<HomeGroupKey, boolean>>(
    createHomeDirtyMap()
  );
  const [homeSavedAtMap, setHomeSavedAtMap] = useState<Record<HomeGroupKey, string | null>>(
    createHomeSavedAtMap()
  );
  const [contactDraft, setContactDraft] = useState<ContactSettings>(defaultContactSettings);
  const [aboutPageId, setAboutPageId] = useState<number | null>(null);
  const [aboutDraft, setAboutDraft] = useState<AboutPageContent>(cloneAboutContent(defaultAboutContent));
  const [aboutDirty, setAboutDirty] = useState(false);
  const [aboutSavedAt, setAboutSavedAt] = useState<string | null>(null);
  const [contactDirty, setContactDirty] = useState(false);
  const [contactSavedAt, setContactSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setContactDraft(loadContactSettings());
  }, []);

  const readLegacyHomeContent = (): HomePageContent => {
    if (typeof window === "undefined") {
      return cloneHomePageContent(defaultHomePageContent);
    }

    const legacyBanners =
      parseStorageJson<HomeBanner[]>(window.localStorage.getItem(HOME_BANNERS_STORAGE_KEY)) ||
      parseStorageJson<HomeBanner[]>(
        window.localStorage.getItem(LEGACY_HOME_BANNERS_V1_KEY)
      );
    const legacyPopup = parseStorageJson<PromoPopupSettings>(
      window.localStorage.getItem(PROMO_POPUP_STORAGE_KEY)
    );
    const legacyNotifications = parseStorageJson<NotificationSettings>(
      window.localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY)
    );

    const merged: Partial<HomePageContent> = {
      ...defaultHomePageContent,
      ...(Array.isArray(legacyBanners) ? { banners: legacyBanners } : {}),
      ...(legacyPopup ? { promoPopup: legacyPopup } : {}),
      ...(legacyNotifications ? { notifications: legacyNotifications } : {})
    };

    return resolveHomePageContent(JSON.stringify(merged));
  };

  const mergeHomeGroup = (
    base: HomePageContent,
    source: HomePageContent,
    group: HomeGroupKey
  ): HomePageContent => {
    switch (group) {
      case "banners":
        return { ...base, banners: source.banners.map((item) => ({ ...item })) };
      case "intro":
        return { ...base, intro: { ...source.intro } };
      case "spotlights":
        return {
          ...base,
          spotlights: source.spotlights.map((item) => ({
            ...item,
            bullets: [...item.bullets]
          }))
        };
      case "features":
        return { ...base, features: source.features.map((item) => ({ ...item })) };
      case "aboutTeaser":
        return { ...base, aboutTeaser: { ...source.aboutTeaser } };
      case "promoPopup":
        return {
          ...base,
          promoPopup: {
            ...source.promoPopup,
            programs: source.promoPopup.programs.map((item) => ({ ...item })),
            coupons: source.promoPopup.coupons.map((item) => ({ ...item }))
          }
        };
      case "notifications":
        return {
          ...base,
          notifications: {
            items: source.notifications.items.map((item) => ({ ...item }))
          }
        };
      default:
        return base;
    }
  };

  const loadAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [
        productData,
        categoryData,
        postData,
        qnaData,
        orderData,
        paymentData,
        pageData
      ] = await Promise.all([
        listAdminProducts(),
        listAdminCategories(),
        listAdminPosts(),
        listAdminQnA(),
        listAdminOrders(),
        getPaymentSettings(),
        listAdminPages()
      ]);
      setProducts(productData);
      setCategories(categoryData);
      setPosts(postData);
      setQnA(qnaData);
      setOrders(orderData);
      setSettings(paymentData);

      const aboutPage = pageData.find((item) => item.slug === "about-us");
      setAboutPageId(aboutPage?.id ?? null);
      if (!aboutDirty) {
        const resolved = resolveAboutContent(aboutPage?.content);
        setAboutDraft(cloneAboutContent(resolved));
        setAboutDirty(false);
        setAboutSavedAt(aboutPage?.updated_at || null);
      }

      const hasUnsavedHomeChanges = Object.values(homeDirtyMap).some(Boolean);
      let homePage = pageData.find((item) => item.slug === "home");
      if (!homePage) {
        const migrated = readLegacyHomeContent();
        homePage = await createAdminPage({
          title: "Trang chủ",
          slug: "home",
          content: JSON.stringify(migrated)
        });
      }

      setHomePageId(homePage.id);
      if (!hasUnsavedHomeChanges) {
        const resolvedHome = resolveHomePageContent(homePage.content);
        setHomeSnapshot(cloneHomePageContent(resolvedHome));
        setHomeDraft(cloneHomePageContent(resolvedHome));
        setHomeDirtyMap(createHomeDirtyMap());
        setHomeSavedAtMap(createHomeSavedAtMap(homePage.updated_at || null));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khng th ti d li!u qun tr9.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then((profileData) => {
        if (!cancelled) {
          setIsAuthed(true);
          setProfile(profileData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAuthed(false);
          setProfile(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }
    loadAll();
  }, [isAuthed]);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setError("");
    try {
      const result = await uploadAdminFile(file);
      setUploadUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khng th ti ln t!p.");
    }
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setError("");
    setLoggingOut(true);
    try {
      await adminLogout();
      setIsAuthed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khng th ng xut.");
    } finally {
      setLoggingOut(false);
    }
  };

  const updateHomeGroup = (
    group: HomeGroupKey,
    updater: (prev: HomePageContent) => HomePageContent
  ) => {
    setHomeDraft((prev) => updater(prev));
    setHomeDirtyMap((prev) => ({ ...prev, [group]: true }));
  };

  const saveHomeGroup = async (group: HomeGroupKey) => {
    setError("");
    try {
      const merged = mergeHomeGroup(homeSnapshot, homeDraft, group);
      const payload = {
        title: "Trang chủ",
        slug: "home",
        content: JSON.stringify(merged)
      };
      const saved = homePageId
        ? await updateAdminPage(homePageId, payload)
        : await createAdminPage(payload);
      const resolved = resolveHomePageContent(saved.content);
      setHomePageId(saved.id);
      setHomeSnapshot(cloneHomePageContent(resolved));
      setHomeDraft((prev) => mergeHomeGroup(prev, resolved, group));
      setHomeDirtyMap((prev) => ({ ...prev, [group]: false }));
      setHomeSavedAtMap((prev) => ({
        ...prev,
        [group]: saved.updated_at || new Date().toLocaleString("vi-VN")
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khng th lu n'i dung trang ch.");
    }
  };

  const handleHomeBannersChange = (next: HomeBanner[]) => {
    updateHomeGroup("banners", (prev) => ({
      ...prev,
      banners: next.map((item) => ({ ...item }))
    }));
  };

  const handleHomeIntroChange = (patch: Partial<HomePageContent["intro"]>) => {
    updateHomeGroup("intro", (prev) => ({
      ...prev,
      intro: { ...prev.intro, ...patch }
    }));
  };

  const handleHomeSpotlightChange = (
    index: number,
    patch: Partial<HomePageContent["spotlights"][number]>
  ) => {
    updateHomeGroup("spotlights", (prev) => ({
      ...prev,
      spotlights: prev.spotlights.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    }));
  };

  const handleHomeSpotlightBulletsChange = (index: number, value: string) => {
    const bullets = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    handleHomeSpotlightChange(index, { bullets });
  };

  const handleHomeSpotlightAdd = () => {
    setError("");
    updateHomeGroup("spotlights", (prev) => ({
      ...prev,
      spotlights: [...prev.spotlights, cloneLastSpotlightBlock(prev.spotlights)]
    }));
  };

  const handleHomeSpotlightReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }
    setError("");
    updateHomeGroup("spotlights", (prev) => ({
      ...prev,
      spotlights: reorderList(prev.spotlights, fromIndex, toIndex)
    }));
  };

  const handleHomeSpotlightMove = (index: number, direction: SpotlightMoveDirection) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= homeDraft.spotlights.length) {
      return;
    }
    handleHomeSpotlightReorder(index, targetIndex);
  };

  const handleHomeSpotlightDelete = (index: number) => {
    if (homeDraft.spotlights.length <= MIN_SPOTLIGHT_BLOCKS) {
      setError("Banner sản phẩm cần tối thiểu 1 block.");
      return;
    }

    const target = homeDraft.spotlights[index];
    if (!target) {
      return;
    }

    const label = target.title.trim() || `Block ${index + 1}`;
    const confirmed = window.confirm(`Xóa block "${label}"?`);
    if (!confirmed) {
      return;
    }

    setError("");
    updateHomeGroup("spotlights", (prev) => ({
      ...prev,
      spotlights: prev.spotlights.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const handleHomeFeatureChange = (
    index: number,
    patch: Partial<HomePageContent["features"][number]>
  ) => {
    updateHomeGroup("features", (prev) => ({
      ...prev,
      features: prev.features.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    }));
  };

  const handleHomeAboutTeaserChange = (
    patch: Partial<HomePageContent["aboutTeaser"]>
  ) => {
    updateHomeGroup("aboutTeaser", (prev) => ({
      ...prev,
      aboutTeaser: { ...prev.aboutTeaser, ...patch }
    }));
  };

  const handleContactChange = (patch: Partial<ContactSettings>) => {
    setContactDraft((prev) => ({ ...prev, ...patch }));
    setContactDirty(true);
  };

  const handleContactSave = () => {
    saveContactSettings(contactDraft);
    setContactDirty(false);
    setContactSavedAt(new Date().toLocaleString("vi-VN"));
  };

  const handlePromoPopupChange = (patch: Partial<PromoPopupSettings>) => {
    updateHomeGroup("promoPopup", (prev) => ({
      ...prev,
      promoPopup: { ...prev.promoPopup, ...patch }
    }));
  };

  const handleAboutChange = (next: AboutPageContent) => {
    setAboutDraft(next);
    setAboutDirty(true);
  };

  const handleAboutSave = async () => {
    setError("");
    if (!aboutDraft.hero.title.trim()) {
      setError("Vui lng nhp tiu  trang gi:i thi!u.");
      return;
    }
    if (!aboutDraft.slides.length) {
      setError("Trang gi:i thi!u cn t nht m't slide n'i dung.");
      return;
    }

    try {
      const payload = {
        title: aboutDraft.hero.title || "Giới thiệu",
        slug: "about-us",
        content: JSON.stringify(aboutDraft)
      };
      const saved = aboutPageId
        ? await updateAdminPage(aboutPageId, payload)
        : await createAdminPage(payload);
      setAboutPageId(saved.id);
      setAboutDirty(false);
      setAboutSavedAt(new Date().toLocaleString("vi-VN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khng th lu trang gi:i thi!u.");
    }
  };

  const handleNotificationChange = (next: NotificationSettings) => {
    updateHomeGroup("notifications", (prev) => ({
      ...prev,
      notifications: {
        items: next.items.map((item) => ({ ...item }))
      }
    }));
  };

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );

  const pendingPayments = useMemo(
    () =>
      orders.filter((order) =>
        ["pending", "proof_submitted"].includes(order.payment_status)
      ).length,
    [orders]
  );

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.payment_status === "paid")
        .reduce((sum, order) => sum + (order.total || 0), 0),
    [orders]
  );

  const navItems = useMemo<AdminNavItem[]>(
    () => [
      { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
      { id: "home", label: "Trang chủ", icon: Home },
      { id: "products", label: "Sản phẩm", icon: Package },
      { id: "categories", label: "Danh mục", icon: Layers },
      { id: "posts", label: "Tin tức", icon: Newspaper },
      { id: "about", label: "Giới thiệu", icon: BookOpen },
      { id: "qna", label: "Hỏi đáp", icon: HelpCircle },
      { id: "orders", label: "Đơn hàng", icon: ShoppingCart },
      { id: "payments", label: "Thanh toán", icon: CreditCard },
      { id: "contact", label: "Liên hệ", icon: Phone }
    ],
    []
  );

  const navMeta = useMemo(
    () => ({
      home:
        homeDraft.banners.length +
        homeDraft.spotlights.length +
        homeDraft.features.length,
      products: products.length,
      categories: categories.length,
      posts: posts.length,
      about: aboutPageId ? 1 : 0,
      qna: qna.length,
      orders: pendingOrders,
      payments: pendingPayments
    }),
    [
      homeDraft.banners.length,
      homeDraft.spotlights.length,
      homeDraft.features.length,
      products.length,
      categories.length,
      posts.length,
      aboutPageId,
      qna.length,
      pendingOrders,
      pendingPayments
    ]
  );

  if (isAuthed === null) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <div className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-slate-600 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
            ang kim tra quyn qun tr9...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <div className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-sm">
              Admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Cn ng nhp
            </h1>
            <p className="mt-3 text-base text-slate-600 md:text-sm">
              Vui lng ng nhp  qun l ni dung.
            </p>
            <Button
              asChild
              className="mt-6 h-11 w-full bg-[var(--color-cta)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              <Link href="/admin/login">ng nhp qun tr9</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      navItems={navItems}
      activeSection={activeSection}
      onNavigate={setActiveSection}
      title={sectionLabels[activeSection] || "Tổng quan"}
      navMeta={navMeta}
      profile={profile}
      onLogout={handleLogout}
      loggingOut={loggingOut}
      onRefresh={loadAll}
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700 md:text-sm">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-600 md:text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
          ang ti d li!u qun tr9...
        </div>
      ) : null}

      {activeSection === "overview" && (
        <AdminOverview
          products={products}
          categories={categories}
          posts={posts}
          qna={qna}
          orders={orders}
          settings={settings}
          pendingOrders={pendingOrders}
          pendingPayments={pendingPayments}
          totalRevenue={totalRevenue}
          banners={homeDraft.banners}
          contactSettings={contactDraft}
          uploadUrl={uploadUrl}
          onUpload={handleUpload}
          onNavigate={setActiveSection}
        />
      )}

      {activeSection === "home" && (
        <AdminHomeSection
          content={homeDraft}
          dirtyMap={homeDirtyMap}
          savedAtMap={homeSavedAtMap}
          onBannersChange={handleHomeBannersChange}
          onIntroChange={handleHomeIntroChange}
          onSpotlightChange={handleHomeSpotlightChange}
          onSpotlightBulletsChange={handleHomeSpotlightBulletsChange}
          onSpotlightAdd={handleHomeSpotlightAdd}
          onSpotlightDelete={handleHomeSpotlightDelete}
          onSpotlightMove={handleHomeSpotlightMove}
          onSpotlightReorder={handleHomeSpotlightReorder}
          onFeatureChange={handleHomeFeatureChange}
          onAboutTeaserChange={handleHomeAboutTeaserChange}
          onPopupChange={handlePromoPopupChange}
          onNotificationChange={handleNotificationChange}
          onSaveGroup={saveHomeGroup}
          setError={setError}
        />
      )}

      {activeSection === "products" && (
        <AdminProductsSection
          products={products}
          categories={categories}
          onReload={loadAll}
          setError={setError}
        />
      )}

      {activeSection === "categories" && (
        <AdminCategoriesSection
          categories={categories}
          onReload={loadAll}
          setError={setError}
        />
      )}

      {activeSection === "posts" && (
        <AdminPostsSection posts={posts} onReload={loadAll} setError={setError} />
      )}

      {activeSection === "about" && (
        <AdminAboutSection
          value={aboutDraft}
          onChange={handleAboutChange}
          onSave={handleAboutSave}
          isDirty={aboutDirty}
          savedAt={aboutSavedAt}
          setError={setError}
        />
      )}

      {activeSection === "qna" && (
        <AdminQnASection items={qna} onReload={loadAll} setError={setError} />
      )}

      {activeSection === "orders" && (
        <AdminOrdersSection orders={orders} onReload={loadAll} setError={setError} />
      )}

      {activeSection === "payments" && (
        <AdminPaymentsSection settings={settings} onSave={setSettings} setError={setError} />
      )}

      {activeSection === "contact" && (
        <AdminContactSection
          value={contactDraft}
          onChange={handleContactChange}
          onSave={handleContactSave}
          isDirty={contactDirty}
          savedAt={contactSavedAt}
        />
      )}

    </AdminShell>
  );
}

function AdminHomeSection({
  content,
  dirtyMap,
  savedAtMap,
  onBannersChange,
  onIntroChange,
  onSpotlightChange,
  onSpotlightBulletsChange,
  onSpotlightAdd,
  onSpotlightDelete,
  onSpotlightMove,
  onSpotlightReorder,
  onFeatureChange,
  onAboutTeaserChange,
  onPopupChange,
  onNotificationChange,
  onSaveGroup,
  setError
}: {
  content: HomePageContent;
  dirtyMap: Record<HomeGroupKey, boolean>;
  savedAtMap: Record<HomeGroupKey, string | null>;
  onBannersChange: (next: HomeBanner[]) => void;
  onIntroChange: (patch: Partial<HomePageContent["intro"]>) => void;
  onSpotlightChange: (
    index: number,
    patch: Partial<HomePageContent["spotlights"][number]>
  ) => void;
  onSpotlightBulletsChange: (index: number, value: string) => void;
  onSpotlightAdd: () => void;
  onSpotlightDelete: (index: number) => void;
  onSpotlightMove: (index: number, direction: SpotlightMoveDirection) => void;
  onSpotlightReorder: (fromIndex: number, toIndex: number) => void;
  onFeatureChange: (
    index: number,
    patch: Partial<HomePageContent["features"][number]>
  ) => void;
  onAboutTeaserChange: (patch: Partial<HomePageContent["aboutTeaser"]>) => void;
  onPopupChange: (patch: Partial<PromoPopupSettings>) => void;
  onNotificationChange: (next: NotificationSettings) => void;
  onSaveGroup: (group: HomeGroupKey) => void | Promise<void>;
  setError: (value: string) => void;
}) {
  const tabs: { id: HomeGroupKey; label: string; icon: typeof Home }[] = [
    { id: "banners", label: "Banner", icon: ImageIcon },
    { id: "intro", label: "Định hướng", icon: Home },
    { id: "spotlights", label: "Banner sản phẩm", icon: Layers },
    { id: "features", label: "Ưu điểm", icon: Bell },
    { id: "aboutTeaser", label: "About-us", icon: BookOpen },
    { id: "promoPopup", label: "Popup", icon: Megaphone },
    { id: "notifications", label: "Thông báo", icon: Bell }
  ];
  const [activeTab, setActiveTab] = useState<HomeGroupKey>("banners");
  const [draggingSpotlightIndex, setDraggingSpotlightIndex] = useState<number | null>(
    null
  );
  const [dragOverSpotlightIndex, setDragOverSpotlightIndex] = useState<number | null>(
    null
  );

  const clearSpotlightDragState = () => {
    setDraggingSpotlightIndex(null);
    setDragOverSpotlightIndex(null);
  };

  const handleSpotlightDragStart = (
    event: DragEvent<HTMLButtonElement>,
    index: number
  ) => {
    setDraggingSpotlightIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleSpotlightDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    if (draggingSpotlightIndex === null || draggingSpotlightIndex === index) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverSpotlightIndex !== index) {
      setDragOverSpotlightIndex(index);
    }
  };

  const handleSpotlightDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    const fromIndex =
      draggingSpotlightIndex ?? Number.parseInt(event.dataTransfer.getData("text/plain"), 10);
    if (Number.isInteger(fromIndex) && fromIndex >= 0 && fromIndex !== index) {
      onSpotlightReorder(fromIndex, index);
    }
    clearSpotlightDragState();
  };

  const renderSaveActions = (group: HomeGroupKey, label: string) => (
    <div className="flex flex-wrap items-center gap-2">
      {savedAtMap[group] ? (
        <span className="text-base text-slate-500 md:text-sm">Đã lưu: {savedAtMap[group]}</span>
      ) : null}
      <Button
        onClick={() => void onSaveGroup(group)}
        disabled={!dirtyMap[group]}
        className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
      >
        {label}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Trang chủ"
          description="Quản lý toàn bộ nội dung hiển thị ở homepage trong một nơi."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold transition md:text-sm cursor-pointer ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-slate-200 text-slate-600 hover:border-[var(--color-primary)]/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {dirtyMap[tab.id] ? <span className="text-amber-600">*</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "banners" ? (
        <AdminBannersSection
          banners={content.banners}
          onChange={onBannersChange}
          onSave={() => void onSaveGroup("banners")}
          isDirty={dirtyMap.banners}
          savedAt={savedAtMap.banners}
          setError={setError}
        />
      ) : null}

      {activeTab === "intro" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="Định hướng phát triển"
            description="Khối giới thiệu lớn ngay sau slider ở trang chủ."
            actions={renderSaveActions("intro", "Lưu định hướng")}
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AdminField label="Nhãn đầu mục">
              <input
                className={inputClass}
                value={content.intro.eyebrow}
                onChange={(event) => onIntroChange({ eyebrow: event.target.value })}
              />
            </AdminField>
            <AdminField label="Tên thương hiệu">
              <input
                className={inputClass}
                value={content.intro.title}
                onChange={(event) => onIntroChange({ title: event.target.value })}
              />
            </AdminField>
            <AdminField label="Tiêu đề chính" helper="Dòng headline nổi bật.">
              <input
                className={inputClass}
                value={content.intro.headline}
                onChange={(event) => onIntroChange({ headline: event.target.value })}
              />
            </AdminField>
            <AdminField label="CTA label">
              <input
                className={inputClass}
                value={content.intro.ctaLabel}
                onChange={(event) => onIntroChange({ ctaLabel: event.target.value })}
              />
            </AdminField>
            <AdminField label="Mô tả" helper="Nội dung dài của khối định hướng.">
              <textarea
                className={textareaClass}
                rows={8}
                value={content.intro.description}
                onChange={(event) => onIntroChange({ description: event.target.value })}
              />
            </AdminField>
            <div className="grid gap-4">
              <AdminField label="CTA link">
                <input
                  className={inputClass}
                  value={content.intro.ctaHref}
                  onChange={(event) => onIntroChange({ ctaHref: event.target.value })}
                />
              </AdminField>
              <AdminField label="Ảnh chính">
                <input
                  className={inputClass}
                  value={content.intro.imageSrc}
                  onChange={(event) => onIntroChange({ imageSrc: event.target.value })}
                />
              </AdminField>
              <AdminField label="Alt ảnh">
                <input
                  className={inputClass}
                  value={content.intro.imageAlt}
                  onChange={(event) => onIntroChange({ imageAlt: event.target.value })}
                />
              </AdminField>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "spotlights" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="Banner sản phẩm"
            description={`${content.spotlights.length} block sản phẩm trên homepage.`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={onSpotlightAdd}
                  data-testid="admin-spotlight-add"
                  className="h-9 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 normal-case tracking-normal text-base md:text-sm cursor-pointer"
                >
                  Thêm block
                </Button>
                {savedAtMap.spotlights ? (
                  <span className="text-base text-slate-500 md:text-sm">
                    Đã lưu: {savedAtMap.spotlights}
                  </span>
                ) : null}
                <Button
                  onClick={() => void onSaveGroup("spotlights")}
                  disabled={!dirtyMap.spotlights}
                  data-testid="admin-spotlight-save"
                  className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
                >
                  Lưu banner sản phẩm
                </Button>
              </div>
            }
          />
          <div className="mt-5 space-y-6" data-testid="admin-spotlights-list">
            {content.spotlights.map((spotlight, index) => (
              <div
                key={spotlight.id}
                data-testid="admin-spotlight-card"
                className={`rounded-xl border p-4 transition-colors ${
                  dragOverSpotlightIndex === index
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-slate-200"
                } ${draggingSpotlightIndex === index ? "opacity-70" : ""}`}
                onDragOver={(event) => handleSpotlightDragOver(event, index)}
                onDrop={(event) => handleSpotlightDrop(event, index)}
                onDragLeave={() => {
                  if (dragOverSpotlightIndex === index) {
                    setDragOverSpotlightIndex(null);
                  }
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900 md:text-sm">
                      Block {index + 1}
                    </p>
                    {content.spotlights.length <= MIN_SPOTLIGHT_BLOCKS ? (
                      <p className="text-sm text-slate-500">Tối thiểu 1 block.</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => handleSpotlightDragStart(event, index)}
                      onDragEnd={clearSpotlightDragState}
                      data-testid={`admin-spotlight-drag-${index}`}
                      aria-label={`Kéo thả block ${index + 1}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSpotlightMove(index, -1)}
                      disabled={index === 0}
                      data-testid={`admin-spotlight-move-up-${index}`}
                      className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                    >
                      <ChevronUp className="h-4 w-4" />
                      Lên
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSpotlightMove(index, 1)}
                      disabled={index === content.spotlights.length - 1}
                      data-testid={`admin-spotlight-move-down-${index}`}
                      className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                    >
                      <ChevronDown className="h-4 w-4" />
                      Xuống
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSpotlightDelete(index)}
                      disabled={content.spotlights.length <= MIN_SPOTLIGHT_BLOCKS}
                      data-testid={`admin-spotlight-delete-${index}`}
                      className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-base md:text-sm cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <AdminField label="Tiêu đề">
                    <input
                      className={inputClass}
                      value={spotlight.title}
                      onChange={(event) =>
                        onSpotlightChange(index, { title: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="CTA label">
                    <input
                      className={inputClass}
                      value={spotlight.ctaLabel}
                      onChange={(event) =>
                        onSpotlightChange(index, { ctaLabel: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Mô tả">
                    <textarea
                      className={textareaClass}
                      rows={5}
                      value={spotlight.description}
                      onChange={(event) =>
                        onSpotlightChange(index, { description: event.target.value })
                      }
                    />
                  </AdminField>
                  <div className="grid gap-4">
                    <AdminField label="CTA link">
                      <input
                        className={inputClass}
                        value={spotlight.ctaHref}
                        onChange={(event) =>
                          onSpotlightChange(index, { ctaHref: event.target.value })
                        }
                      />
                    </AdminField>
                    <AdminField label="Ảnh">
                      <input
                        className={inputClass}
                        value={spotlight.imageSrc}
                        onChange={(event) =>
                          onSpotlightChange(index, { imageSrc: event.target.value })
                        }
                      />
                    </AdminField>
                    <AdminField label="Alt ảnh">
                      <input
                        className={inputClass}
                        value={spotlight.imageAlt}
                        onChange={(event) =>
                          onSpotlightChange(index, { imageAlt: event.target.value })
                        }
                      />
                    </AdminField>
                  </div>
                  <div className="lg:col-span-2">
                    <AdminField label="Bullets" helper="Mỗi dòng là một bullet.">
                      <textarea
                        className={textareaClass}
                        rows={4}
                        value={spotlight.bullets.join("\n")}
                        onChange={(event) =>
                          onSpotlightBulletsChange(index, event.target.value)
                        }
                      />
                    </AdminField>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "features" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="Ưu điểm"
            description="3 khối ưu điểm trang chủ (icon giữ cố định, chỉ sửa text)."
            actions={renderSaveActions("features", "Lưu ưu điểm")}
          />
          <div className="mt-5 space-y-4">
            {content.features.map((feature, index) => (
              <div
                key={feature.id}
                className="rounded-xl border border-slate-200 p-4 grid gap-3"
              >
                <p className="text-base font-semibold text-slate-900 md:text-sm">
                  Ưu điểm {index + 1}
                </p>
                <AdminField label="Tiêu đề">
                  <input
                    className={inputClass}
                    value={feature.title}
                    onChange={(event) =>
                      onFeatureChange(index, { title: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="Mô tả">
                  <textarea
                    className={textareaClass}
                    value={feature.description}
                    onChange={(event) =>
                      onFeatureChange(index, { description: event.target.value })
                    }
                  />
                </AdminField>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "aboutTeaser" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="About-us block"
            description="Khối giới thiệu cuối trang chủ."
            actions={renderSaveActions("aboutTeaser", "Lưu about-us")}
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AdminField label="Eyebrow">
              <input
                className={inputClass}
                value={content.aboutTeaser.eyebrow}
                onChange={(event) => onAboutTeaserChange({ eyebrow: event.target.value })}
              />
            </AdminField>
            <AdminField label="Tiêu đề">
              <input
                className={inputClass}
                value={content.aboutTeaser.title}
                onChange={(event) => onAboutTeaserChange({ title: event.target.value })}
              />
            </AdminField>
            <AdminField label="Subtitle" helper="Mô tả ngắn dưới tiêu đề.">
              <textarea
                className={textareaClass}
                value={content.aboutTeaser.subtitle}
                onChange={(event) => onAboutTeaserChange({ subtitle: event.target.value })}
              />
            </AdminField>
            <div className="grid gap-4">
              <AdminField label="CTA chính">
                <input
                  className={inputClass}
                  value={content.aboutTeaser.primaryCtaLabel}
                  onChange={(event) =>
                    onAboutTeaserChange({ primaryCtaLabel: event.target.value })
                  }
                />
              </AdminField>
              <AdminField label="Link CTA chính">
                <input
                  className={inputClass}
                  value={content.aboutTeaser.primaryCtaHref}
                  onChange={(event) =>
                    onAboutTeaserChange({ primaryCtaHref: event.target.value })
                  }
                />
              </AdminField>
              <AdminField label="CTA phụ">
                <input
                  className={inputClass}
                  value={content.aboutTeaser.secondaryCtaLabel}
                  onChange={(event) =>
                    onAboutTeaserChange({ secondaryCtaLabel: event.target.value })
                  }
                />
              </AdminField>
              <AdminField label="Link CTA phụ">
                <input
                  className={inputClass}
                  value={content.aboutTeaser.secondaryCtaHref}
                  onChange={(event) =>
                    onAboutTeaserChange({ secondaryCtaHref: event.target.value })
                  }
                />
              </AdminField>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "promoPopup" ? (
        <AdminPromoPopupSection
          value={content.promoPopup}
          onChange={onPopupChange}
          onSave={() => void onSaveGroup("promoPopup")}
          isDirty={dirtyMap.promoPopup}
          savedAt={savedAtMap.promoPopup}
        />
      ) : null}

      {activeTab === "notifications" ? (
        <AdminNotificationsSection
          value={content.notifications}
          onChange={onNotificationChange}
          onSave={() => void onSaveGroup("notifications")}
          isDirty={dirtyMap.notifications}
          savedAt={savedAtMap.notifications}
        />
      ) : null}
    </div>
  );
}

function AdminProductsSection({
  products,
  categories,
  onReload,
  setError
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
  onReload: () => void;
  setError: (value: string) => void;
}) {
  const initialForm = {
    name: "",
    slug: "",
    price: "",
    compare_at_price: "",
    status: "published",
    featured: false,
    tags: "",
    sort_order: "0",
    description: ""
  };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const dialogScrollRef = useRef<HTMLDivElement | null>(null);

  const totalImages = existingImages.length + newImages.length;
  const canAddMore = totalImages < 10;
  const remainingSlots = Math.max(0, 10 - totalImages);
  const pageSize = 6;

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      if (
        term &&
        ![product.name, product.slug].some((value) =>
          value?.toLowerCase().includes(term)
        )
      ) {
        return false;
      }
      if (statusFilter && product.status !== statusFilter) {
        return false;
      }
      if (categoryFilter) {
        const categoryId = Number(categoryFilter);
        if (!product.categories?.some((category) => category.id === categoryId)) {
          return false;
        }
      }
      return true;
    });
  }, [products, query, statusFilter, categoryFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, categoryFilter, products.length]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * pageSize, page * pageSize),
    [filteredProducts, page, pageSize]
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setExistingImages([]);
    setNewImages([]);
    setImageUrlInput("");
    setSelectedCategories([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSelectProduct = (product: AdminProduct) => {
    const validExistingImages =
      product.images
        ?.map((image) => image.url?.trim())
        .filter((url): url is string => Boolean(url)) || [];

    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      price: String(product.price),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      status: product.status || "published",
      featured: product.featured,
      tags: product.tags || "",
      sort_order: String(product.sort_order || 0),
      description: product.description || ""
    });
    setSelectedCategories(product.categories?.map((cat) => cat.id) || []);
    setExistingImages(validExistingImages);
    setNewImages([]);
    setImageUrlInput("");
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleToggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleAddUrl = () => {
    setError("");
    const url = imageUrlInput.trim();
    if (!url) {
      return;
    }
    if (!url.startsWith("http")) {
      setError("Vui lng nhp URL hp l!.");
      return;
    }
    if (!canAddMore) {
      setError("Ti a 10 nh cho mi sn phm.");
      return;
    }
    if (existingImages.includes(url) || newImages.includes(url)) {
      setImageUrlInput("");
      return;
    }
    setNewImages((prev) => [...prev, url]);
    setImageUrlInput("");
  };

  const handleUploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    if (totalImages + files.length > 10) {
      setError("Ti a 10 nh cho mi sn phm.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadAdminFile(file)));
      setNewImages((prev) => [...prev, ...uploaded.map((item) => item.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thỒ tải ảnh lên.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDeleteProduct = async (product: AdminProduct) => {
    const confirmed = window.confirm(`Xóa sản phẩm "${product.name}"?`);
    if (!confirmed) {
      return;
    }
    setError("");
    try {
      await deleteAdminProduct(product.id);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thỒ xóa sản phẩm.");
    }
  };

  const handleSubmit = async () => {
    setError("");
    const total = existingImages.length + newImages.length;
    if (total < 3) {
      setError("Mỗi sản phẩm cần tối thiểu 3 ảnh.");
      return;
    }
    if (total > 10) {
      setError("Ti a 10 nh cho mi sn phm.");
      return;
    }
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Vui lòng nhập slug sản phẩm.");
      return;
    }

    const priceValue = Number(form.price || 0);
    if (!priceValue || Number.isNaN(priceValue)) {
      setError("Vui lng nhp gi bn hp l!.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: priceValue,
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
        status: form.status,
        featured: form.featured,
        tags: form.tags.trim(),
        sort_order: Number(form.sort_order || 0),
        description: form.description.trim(),
        category_ids: selectedCategories
      };

      const result = editingId
        ? await updateAdminProduct(editingId, payload)
        : await createAdminProduct(payload);

      const targetId = editingId || result.id;
      const offset = editingId ? existingImages.length : 0;
      for (const [index, url] of newImages.entries()) {
        await addAdminProductImage(targetId, { url, sort_order: offset + index });
      }

      setDialogOpen(false);
      resetForm();
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thỒ lưu sản phẩm.");
    }
  };

  const statusOptions = [
    { value: "published", label: "Đang bán" },
    { value: "hidden", label: "Ẩn" }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Quản lý sản phẩm"
          description="Theo di tn kho, cp nht gi v hnh nh sn phm."
          actions={
            <Button
              onClick={openCreateDialog}
              data-testid="admin-product-create"
              className="bg-[var(--color-cta)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              Thêm sản phẩm
            </Button>
          }
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <AdminField label="Tìm kiếm" helper="Theo tên hoặc slug sản phẩm.">
            <input
              className={inputClass}
              placeholder="Tìm theo tên hoặc slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Danh mục">
            <select
              className={selectClass}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] md:gap-3 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-500 md:text-sm">
            <span>Sản phẩm</span>
            <span>Giá</span>
            <span>Trạng thái</span>
            <span>Danh mục</span>
            <span className="text-right">Thao tác</span>
          </div>
          <div className="divide-y divide-slate-200">
            {pagedProducts.length ? (
              pagedProducts.map((product) => {
                const firstImage = product.images?.[0]?.url;
                const statusLabel = product.status === "published" ? "Đang bán" : "Ẩn";
                return (
                  <div
                    key={product.id}
                    className="grid gap-4 px-4 py-4 text-base md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] md:items-center md:text-sm transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                        {firstImage ? (
                          <Image
                            src={firstImage}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-base text-slate-400 md:text-sm">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-slate-500">/{product.slug}</p>
                        <div className="flex flex-wrap items-center gap-2 text-base text-slate-500 md:text-sm">
                          <span>Ảnh: {product.images?.length || 0}</span>
                          <span>Thứ tự: {product.sort_order}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-base font-semibold text-slate-900 md:text-sm">
                      {formatCurrency(product.price)}
                      {product.compare_at_price ? (
                        <p className="text-base text-slate-400 line-through md:text-sm">
                          {formatCurrency(product.compare_at_price)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-base text-slate-600 md:text-sm">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {statusLabel}
                      </span>
                      {product.featured ? (
                        <span className="rounded-full bg-[var(--color-cta)]/10 px-3 py-1 text-[var(--color-cta)]">
                          Nổi bật
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.categories?.length ? (
                        product.categories.map((category) => (
                          <span
                            key={category.id}
                            className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-base font-semibold text-[var(--color-primary)] md:text-sm"
                          >
                            {category.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-base text-slate-400 md:text-sm">
                          Chưa gắn danh mục
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectProduct(product)}
                        data-testid={`admin-product-edit-${product.id}`}
                        className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 text-base md:text-sm cursor-pointer"
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-base text-slate-500 md:text-sm">
                Cha c sn phm ph hp b lc.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-base text-slate-500 md:text-sm">
            Hiển thị {pagedProducts.length}/{filteredProducts.length} sản phẩm
          </span>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <AdminDialogContent className="max-w-5xl">
          <div
            ref={dialogScrollRef}
            className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-12"
          >
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
            </DialogTitle>
            <DialogDescription>
              Ti thiu 3 nh v ti a 10 nh cho mi sn phm. C th thm nh bng
              URL hoc ti trc tip.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <AdminSectionHeader
                  title="Thông tin cơ bản"
                  description="Tên, slug và mô tả ngắn cho sản phẩm."
                />
                <div className="mt-4 grid gap-4">
                  <AdminField label="Tên sản phẩm" helper="Hin th9 trn trang chi tit.">
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Slug sản phẩm" helper="Không dấu, dùng trong URL.">
                    <input
                      className={inputClass}
                      value={form.slug}
                      onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Mô tả ngắn" helper="Tóm tắt 1-2 câu về sản phẩm.">
                    <textarea
                      className={textareaClass}
                      value={form.description}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                    />
                  </AdminField>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <AdminSectionHeader
                  title="Giá & trạng thái"
                  description="Kim sot gi bn v hin th9."
                />
                <div className="mt-4 grid gap-4">
                  <AdminField label="Giá bán" helper="Nhp gi bn hi!n ti.">
                    <input
                      type="number"
                      className={inputClass}
                      value={form.price}
                      onChange={(event) => setForm({ ...form, price: event.target.value })}
                    />
                  </AdminField>
                  <AdminField
                    label="Giá niêm yết"
                    helper="B trng nu khng c gi gc."
                  >
                    <input
                      type="number"
                      className={inputClass}
                      value={form.compare_at_price}
                      onChange={(event) =>
                        setForm({ ...form, compare_at_price: event.target.value })
                      }
                    />
                  </AdminField>
                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminField label="Trạng thái">
                      <select
                        className={selectClass}
                        value={form.status}
                        onChange={(event) =>
                          setForm({ ...form, status: event.target.value })
                        }
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </AdminField>
                    <AdminField
                      label="Sản phẩm nổi bật"
                      helper="nh du  hin th9 n'i bật."
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(event) =>
                            setForm({ ...form, featured: event.target.checked })
                          }
                          className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
                        />
                        <span className="text-base font-semibold text-slate-700 md:text-sm">
                          Hiển thị nổi bật
                        </span>
                      </div>
                    </AdminField>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <AdminSectionHeader
                  title="Phân loại & sắp xếp"
                  description="Th v th t hin th9 trn danh sch."
                />
                <div className="mt-4 grid gap-4">
                  <AdminField
                    label="Thẻ sản phẩm"
                    helper="Ngăn cách bằng dấu phẩy."
                  >
                    <input
                      className={inputClass}
                      value={form.tags}
                      onChange={(event) => setForm({ ...form, tags: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Thứ tự hiển thị" helper="Số nhỏ hiển thị trước.">
                    <input
                      type="number"
                      className={inputClass}
                      value={form.sort_order}
                      onChange={(event) =>
                        setForm({ ...form, sort_order: event.target.value })
                      }
                    />
                  </AdminField>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <AdminSectionHeader
                  title="Danh mục"
                  description="Gắn sản phẩm vào danh mục phù hợp."
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.length ? (
                    categories.map((category) => {
                      const active = selectedCategories.includes(category.id);
                      return (
                        <label
                          key={category.id}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-base font-semibold transition cursor-pointer md:text-sm ${
                            active
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                              : "border-slate-200 text-slate-600 hover:border-[var(--color-primary)]/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => handleToggleCategory(category.id)}
                            className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
                          />
                          {category.name}
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-base text-slate-500 md:text-sm">
                      Cha c danh mc  chn.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <AdminSectionHeader
                  title="Hình ảnh sản phẩm"
                  description="Ti thiu 3 nh v ti a 10 nh."
                />
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-base font-semibold text-slate-700 md:text-sm">
                      Thêm ảnh bằng URL
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        className={`${inputClass} flex-1`}
                        placeholder="https://..."
                        value={imageUrlInput}
                        onChange={(event) => setImageUrlInput(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddUrl}
                        disabled={!canAddMore}
                        className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                      >
                        Thêm URL
                      </Button>
                    </div>
                    <p className="text-base text-slate-500 md:text-xs">
                      Dng URL bt u bng http(s). Cn trng {remainingSlots} ảnh.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-base font-semibold text-slate-700 md:text-sm">
                      Tải ảnh từ máy
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleUploadFiles}
                      disabled={!canAddMore || uploading}
                      className="text-base text-slate-600 md:text-sm cursor-pointer"
                    />
                    {uploading ? (
                      <p className="text-base text-slate-500 md:text-sm">
                        Đang tải ảnh lên...
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {existingImages.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        className="relative h-24 overflow-hidden rounded-xl border border-slate-200"
                      >
                        <Image
                          src={url}
                          alt={`Ảnh hiện có ${index + 1}`}
                          fill
                          sizes="(min-width: 640px) 160px, 50vw"
                          className="object-cover"
                        />
                        <span className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-1 text-xs text-white">
                          Hi!n c
                        </span>
                      </div>
                    ))}
                    {newImages.map((url, index) => (
                      <div
                        key={`new-${index}`}
                        className="relative h-24 overflow-hidden rounded-xl border border-slate-200"
                      >
                        <Image
                          src={url}
                          alt={`Ảnh mới ${index + 1}`}
                          fill
                          sizes="(min-width: 640px) 160px, 50vw"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                        >
                          Gỡ
                        </button>
                      </div>
                    ))}
                    {existingImages.length + newImages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-base text-slate-500 md:text-sm">
                        Chưa có ảnh nào.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              {editingId ? "Lưu sản phẩm" : "Tạo sản phẩm"}
            </Button>
          </div>
          </div>

          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            <button
              type="button"
              aria-label="Cu'n lên u"
              onClick={() =>
                dialogScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Cuộn xuống cuối"
              onClick={() => {
                const container = dialogScrollRef.current;
                if (!container) return;
                container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}

function AdminCategoriesSection({
  categories,
  onReload,
  setError
}: {
  categories: AdminCategory[];
  onReload: () => void;
  setError: (value: string) => void;
}) {
  const initialForm = {
    name: "",
    slug: "",
    description: "",
    sort_order: "0"
  };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return categories;
    }
    return categories.filter((category) =>
      [category.name, category.slug].some((value) =>
        value?.toLowerCase().includes(term)
      )
    );
  }, [categories, query]);

  useEffect(() => {
    setPage(1);
  }, [query, categories.length]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const pagedCategories = useMemo(
    () => filteredCategories.slice((page - 1) * pageSize, page * pageSize),
    [filteredCategories, page, pageSize]
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Vui lòng nhập slug danh mục.");
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        sort_order: Number(form.sort_order || 0)
      };
      if (editingId) {
        await updateAdminCategory(editingId, payload);
      } else {
        await createAdminCategory(payload);
      }
      resetForm();
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thỒ lưu danh mục.");
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      sort_order: String(category.sort_order || 0)
    });
  };

  const handleDelete = async (category: AdminCategory) => {
    const confirmed = window.confirm(`Xóa danh mục "${category.name}"?`);
    if (!confirmed) {
      return;
    }
    setError("");
    try {
      await deleteAdminCategory(category.id);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thỒ xóa danh mục.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Danh mục sản phẩm"
          description="Qun l danh mc  lc v sp xp sn phm."
        />
        <div className="mt-4 grid gap-4">
          <AdminField label="Tìm kiếm" helper="Theo tên hoặc slug danh mục.">
            <input
              className={inputClass}
              placeholder="Tìm theo tên hoặc slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
        </div>

        <div className="mt-4 divide-y divide-slate-200">
          {pagedCategories.length ? (
            pagedCategories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4"
              >
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-900 md:text-sm">
                    {category.name}
                  </p>
                  <p className="text-base text-slate-500 md:text-sm">/{category.slug}</p>
                  {category.description ? (
                    <p className="text-base text-slate-600 md:text-sm">
                      {category.description}
                    </p>
                  ) : (
                    <p className="text-base text-slate-400 md:text-sm">
                      Chưa có mô tả.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-base text-slate-600 md:text-sm">
                    Thứ tự: {category.sort_order}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 text-base md:text-sm cursor-pointer"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-base text-slate-500 md:text-sm">
              Cha c danh mc ph hp b lc.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-base text-slate-500 md:text-sm">
            Tổng {filteredCategories.length} danh mục
          </span>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title={editingId ? "Cập nhật danh mục" : "Tạo danh mục"}
          description="Cp nht thng tin hin th9 cho danh mc."
        />
        <div className="mt-4 grid gap-4">
          <AdminField label="Tên danh mục" helper="Hin th9 trn menu v sn phm.">
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </AdminField>
          <AdminField label="Slug danh mục" helper="Không dấu, dùng trong URL.">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Mô tả"
            helper="Gi:i thi!u ngn gn gip khch d& la chn."
          >
            <textarea
              className={textareaClass}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </AdminField>
          <AdminField label="Thứ tự hiển thị" helper="Số nhỏ hiển thị trước.">
            <input
              type="number"
              className={inputClass}
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
            />
          </AdminField>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSubmit}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              {editingId ? "Lưu danh mục" : "Tạo danh mục"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={resetForm}
                className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
              >
                Hủy
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPostsSection({
  posts,
  onReload,
  setError
}: {
  posts: AdminPost[];
  onReload: () => void;
  setError: (value: string) => void;
}) {
  const initialForm = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    status: "published",
    tags: "",
    sort_order: "0",
    published_at: ""
  };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredPosts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (statusFilter && post.status !== statusFilter) return false;
      if (!term) return true;
      return [post.title, post.slug].some((value) =>
        value?.toLowerCase().includes(term)
      );
    });
  }, [posts, query, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, posts.length]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const pagedPosts = useMemo(
    () => filteredPosts.slice((page - 1) * pageSize, page * pageSize),
    [filteredPosts, page, pageSize]
  );

  const handleSubmit = async () => {
    setError("");
    if (!form.title.trim()) {
      setError("Vui lng nhp tiu  bi vit.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Vui lòng nhập slug bài viết.");
      return;
    }
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        cover_image: form.cover_image.trim(),
        status: form.status,
        tags: form.tags.trim(),
        sort_order: Number(form.sort_order || 0),
        published_at: form.published_at
      };

      if (editingId) {
        await updateAdminPost(editingId, payload);
      } else {
        await createAdminPost(payload);
      }

      setForm(initialForm);
      setEditingId(null);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thỒ lưu bài viết.");
    }
  };

  const statusOptions = [
    { value: "published", label: "ang hin th9" },
    { value: "hidden", label: "Đang ẩn" }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Tin tức & kiến thức"
          description="Cập nhật bài viết, tin tức và kiến thức nhà nông."
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminField label="Tìm kiếm" helper="Theo tiu  hoc slug.">
            <input
              className={inputClass}
              placeholder="Tm theo tiu  hoc slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        <div className="mt-4 divide-y divide-slate-200">
          {pagedPosts.length ? (
            pagedPosts.map((post) => {
              const statusLabel =
                statusOptions.find((option) => option.value === post.status)?.label ||
                post.status;
              return (
                <div
                  key={post.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-4"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900 md:text-sm">
                      {post.title}
                    </p>
                    <p className="text-base text-slate-500 md:text-sm">/{post.slug}</p>
                    <p className="text-base text-slate-500 md:text-sm">
                      Trạng thái: {statusLabel}
                    </p>
                    {post.published_at ? (
                      <p className="text-base text-slate-400 md:text-sm">
                        Ngy ng: {post.published_at}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(post.id);
                        setForm({
                          title: post.title,
                          slug: post.slug,
                          excerpt: post.excerpt,
                          content: post.content,
                          cover_image: post.cover_image,
                          status: post.status || "published",
                          tags: post.tags || "",
                          sort_order: String(post.sort_order || 0),
                          published_at: post.published_at || ""
                        });
                      }}
                      className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deleteAdminPost(post.id)
                          .then(onReload)
                          .catch((err) =>
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Không thỒ xóa bài viết."
                            )
                          )
                      }
                      className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 text-base md:text-sm cursor-pointer"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-base text-slate-500 md:text-sm">
              Cha c bi vit ph hp b lc.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-base text-slate-500 md:text-sm">
            Tổng {filteredPosts.length} bài viết
          </span>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title={editingId ? "Cập nhật bài viết" : "Tạo bài viết"}
          description="Qun l n'i dung tin tức và kiến thức."
        />
        <div className="mt-4 grid gap-4">
          <AdminField label="Tiu " helper="Tiu  hin th9 trn trang bi vit.">
            <input
              className={inputClass}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </AdminField>
          <AdminField label="Slug" helper="Không dấu, dùng trong URL.">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="URL ảnh bìa"
            helper="Dng nh ba t l! ngang (1200x630)."
          >
            <input
              className={inputClass}
              value={form.cover_image}
              onChange={(event) => setForm({ ...form, cover_image: event.target.value })}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <select
              className={selectClass}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Thẻ" helper="Ngăn cách bằng dấu phẩy.">
            <input
              className={inputClass}
              value={form.tags}
              onChange={(event) => setForm({ ...form, tags: event.target.value })}
            />
          </AdminField>
          <AdminField label="Thứ tự" helper="Số nhỏ hiển thị trước.">
            <input
              type="number"
              className={inputClass}
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Ngy ng"
            helper="9nh dng YYYY-MM-DD HH:MM:SS (tu chn)."
          >
            <input
              className={inputClass}
              value={form.published_at}
              onChange={(event) =>
                setForm({ ...form, published_at: event.target.value })
              }
            />
          </AdminField>
          <AdminField
            label="Trích dẫn"
            helper="on m t ngn hin th9 x danh sch."
          >
            <textarea
              className={textareaClass}
              value={form.excerpt}
              onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
            />
          </AdminField>
          <AdminField label="Nội dung" helper="Nội dung chi tiết bài viết.">
            <textarea
              className={`${textareaClass} min-h-[160px]`}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
            />
          </AdminField>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSubmit}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              {editingId ? "Lưu bài viết" : "Tạo bài viết"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setForm(initialForm);
                  setEditingId(null);
                }}
                className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
              >
                Hủy
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminQnASection({
  items,
  onReload,
  setError
}: {
  items: AdminQnA[];
  onReload: () => void;
  setError: (value: string) => void;
}) {
  const initialForm = { question: "", answer: "", status: "published", sort_order: "0" };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!term) return true;
      return item.question?.toLowerCase().includes(term);
    });
  }, [items, query, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, items.length]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = useMemo(
    () => filteredItems.slice((page - 1) * pageSize, page * pageSize),
    [filteredItems, page, pageSize]
  );

  const handleSubmit = async () => {
    setError("");
    if (!form.question.trim()) {
      setError("Vui lòng nhập câu hỏi.");
      return;
    }
    if (!form.answer.trim()) {
      setError("Vui lòng nhập câu trả lời.");
      return;
    }
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        status: form.status,
        sort_order: Number(form.sort_order || 0)
      };

      if (editingId) {
        await updateAdminQnA(editingId, payload);
      } else {
        await createAdminQnA(payload);
      }

      setForm(initialForm);
      setEditingId(null);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khng th lu hi p.");
    }
  };

  const statusOptions = [
    { value: "published", label: "ang hin th9" },
    { value: "hidden", label: "Đang ẩn" }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Hi p"
          description="Qun l cu hi thng gp v n'i dung h tr."
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminField label="Tìm kiếm" helper="Theo câu hỏi.">
            <input
              className={inputClass}
              placeholder="Tìm theo câu hỏi"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        <div className="mt-4 divide-y divide-slate-200">
          {pagedItems.length ? (
            pagedItems.map((item) => {
              const statusLabel =
                statusOptions.find((option) => option.value === item.status)?.label ||
                item.status;
              return (
                <div key={item.id} className="py-4">
                  <p className="text-base font-semibold text-slate-900 md:text-sm">
                    {item.question}
                  </p>
                  <p className="mt-2 text-base text-slate-600 md:text-sm">
                    {item.answer}
                  </p>
                  <p className="mt-2 text-base text-slate-500 md:text-sm">
                    Trạng thái: {statusLabel}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({
                          question: item.question,
                          answer: item.answer,
                          status: item.status || "published",
                          sort_order: String(item.sort_order || 0)
                        });
                      }}
                      className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deleteAdminQnA(item.id)
                          .then(onReload)
                          .catch((err) =>
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Khng th xa hi p."
                            )
                          )
                      }
                      className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 text-base md:text-sm cursor-pointer"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-base text-slate-500 md:text-sm">
              Cha c hi p ph hp b lc.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-base text-slate-500 md:text-sm">
            Tổng {filteredItems.length} hi p
          </span>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title={editingId ? "Cp nht hi p" : "To hi p"}
          description="Son n'i dung trả lời cho khách hàng."
        />
        <div className="mt-4 grid gap-4">
          <AdminField label="Câu hỏi" helper="Nhập câu hỏi thường gặp.">
            <input
              className={inputClass}
              value={form.question}
              onChange={(event) => setForm({ ...form, question: event.target.value })}
            />
          </AdminField>
          <AdminField label="Trả lời" helper="Nội dung trả lời chi tiết.">
            <textarea
              className={textareaClass}
              value={form.answer}
              onChange={(event) => setForm({ ...form, answer: event.target.value })}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <select
              className={selectClass}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Thứ tự" helper="Số nhỏ hiển thị trước.">
            <input
              type="number"
              className={inputClass}
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
            />
          </AdminField>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSubmit}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              {editingId ? "Lu hi p" : "To hi p"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setForm(initialForm);
                  setEditingId(null);
                }}
                className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
              >
                Hủy
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOrdersSection({
  orders,
  onReload,
  setError
}: {
  orders: AdminOrder[];
  onReload: () => void;
  setError: (value: string) => void;
}) {
  const statusOptions = ["pending", "confirmed", "shipping", "completed", "cancelled"];
  const paymentOptions = ["pending", "proof_submitted", "paid", "rejected"];
  const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy"
  };
  const paymentLabels: Record<string, string> = {
    pending: "Chờ thanh toán",
    proof_submitted: "Đã gửi chứng từ",
    paid: "Đã thanh toán",
    rejected: "Từ chối"
  };
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  type OrderEdit = {
    customer_name: string;
    email: string;
    phone: string;
    address: string;
    note: string;
    delivery_time: string;
    status: string;
    payment_status: string;
    admin_note: string;
  };
  const [edits, setEdits] = useState<Record<number, OrderEdit>>({});

  useEffect(() => {
    const next: Record<number, OrderEdit> = {};
    orders.forEach((order) => {
      next[order.id] = {
        customer_name: order.customer_name || "",
        email: order.email || "",
        phone: order.phone || "",
        address: order.address || "",
        note: order.note || "",
        delivery_time: order.delivery_time || "",
        status: order.status || "pending",
        payment_status: order.payment_status || "pending",
        admin_note: order.admin_note || ""
      };
    });
    setEdits(next);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (paymentFilter && order.payment_status !== paymentFilter) return false;
      if (!term) return true;
      return [
        order.order_number,
        order.customer_name,
        order.phone,
        order.email
      ].some((value) => value?.toLowerCase().includes(term));
    });
  }, [orders, statusFilter, paymentFilter, query]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentFilter, query, orders.length]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, page, pageSize]
  );

  const updateEdit = (id: number, patch: Partial<OrderEdit>) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch }
    }));
  };

  const handleUpdate = async (order: AdminOrder) => {
    const edit = edits[order.id];
    if (!edit) return;
    try {
      await updateAdminOrder(order.id, {
        customer_name: edit.customer_name,
        email: edit.email,
        phone: edit.phone,
        address: edit.address,
        note: edit.note,
        delivery_time: edit.delivery_time,
        status: edit.status,
        payment_status: edit.payment_status,
        admin_note: edit.admin_note
      });
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khng th cp nht đơn hàng.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Qun l đơn hàng"
          description="Theo dõi trạng thái giao hàng và thanh toán."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <AdminField label="Tìm kiếm" helper="Theo m n, tn, i!n thoi.">
            <input
              className={inputClass}
              placeholder="Tm theo m n hoc khch hng"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
          <AdminField label="Trng thi n">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value] || value}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Trạng thái thanh toán">
            <select
              className={selectClass}
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {paymentOptions.map((value) => (
                <option key={value} value={value}>
                  {paymentLabels[value] || value}
                </option>
              ))}
            </select>
          </AdminField>
        </div>
      </div>

      {pagedOrders.length ? (
        pagedOrders.map((order) => {
          const edit = edits[order.id];
          return (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-sm">
                    {order.order_number}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(order.total)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-slate-600 md:text-sm">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {statusLabels[order.status] || order.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {paymentLabels[order.payment_status] || order.payment_status}
                    </span>
                    <span>Giao hàng: {order.shipping_method || "standard"}</span>
                  </div>
                  {order.promo_code ? (
                    <p className="mt-2 text-base text-slate-500 md:text-sm">
                      Mã khuyến mãi: {order.promo_code}
                    </p>
                  ) : null}
                </div>
                <div className="text-base text-slate-600 md:text-sm">
                  <p className="font-semibold text-slate-900">{order.customer_name}</p>
                  <p>{order.phone}</p>
                  <p>{order.email}</p>
                </div>
              </div>

              {edit ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <AdminField label="Tên khách hàng">
                    <input
                      className={inputClass}
                      value={edit.customer_name}
                      onChange={(event) =>
                        updateEdit(order.id, { customer_name: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Email">
                    <input
                      className={inputClass}
                      value={edit.email}
                      onChange={(event) => updateEdit(order.id, { email: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="S i!n thoi">
                    <input
                      className={inputClass}
                      value={edit.phone}
                      onChange={(event) => updateEdit(order.id, { phone: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="9a ch0">
                    <input
                      className={inputClass}
                      value={edit.address}
                      onChange={(event) =>
                        updateEdit(order.id, { address: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Thời gian giao">
                    <input
                      className={inputClass}
                      value={edit.delivery_time}
                      onChange={(event) =>
                        updateEdit(order.id, { delivery_time: event.target.value })
                      }
                    />
                  </AdminField>
                  <AdminField label="Ghi ch đơn hàng">
                    <textarea
                      className={textareaClass}
                      value={edit.note}
                      onChange={(event) => updateEdit(order.id, { note: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Trng thi n">
                    <select
                      className={selectClass}
                      value={edit.status}
                      onChange={(event) =>
                        updateEdit(order.id, { status: event.target.value })
                      }
                    >
                      {statusOptions.map((value) => (
                        <option key={value} value={value}>
                          {statusLabels[value] || value}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                  <AdminField label="Trạng thái thanh toán">
                    <select
                      className={selectClass}
                      value={edit.payment_status}
                      onChange={(event) =>
                        updateEdit(order.id, { payment_status: event.target.value })
                      }
                    >
                      {paymentOptions.map((value) => (
                        <option key={value} value={value}>
                          {paymentLabels[value] || value}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                </div>
              ) : null}

              <div className="mt-4">
                <AdminField label="Ghi ch n'i b'" helper="Ch0 hin th9 cho qun tr9 vin.">
                  <textarea
                    className={textareaClass}
                    value={edit?.admin_note || ""}
                    onChange={(event) =>
                      updateEdit(order.id, { admin_note: event.target.value })
                    }
                  />
                </AdminField>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdate(order)}
                    className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                  >
                    Lu đơn hàng
                  </Button>
                  {order.payment_proof_url ? (
                    <a
                      href={order.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base font-semibold text-[var(--color-primary)] hover:underline md:text-sm"
                    >
                      Xem chứng từ thanh toán
                    </a>
                  ) : null}
                </div>
              </div>

              {order.items?.length ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-600 md:text-sm">
                  <p className="font-semibold text-slate-700">Sn phm trong n</p>
                  <div className="mt-2 space-y-2">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.product_id}`} className="flex justify-between">
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span>{formatCurrency(item.unit_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-base text-slate-500 md:text-sm">
          Cha c đơn hàng ph hp b lc.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-base text-slate-500 md:text-sm">
          Hiển thị {pagedOrders.length}/{filteredOrders.length} đơn hàng
        </span>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

function AdminPaymentsSection({
  settings,
  onSave,
  setError
}: {
  settings: PaymentSettings | null;
  onSave: (value: PaymentSettings) => void;
  setError: (value: string) => void;
}) {
  const [form, setForm] = useState<PaymentSettings>(
    settings || {
      id: 1,
      cod_enabled: true,
      bank_transfer_enabled: true,
      bank_qr_enabled: true,
      bank_name: "",
      bank_account: "",
      bank_holder: "",
      bank_id: "",
      bank_qr_template: "compact2",
      bank_qr_payload: ""
    }
  );

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        bank_qr_payload: settings.bank_qr_payload || ""
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      const updated = await updatePaymentSettings(form);
      onSave(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thỒ cập nhật thanh toán.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <AdminSectionHeader
        title="Cấu hình thanh toán"
        description="Thiết lập các phương thức thanh toán và thông tin chuyỒn khoản."
      />
      <div className="mt-5 grid gap-4">
        <div className="grid gap-3">
          <label className="flex items-center gap-2 text-base font-semibold text-slate-700 md:text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.cod_enabled}
              onChange={(event) => setForm({ ...form, cod_enabled: event.target.checked })}
              className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
            />
            Thanh toán khi nhận hàng (COD)
          </label>
          <label className="flex items-center gap-2 text-base font-semibold text-slate-700 md:text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.bank_transfer_enabled}
              onChange={(event) =>
                setForm({ ...form, bank_transfer_enabled: event.target.checked })
              }
              className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
            />
            ChuyỒn khoản ngân hàng
          </label>
          <label className="flex items-center gap-2 text-base font-semibold text-slate-700 md:text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.bank_qr_enabled}
              onChange={(event) => setForm({ ...form, bank_qr_enabled: event.target.checked })}
              className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
            />
            Thanh toán QR ngân hàng
          </label>
        </div>

        <AdminField label="Ngân hàng" helper="Tên ngân hàng nhận chuyỒn khoản.">
          <input
            className={inputClass}
            value={form.bank_name}
            onChange={(event) => setForm({ ...form, bank_name: event.target.value })}
          />
        </AdminField>
        <AdminField label="S ti khon" helper="S ti khon ngđơn hàng.">
          <input
            className={inputClass}
            value={form.bank_account}
            onChange={(event) => setForm({ ...form, bank_account: event.target.value })}
          />
        </AdminField>
        <AdminField label="Chủ tài khoản" helper="Tên chủ tài khoản.">
          <input
            className={inputClass}
            value={form.bank_holder}
            onChange={(event) => setForm({ ...form, bank_holder: event.target.value })}
          />
        </AdminField>
        <AdminField label="Mã ngân hàng" helper="Mã ngân hàng theo VietQR (tùy chọn).">
          <input
            className={inputClass}
            value={form.bank_id}
            onChange={(event) => setForm({ ...form, bank_id: event.target.value })}
          />
        </AdminField>
        <AdminField
          label="Quick Link VietQR"
          helper="Dn link VietQR  t 'ng hiỒn th9 m QR thanh ton."
        >
          <input
            className={inputClass}
            placeholder="https://img.vietqr.io/image/vcb-0123456789-compact2.png?accountName=NGUYEN%20VAN%20A"
            value={form.bank_qr_payload}
            onChange={(event) => setForm({ ...form, bank_qr_payload: event.target.value })}
          />
        </AdminField>

        <Button
          onClick={handleSave}
          className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
        >
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
}


function AdminAboutSection({
  value,
  onChange,
  onSave,
  isDirty,
  savedAt,
  setError
}: {
  value: AboutPageContent;
  onChange: (next: AboutPageContent) => void;
  onSave: () => void;
  isDirty: boolean;
  savedAt: string | null;
  setError: (value: string) => void;
}) {
  const initialSlideForm = {
    tag: "",
    title: "",
    description: "",
    bullets: "",
    image: "",
    imageAlt: "",
    ctaLabel: "",
    ctaHref: ""
  };
  const [slideForm, setSlideForm] = useState(initialSlideForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const heroPillsValue = useMemo(() => value.hero.pills.join("\n"), [value.hero.pills]);

  const updateHero = (patch: Partial<AboutPageContent["hero"]>) => {
    onChange({
      ...value,
      hero: {
        ...value.hero,
        ...patch
      }
    });
  };

  const handleHeroPillsChange = (input: string) => {
    const pills = input
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    updateHero({ pills });
  };

  const handleStatChange = (index: number, patch: Partial<AboutPageContent["stats"][0]>) => {
    const next = value.stats.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    onChange({ ...value, stats: next });
  };

  const addStat = () => {
    onChange({
      ...value,
      stats: [...value.stats, { value: "", label: "" }]
    });
  };

  const removeStat = (index: number) => {
    onChange({
      ...value,
      stats: value.stats.filter((_, idx) => idx !== index)
    });
  };

  const handleContactChange = (patch: Partial<AboutPageContent["contact"]>) => {
    onChange({
      ...value,
      contact: {
        ...value.contact,
        ...patch
      }
    });
  };

  const handleStoryChange = (next: string) => {
    onChange({
      ...value,
      storyHtml: next
    });
  };

  const resetSlideForm = () => {
    setSlideForm(initialSlideForm);
    setEditingId(null);
  };

  const handleSlideEdit = (slide: AboutSlide) => {
    setEditingId(slide.id);
    setSlideForm({
      tag: slide.tag,
      title: slide.title,
      description: slide.description,
      bullets: slide.bullets.join("\n"),
      image: slide.image,
      imageAlt: slide.imageAlt,
      ctaLabel: slide.ctaLabel,
      ctaHref: slide.ctaHref
    });
  };

  const handleSlideDelete = (slide: AboutSlide) => {
    const confirmed = window.confirm(`Xóa slide "${slide.title}"?`);
    if (!confirmed) {
      return;
    }
    onChange({
      ...value,
      slides: value.slides.filter((item) => item.id !== slide.id)
    });
  };

  const handleSlideSubmit = () => {
    setError("");
    if (!slideForm.title.trim()) {
      setError("Vui lng nhp tiu  slide.");
      return;
    }
    if (!slideForm.image.trim()) {
      setError("Vui lòng nhập URL ảnh cho slide.");
      return;
    }

    const bullets = slideForm.bullets
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const tagValue = slideForm.tag.trim() || `Chặng ${(value.slides.length + 1).toString().padStart(2, "0")}`;
    const payload: AboutSlide = {
      id: editingId || `about-slide-${Date.now()}`,
      tag: tagValue,
      title: slideForm.title.trim(),
      description: slideForm.description.trim(),
      bullets,
      image: slideForm.image.trim(),
      imageAlt: slideForm.imageAlt.trim() || slideForm.title.trim(),
      ctaLabel: slideForm.ctaLabel.trim() || "Lin h! t vn",
      ctaHref: slideForm.ctaHref.trim() || "/pages/lien-he"
    };

    const nextSlides = editingId
      ? value.slides.map((item) => (item.id === editingId ? payload : item))
      : [...value.slides, payload];

    onChange({
      ...value,
      slides: nextSlides
    });
    resetSlideForm();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="Trang giới thiệu"
            description="Cp nht n'i dung hiỒn th9 trn trang gi:i thi!u. H tr nh v CTA theo tng slide."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {savedAt ? (
                  <span className="text-base text-slate-500 md:text-sm">Đã lưu: {savedAt}</span>
                ) : null}
                <Button
                  onClick={onSave}
                  disabled={!isDirty}
                  className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
                >
                  Lưu trang giới thiệu
                </Button>
              </div>
            }
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AdminField label="Eyebrow" helper="V d: Gi:i thi!u">
              <input
                className={inputClass}
                value={value.hero.eyebrow}
                onChange={(event) => updateHero({ eyebrow: event.target.value })}
              />
            </AdminField>
            <AdminField label="Tiu  chnh" helper="Tiu  l:n hin th9 x phn u trang.">
              <input
                className={inputClass}
                value={value.hero.title}
                onChange={(event) => updateHero({ title: event.target.value })}
              />
            </AdminField>
            <AdminField label="Mô tả" helper="on gi:i thi!u ngn bn d:i tiu .">
              <textarea
                className={textareaClass}
                value={value.hero.lead}
                onChange={(event) => updateHero({ lead: event.target.value })}
              />
            </AdminField>
            <AdminField label="Ảnh hero" helper="Kch th:c gi  1400x900px.">
              <input
                className={inputClass}
                value={value.hero.image}
                onChange={(event) => updateHero({ image: event.target.value })}
              />
            </AdminField>
            <AdminField label="Alt ảnh hero" helper="Mô tả ảnh cho SEO.">
              <input
                className={inputClass}
                value={value.hero.imageAlt}
                onChange={(event) => updateHero({ imageAlt: event.target.value })}
              />
            </AdminField>
            <AdminField label="CTA chính" helper="Nt lin h! n'i bật.">
              <input
                className={inputClass}
                value={value.hero.ctaLabel}
                onChange={(event) => updateHero({ ctaLabel: event.target.value })}
              />
            </AdminField>
            <AdminField label="Link CTA chính" helper="Ví dụ: /pages/lien-he">
              <input
                className={inputClass}
                value={value.hero.ctaHref}
                onChange={(event) => updateHero({ ctaHref: event.target.value })}
              />
            </AdminField>
            <AdminField label="CTA phụ" helper="Nt ph x phn hero.">
              <input
                className={inputClass}
                value={value.hero.secondaryLabel}
                onChange={(event) => updateHero({ secondaryLabel: event.target.value })}
              />
            </AdminField>
            <AdminField label="Link CTA phụ" helper="Ví dụ: /pages/hoi-dap-cung-nha-nong">
              <input
                className={inputClass}
                value={value.hero.secondaryHref}
                onChange={(event) => updateHero({ secondaryHref: event.target.value })}
              />
            </AdminField>
            <AdminField label="Pill highlights" helper="Mi dng l m't nhãn n'i bt.">
              <textarea
                className={textareaClass}
                value={heroPillsValue}
                onChange={(event) => handleHeroPillsChange(event.target.value)}
              />
            </AdminField>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader title="Chỉ số nổi bật" description="Các con số tạo niềm tin trên trang giới thiệu." />
          <div className="mt-4 grid gap-4">
            {value.stats.map((stat, index) => (
              <div
                key={`${stat.label}-${index}`}
                className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.4fr_auto]"
              >
                <input
                  className={inputClass}
                  placeholder="Ví dụ: 3.000+"
                  value={stat.value}
                  onChange={(event) => handleStatChange(index, { value: event.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="M t ch0 s"
                  value={stat.label}
                  onChange={(event) => handleStatChange(index, { label: event.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStat(index)}
                  className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 text-base md:text-sm cursor-pointer"
                >
                  Xóa
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addStat}
              className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
            >
              Thm ch0 s
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="Nội dung chi tiết"
            description="C th dng HTML (p, h3, ul, li). Nội dung này hiỒn th9 nh m't slide di."
          />
          <div className="mt-4">
            <textarea
              className={textareaClass}
              value={value.storyHtml || ""}
              onChange={(event) => handleStoryChange(event.target.value)}
              rows={8}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader title="CTA cuối trang" description="Khi ku gi lin h! cui trang gi:i thi!u." />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminField label="Tiu " helper="Dng tiu  ku gi hnh 'ng.">
              <input
                className={inputClass}
                value={value.contact.title}
                onChange={(event) => handleContactChange({ title: event.target.value })}
              />
            </AdminField>
            <AdminField label="Nội dung" helper="M t ngn bn d:i tiu .">
              <textarea
                className={textareaClass}
                value={value.contact.description}
                onChange={(event) => handleContactChange({ description: event.target.value })}
              />
            </AdminField>
            <AdminField label="Nút CTA" helper="Ví dụ: Gửi yêu cầu.">
              <input
                className={inputClass}
                value={value.contact.ctaLabel}
                onChange={(event) => handleContactChange({ ctaLabel: event.target.value })}
              />
            </AdminField>
            <AdminField label="Link CTA" helper="Ví dụ: /pages/lien-he">
              <input
                className={inputClass}
                value={value.contact.ctaHref}
                onChange={(event) => handleContactChange({ ctaHref: event.target.value })}
              />
            </AdminField>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="Danh sách slide"
            description="Cc slide gi:i thi!u hin th9 theo chiu dc trn trang."
          />
          <div className="mt-4 space-y-4">
            {value.slides.length ? (
              value.slides.map((slide) => (
                <div
                  key={slide.id}
                  className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 p-4"
                >
                  <div className="h-20 w-32 overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={slide.image}
                      alt={slide.imageAlt}
                      width={128}
                      height={80}
                      className="h-full w-full object-cover"
                      sizes="128px"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-slate-900 md:text-sm">{slide.title}</p>
                    <p className="text-base text-slate-500 md:text-sm">
                      {slide.tag}  CTA: {slide.ctaLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSlideEdit(slide)}
                      className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSlideDelete(slide)}
                      className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 text-base md:text-sm cursor-pointer"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-base text-slate-500 md:text-sm">
                Cha c slide no. Hy to slide u tin.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title={editingId ? "Cập nhật slide" : "Tạo slide mới"}
            description="Mi slide gm hnh nh, m t v nt lin h!."
          />
          <div className="mt-4 grid gap-4">
            <AdminField label="Tag" helper="V d: Chng 01 (c th  trng).">
              <input
                className={inputClass}
                value={slideForm.tag}
                onChange={(event) => setSlideForm({ ...slideForm, tag: event.target.value })}
              />
            </AdminField>
            <AdminField label="Tiu " helper="Tiu  chnh ca slide.">
              <input
                className={inputClass}
                value={slideForm.title}
                onChange={(event) => setSlideForm({ ...slideForm, title: event.target.value })}
              />
            </AdminField>
            <AdminField label="Mô tả" helper="Đoạn mô tả ngắn.">
              <textarea
                className={textareaClass}
                value={slideForm.description}
                onChange={(event) => setSlideForm({ ...slideForm, description: event.target.value })}
              />
            </AdminField>
            <AdminField label="Danh sách bullet" helper="Mi dng l m't bullet.">
              <textarea
                className={textareaClass}
                value={slideForm.bullets}
                onChange={(event) => setSlideForm({ ...slideForm, bullets: event.target.value })}
              />
            </AdminField>
            <AdminField label="Ảnh slide" helper="URL ảnh (ưu tiên 1200x800px).">
              <input
                className={inputClass}
                value={slideForm.image}
                onChange={(event) => setSlideForm({ ...slideForm, image: event.target.value })}
              />
            </AdminField>
            <AdminField label="Alt ảnh" helper="Mô tả ảnh cho SEO.">
              <input
                className={inputClass}
                value={slideForm.imageAlt}
                onChange={(event) => setSlideForm({ ...slideForm, imageAlt: event.target.value })}
              />
            </AdminField>
            <AdminField label="Nút CTA" helper="V d: Lin h! t vn.">
              <input
                className={inputClass}
                value={slideForm.ctaLabel}
                onChange={(event) => setSlideForm({ ...slideForm, ctaLabel: event.target.value })}
              />
            </AdminField>
            <AdminField label="Link CTA" helper="Ví dụ: /pages/lien-he">
              <input
                className={inputClass}
                value={slideForm.ctaHref}
                onChange={(event) => setSlideForm({ ...slideForm, ctaHref: event.target.value })}
              />
            </AdminField>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSlideSubmit}
                className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
              >
                {editingId ? "Lưu slide" : "Tạo slide"}
              </Button>
              {editingId ? (
                <Button
                  variant="outline"
                  onClick={resetSlideForm}
                  className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                >
                  Hủy
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminContactSection({
  value,
  onChange,
  onSave,
  isDirty,
  savedAt
}: {
  value: ContactSettings;
  onChange: (patch: Partial<ContactSettings>) => void;
  onSave: () => void;
  isDirty: boolean;
  savedAt: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <AdminSectionHeader
        title="Thng tin lin h!"
        description="Cp nht thng tin hin th9 x trang lin h!, topbar v footer."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {savedAt ? (
              <span className="text-base text-slate-500 md:text-sm">
                Đã lưu: {savedAt}
              </span>
            ) : null}
            <Button
              onClick={onSave}
              disabled={!isDirty}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              Lưu thông tin
            </Button>
          </div>
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AdminField label="S i!n thoi" helper="Hin th9 x topbar v footer.">
          <input
            className={inputClass}
            value={value.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </AdminField>
        <AdminField label="Số fax" helper="Tu chn, hin th9 x trang lin h!.">
          <input
            className={inputClass}
            value={value.fax}
            onChange={(event) => onChange({ fax: event.target.value })}
          />
        </AdminField>
        <AdminField label="Email" helper="9a ch0 email nhn lin h!.">
          <input
            className={inputClass}
            value={value.email}
            onChange={(event) => onChange({ email: event.target.value })}
          />
        </AdminField>
        <AdminField label="Gi lm vi!c" helper="V d: 8:00 - 17:00 mi ngy.">
          <input
            className={inputClass}
            value={value.businessHours}
            onChange={(event) => onChange({ businessHours: event.target.value })}
          />
        </AdminField>
        <AdminField label="9a ch0" helper="9a ch0 ca hng hoc vn phng.">
          <textarea
            className={textareaClass}
            value={value.address}
            onChange={(event) => onChange({ address: event.target.value })}
          />
        </AdminField>
        <AdminField
          label="URL bn "
          helper="Dn URL embed Google Maps  hin th9 bn ."
        >
          <textarea
            className={textareaClass}
            value={value.mapUrl}
            onChange={(event) => onChange({ mapUrl: event.target.value })}
          />
        </AdminField>
        <div className="grid gap-4 lg:col-span-2 lg:grid-cols-3">
          <AdminField
            label="So dien thoai di dong"
            helper="Dung cho nut goi nhanh."
          >
            <input
              className={inputClass}
              value={value.mobilePhone}
              onChange={(event) => onChange({ mobilePhone: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Link Facebook"
            helper="Dung cho nut lien he Facebook."
          >
            <input
              className={inputClass}
              value={value.facebookUrl}
              onChange={(event) => onChange({ facebookUrl: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Link Zalo"
            helper="Dung cho nut lien he Zalo."
          >
            <input
              className={inputClass}
              value={value.zaloUrl}
              onChange={(event) => onChange({ zaloUrl: event.target.value })}
            />
          </AdminField>
        </div>
      </div>
    </div>
  );
}

function AdminPromoPopupSection({
  value,
  onChange,
  onSave,
  isDirty,
  savedAt
}: {
  value: PromoPopupSettings;
  onChange: (patch: Partial<PromoPopupSettings>) => void;
  onSave: () => void;
  isDirty: boolean;
  savedAt: string | null;
}) {
  const handleProgramChange = (index: number, patch: Partial<PromoProgram>) => {
    const next = value.programs.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item
    );
    onChange({ programs: next });
  };

  const handleCouponChange = (index: number, patch: Partial<PromoCoupon>) => {
    const next = value.coupons.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item
    );
    onChange({ coupons: next });
  };

  const addProgram = () => {
    onChange({
      programs: [...value.programs, { title: "u i m:i", description: "" }]
    });
  };

  const removeProgram = (index: number) => {
    onChange({ programs: value.programs.filter((_, idx) => idx != index) });
  };

  const addCoupon = () => {
    onChange({
      coupons: [...value.coupons, { label: "M u i", code: "", description: "" }]
    });
  };

  const removeCoupon = (index: number) => {
    onChange({ coupons: value.coupons.filter((_, idx) => idx != index) });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <AdminSectionHeader
        title="Popup khuyến mãi"
        description="Thit lp n'i dung popup khuyến mãi hiỒn th9 x trang ch."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {savedAt ? (
              <span className="text-base text-slate-500 md:text-sm">
                Đã lưu: {savedAt}
              </span>
            ) : null}
            <Button
              onClick={onSave}
              disabled={!isDirty}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              Lưu popup
            </Button>
          </div>
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AdminField label="Bật popup" helper="Bật/tắt popup khuyến mãi trên trang chủ.">
          <select
            className={selectClass}
            value={value.isActive ? "true" : "false"}
            onChange={(event) => onChange({ isActive: event.target.value === "true" })}
          >
            <option value="true">Đang bật</option>
            <option value="false">Đang tắt</option>
          </select>
        </AdminField>
        <AdminField label="' tr& (giy)" helper="Popup s hin th9 sau s giy ny.">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={value.delaySeconds}
            onChange={(event) => onChange({ delaySeconds: Number(event.target.value) || 0 })}
          />
        </AdminField>
        <AdminField label="Tiu " helper="Tiu  n'i bật của popup.">
          <input
            className={inputClass}
            value={value.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </AdminField>
        <AdminField label="Ph " helper="Dng m t ngn bn d:i tiu .">
          <input
            className={inputClass}
            value={value.subtitle}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </AdminField>
        <AdminField label="Ảnh popup" helper="URL nh hin th9 x phn trn ca popup.">
          <input
            className={inputClass}
            value={value.imageSrc}
            onChange={(event) => onChange({ imageSrc: event.target.value })}
          />
        </AdminField>
        <AdminField label="Alt ảnh" helper="Mô tả ngắn cho ảnh.">
          <input
            className={inputClass}
            value={value.imageAlt}
            onChange={(event) => onChange({ imageAlt: event.target.value })}
          />
        </AdminField>
        <AdminField label="Nút CTA" helper="Nhn nt lin h! trong popup.">
          <input
            className={inputClass}
            value={value.ctaLabel}
            onChange={(event) => onChange({ ctaLabel: event.target.value })}
          />
        </AdminField>
        <AdminField label="Liên kết CTA" helper="Đường dẫn khi bấm nút CTA.">
          <input
            className={inputClass}
            value={value.ctaHref}
            onChange={(event) => onChange({ ctaHref: event.target.value })}
          />
        </AdminField>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 md:text-sm">
              Chng trnh u i
            </h3>
            <Button
              onClick={addProgram}
              className="h-9 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              Thm u i
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {value.programs.map((item, index) => (
              <div key={`program-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">u i #{index + 1}</span>
                  <Button
                    onClick={() => removeProgram(index)}
                    className="h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 normal-case tracking-normal text-sm cursor-pointer"
                  >
                    Xóa
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  <input
                    className={inputClass}
                    value={item.title}
                    onChange={(event) => handleProgramChange(index, { title: event.target.value })}
                  />
                  <textarea
                    className={textareaClass}
                    value={item.description}
                    onChange={(event) => handleProgramChange(index, { description: event.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 md:text-sm">
              Mã giảm giá
            </h3>
            <Button
              onClick={addCoupon}
              className="h-9 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              Thêm mã
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {value.coupons.map((item, index) => (
              <div key={`coupon-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Mã #{index + 1}</span>
                  <Button
                    onClick={() => removeCoupon(index)}
                    className="h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 normal-case tracking-normal text-sm cursor-pointer"
                  >
                    Xóa
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  <input
                    className={inputClass}
                    value={item.label}
                    onChange={(event) => handleCouponChange(index, { label: event.target.value })}
                    placeholder="Tn u i"
                  />
                  <input
                    className={inputClass}
                    value={item.code}
                    onChange={(event) => handleCouponChange(index, { code: event.target.value })}
                    placeholder="Mã giảm giá"
                  />
                  <textarea
                    className={textareaClass}
                    value={item.description}
                    onChange={(event) => handleCouponChange(index, { description: event.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminNotificationsSection({
  value,
  onChange,
  onSave,
  isDirty,
  savedAt
}: {
  value: NotificationSettings;
  onChange: (next: NotificationSettings) => void;
  onSave: () => void;
  isDirty: boolean;
  savedAt: string | null;
}) {
  const handleItemChange = (index: number, patch: Partial<NotificationItem>) => {
    const next = value.items.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item
    );
    onChange({ items: next });
  };

  const addItem = () => {
    const nextItem: NotificationItem = {
      id: `notify-${Date.now()}`,
      title: "Thng bo m:i",
      description: "",
      href: "/",
      isActive: true
    };
    onChange({ items: [...value.items, nextItem] });
  };

  const removeItem = (index: number) => {
    onChange({ items: value.items.filter((_, idx) => idx !== index) });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <AdminSectionHeader
        title="Thông báo"
        description="Thông báo popup lấy từ mục Popup khuyến mãi."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {savedAt ? (
              <span className="text-base text-slate-500 md:text-sm">
                Đã lưu: {savedAt}
              </span>
            ) : null}
            <Button
              onClick={onSave}
              disabled={!isDirty}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              Lưu thông báo
            </Button>
          </div>
        }
      />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 md:text-sm">
            Danh sách thông báo
          </h3>
          <Button
            onClick={addItem}
            className="h-9 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 normal-case tracking-normal text-base md:text-sm cursor-pointer"
          >
            Thêm thông báo
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {value.items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cha c thng bo tu ch0nh.
            </div>
          ) : (
            value.items.map((item, index) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Thông báo #{index + 1}</span>
                  <Button
                    onClick={() => removeItem(index)}
                    className="h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 normal-case tracking-normal text-sm cursor-pointer"
                  >
                    Xóa
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <AdminField label="Tiu ">
                    <input
                      className={inputClass}
                      value={item.title}
                      onChange={(event) => handleItemChange(index, { title: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Liên kết">
                    <input
                      className={inputClass}
                      value={item.href}
                      onChange={(event) => handleItemChange(index, { href: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Trạng thái">
                    <select
                      className={selectClass}
                      value={item.isActive ? "true" : "false"}
                      onChange={(event) =>
                        handleItemChange(index, { isActive: event.target.value === "true" })
                      }
                    >
                      <option value="true">Đang bật</option>
                      <option value="false">Đang tắt</option>
                    </select>
                  </AdminField>
                  <AdminField label="Mô tả">
                    <textarea
                      className={textareaClass}
                      value={item.description}
                      onChange={(event) =>
                        handleItemChange(index, { description: event.target.value })
                      }
                    />
                  </AdminField>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminBannersSection({
  banners,
  onChange,
  onSave,
  isDirty,
  savedAt,
  setError
}: {
  banners: HomeBanner[];
  onChange: (next: HomeBanner[]) => void;
  onSave: () => void;
  isDirty: boolean;
  savedAt: string | null;
  setError: (value: string) => void;
}) {
  const initialForm = {
    title: "",
    badge: "Banner nổi bật",
    description: "",
    ctaLabel: "",
    ctaHref: "",
    desktopSrc: "",
    mobileSrc: "",
    alt: "",
    order: "1",
    isActive: true
  };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.order - b.order),
    [banners]
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleEdit = (banner: HomeBanner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      badge: banner.badge,
      description: banner.description,
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      desktopSrc: banner.desktopSrc,
      mobileSrc: banner.mobileSrc,
      alt: banner.alt,
      order: String(banner.order),
      isActive: banner.isActive
    });
  };

  const handleDelete = (banner: HomeBanner) => {
    const confirmed = window.confirm(`Xóa banner "${banner.title}"?`);
    if (!confirmed) {
      return;
    }
    onChange(banners.filter((item) => item.id !== banner.id));
  };

  const handleSubmit = () => {
    setError("");
    if (!form.title.trim()) {
      setError("Vui lng nhp tiu  banner.");
      return;
    }
    if (!form.desktopSrc.trim()) {
      setError("Vui lòng nhập URL ảnh desktop.");
      return;
    }
    if (!form.ctaLabel.trim()) {
      setError("Vui lòng nhập nhãn CTA.");
      return;
    }
    if (!form.ctaHref.trim()) {
      setError("Vui lng nhp ng dn CTA.");
      return;
    }

    const orderValue = Number(form.order || 0);
    const payload: HomeBanner = {
      id: editingId || `banner-${Date.now()}`,
      badge: form.badge.trim() || "Banner nổi bật",
      title: form.title.trim(),
      description: form.description.trim(),
      ctaLabel: form.ctaLabel.trim(),
      ctaHref: form.ctaHref.trim(),
      desktopSrc: form.desktopSrc.trim(),
      mobileSrc: form.mobileSrc.trim() || form.desktopSrc.trim(),
      alt: form.alt.trim() || form.title.trim(),
      order: Number.isFinite(orderValue) && orderValue > 0 ? orderValue : banners.length + 1,
      isActive: form.isActive
    };

    const next = editingId
      ? banners.map((item) => (item.id === editingId ? payload : item))
      : [...banners, payload];

    onChange(next);
    resetForm();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Banner trang chủ"
          description="Qun l n'i dung slider hiỒn th9 x trang ch."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {savedAt ? (
                <span className="text-base text-slate-500 md:text-sm">
                  Đã lưu: {savedAt}
                </span>
              ) : null}
              <Button
                onClick={onSave}
                disabled={!isDirty}
                className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
              >
                Lu thay i
              </Button>
            </div>
          }
        />

        <div className="mt-4 space-y-4">
          {sortedBanners.length ? (
            sortedBanners.map((banner) => (
              <div
                key={banner.id}
                className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div className="h-20 w-32 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={banner.desktopSrc}
                    alt={banner.alt}
                    width={128}
                    height={80}
                    className="h-full w-full object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-base font-semibold text-slate-900 md:text-sm">
                    {banner.title}
                  </p>
                  <p className="text-base text-slate-500 md:text-sm">
                    CTA: {banner.ctaLabel} · {banner.ctaHref}
                  </p>
                  <div className="flex flex-wrap gap-2 text-base text-slate-500 md:text-sm">
                    {banner.badge ? (
                      <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[var(--color-primary)]">
                        {banner.badge}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Thứ tự: {banner.order}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 ${
                        banner.isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {banner.isActive ? "ang hin th9" : "Đang ẩn"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                    className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(banner)}
                    className="normal-case tracking-normal text-rose-600 hover:bg-rose-50 text-base md:text-sm cursor-pointer"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-base text-slate-500 md:text-sm">
              Cha c banner no. Hy to banner u tin.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title={editingId ? "Cập nhật banner" : "Tạo banner"}
          description="Nhp y  thng tin  hin th9 trn slider."
        />
        <div className="mt-4 grid gap-4">
          <AdminField label="Tiu " helper="Tiu  chnh ca banner.">
            <input
              className={inputClass}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Nhãn banner"
            helper="V d: Banner n'i bật, u i tun ny."
          >
            <input
              className={inputClass}
              value={form.badge}
              onChange={(event) => setForm({ ...form, badge: event.target.value })}
            />
          </AdminField>
          <AdminField label="Mô tả" helper="M t ngn, ti a 2 dng.">
            <textarea
              className={textareaClass}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </AdminField>
          <AdminField label="Nhãn CTA" helper="Ví dụ: Xem sản phẩm.">
            <input
              className={inputClass}
              value={form.ctaLabel}
              onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })}
            />
          </AdminField>
          <AdminField label="Đường dẫn CTA" helper="Ví dụ: /collections/all">
            <input
              className={inputClass}
              value={form.ctaHref}
              onChange={(event) => setForm({ ...form, ctaHref: event.target.value })}
            />
          </AdminField>
          <AdminField label="Ảnh desktop" helper="Kch th:c gi  1600x720px.">
            <input
              className={inputClass}
              value={form.desktopSrc}
              onChange={(event) => setForm({ ...form, desktopSrc: event.target.value })}
            />
          </AdminField>
          <AdminField label="Ảnh mobile" helper="Nu b trng s dng nh desktop.">
            <input
              className={inputClass}
              value={form.mobileSrc}
              onChange={(event) => setForm({ ...form, mobileSrc: event.target.value })}
            />
          </AdminField>
          <AdminField label="Alt text" helper="M t cho nh  h tr SEO.">
            <input
              className={inputClass}
              value={form.alt}
              onChange={(event) => setForm({ ...form, alt: event.target.value })}
            />
          </AdminField>
          <AdminField label="Thứ tự" helper="Số nhỏ hiển thị trước.">
            <input
              type="number"
              className={inputClass}
              value={form.order}
              onChange={(event) => setForm({ ...form, order: event.target.value })}
            />
          </AdminField>
          <div className="flex items-center gap-2 text-base font-semibold text-slate-700 md:text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
            />
            Hiển thị banner
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSubmit}
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              {editingId ? "Lưu banner" : "Tạo banner"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={resetForm}
                className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
              >
                Hủy
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
