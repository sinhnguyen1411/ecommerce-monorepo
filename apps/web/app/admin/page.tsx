"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CreditCard,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileImage,
  HelpCircle,
  Home,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  ListFilter,
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
  dangerActionClass,
  inputClass,
  panelByDensity,
  primaryActionClass,
  secondaryActionClass,
  selectClass,
  textareaClass
} from "@/components/admin/AdminHelpers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { AdminDialogContent } from "@/components/admin/AdminDialog";
import { formatCurrency } from "@/lib/format";
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  ADMIN_PAYMENT_STATUS_OPTIONS,
  getAdminOrderStatusMeta,
  getAdminPaymentStatusMeta,
} from "@/lib/admin-status";
import {
  AdminCategory,
  AdminDashboard,
  AdminDashboardGrain,
  AdminDensityMode,
  AdminOrder,
  AdminOrderColumnId,
  AdminPost,
  AdminProduct,
  AdminProfile,
  AdminQnA,
  AdminSidebarMode,
  AdminUIPreferences,
  PaymentSettings,
  addAdminProductImage,
  adminLogout,
  adminMe,
  updateAdminPreferences,
  createAdminCategory,
  createAdminPage,
  createAdminPost,
  createAdminProduct,
  createAdminQnA,
  deleteAdminCategory,
  deleteAdminPost,
  deleteAdminProduct,
  deleteAdminQnA,
  getAdminDashboard,
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

const ADMIN_FIXED_NAV_ID = "overview";
const ADMIN_NAV_ITEMS: AdminNavItem[] = [
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
];

const ADMIN_NAV_DEFAULT_ORDER = ADMIN_NAV_ITEMS
  .filter((item) => item.id !== ADMIN_FIXED_NAV_ID)
  .map((item) => item.id);

const normalizeAdminNavOrder = (ids?: string[]) => {
  if (!Array.isArray(ids)) {
    return [...ADMIN_NAV_DEFAULT_ORDER];
  }

  const validIds = new Set(ADMIN_NAV_DEFAULT_ORDER);
  const seen = new Set<string>();
  const ordered: string[] = [];

  ids.forEach((raw) => {
    const id = String(raw || "").trim();
    if (!id || id === ADMIN_FIXED_NAV_ID || !validIds.has(id) || seen.has(id)) {
      return;
    }
    seen.add(id);
    ordered.push(id);
  });

  ADMIN_NAV_DEFAULT_ORDER.forEach((id) => {
    if (!seen.has(id)) {
      ordered.push(id);
    }
  });

  return ordered;
};

const buildOrderedAdminNavItems = (navOrder: string[]) => {
  const byId = new Map(ADMIN_NAV_ITEMS.map((item) => [item.id, item]));
  const fixedOverview = byId.get(ADMIN_FIXED_NAV_ID);
  const ordered = navOrder
    .map((id) => byId.get(id))
    .filter((item): item is AdminNavItem => Boolean(item));
  if (!fixedOverview) {
    return ordered;
  }
  return [fixedOverview, ...ordered];
};

const ADMIN_SIDEBAR_MODE_DEFAULT: AdminSidebarMode = "rail";
const ADMIN_DENSITY_DEFAULT: AdminDensityMode = "compact";
const ADMIN_ORDERS_COLUMN_DEFAULT: AdminOrderColumnId[] = [
  "order",
  "customer",
  "total",
  "payment",
  "delivery",
  "actions"
];

const normalizeOrdersColumns = (columns?: AdminOrderColumnId[]) => {
  const allowed = new Set<AdminOrderColumnId>([
    "order",
    "customer",
    "total",
    "payment",
    "delivery",
    "payment_method",
    "shipping_method",
    "actions"
  ]);
  const essential = ["order", "customer", "total", "payment", "delivery", "actions"] as const;
  const seen = new Set<AdminOrderColumnId>();
  const ordered: AdminOrderColumnId[] = [];

  (columns || []).forEach((raw) => {
    const value = String(raw || "").trim() as AdminOrderColumnId;
    if (!value || !allowed.has(value) || seen.has(value)) {
      return;
    }
    seen.add(value);
    ordered.push(value);
  });

  essential.forEach((column) => {
    if (!seen.has(column)) {
      seen.add(column);
      ordered.push(column);
    }
  });

  return ordered;
};

const normalizeAdminUIPreferences = (
  prefs?: AdminUIPreferences
): Required<Pick<AdminUIPreferences, "sidebar_mode" | "density" | "orders_columns">> => {
  const sidebarMode =
    prefs?.sidebar_mode === "full" || prefs?.sidebar_mode === "rail"
      ? prefs.sidebar_mode
      : ADMIN_SIDEBAR_MODE_DEFAULT;
  const density =
    prefs?.density === "comfortable" || prefs?.density === "compact"
      ? prefs.density
      : ADMIN_DENSITY_DEFAULT;

  return {
    sidebar_mode: sidebarMode,
    density,
    orders_columns: normalizeOrdersColumns(prefs?.orders_columns as AdminOrderColumnId[] | undefined)
  };
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
      imageAlt: "",
      foregroundImageSrc: "",
      foregroundImageAlt: ""
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
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [dashboardGrain, setDashboardGrain] = useState<AdminDashboardGrain>("day");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [navOrderSnapshot, setNavOrderSnapshot] = useState<string[]>([
    ...ADMIN_NAV_DEFAULT_ORDER
  ]);
  const [navOrderDraft, setNavOrderDraft] = useState<string[]>([
    ...ADMIN_NAV_DEFAULT_ORDER
  ]);
  const [isNavSortMode, setIsNavSortMode] = useState(false);
  const [navOrderSaving, setNavOrderSaving] = useState(false);
  const [uiPreferencesSnapshot, setUiPreferencesSnapshot] = useState(
    normalizeAdminUIPreferences(undefined)
  );
  const [uiPreferencesDraft, setUiPreferencesDraft] = useState(
    normalizeAdminUIPreferences(undefined)
  );
  const [uiPreferencesSaving, setUiPreferencesSaving] = useState(false);
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const refreshInFlightRef = useRef(false);
  const refreshPausedRef = useRef(false);
  const loadAllRef = useRef<() => Promise<void>>(async () => {});
  const loadDashboardRef = useRef<(grain: AdminDashboardGrain) => Promise<void>>(async () => {});
  const activeSectionRef = useRef(activeSection);
  const dashboardGrainRef = useRef(dashboardGrain);

  useEffect(() => {
    setContactDraft(loadContactSettings());
  }, []);

  const readLegacyHomeContent = useCallback((): HomePageContent => {
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
  }, []);

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

  const loadAll = useCallback(async () => {
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
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
  }, [aboutDirty, homeDirtyMap, readLegacyHomeContent]);

  const loadDashboard = useCallback(async (grain: AdminDashboardGrain) => {
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const dashboardData = await getAdminDashboard(grain);
      setDashboard(dashboardData);
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : "Không thể tải dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then((profileData) => {
        if (!cancelled) {
          const normalizedNavOrder = normalizeAdminNavOrder(profileData.nav_order);
          const normalizedUIPreferences = normalizeAdminUIPreferences(
            profileData.ui_preferences
          );
          setIsAuthed(true);
          setProfile(profileData);
          setNavOrderSnapshot(normalizedNavOrder);
          setNavOrderDraft(normalizedNavOrder);
          setUiPreferencesSnapshot(normalizedUIPreferences);
          setUiPreferencesDraft(normalizedUIPreferences);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAuthed(false);
          setProfile(null);
          setNavOrderSnapshot([...ADMIN_NAV_DEFAULT_ORDER]);
          setNavOrderDraft([...ADMIN_NAV_DEFAULT_ORDER]);
          const defaults = normalizeAdminUIPreferences(undefined);
          setUiPreferencesSnapshot(defaults);
          setUiPreferencesDraft(defaults);
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
    void loadAll();
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }
    void loadDashboard(dashboardGrain);
  }, [dashboardGrain, isAuthed, loadDashboard]);

  useEffect(() => {
    loadAllRef.current = loadAll;
  }, [loadAll]);

  useEffect(() => {
    loadDashboardRef.current = loadDashboard;
  }, [loadDashboard]);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    dashboardGrainRef.current = dashboardGrain;
  }, [dashboardGrain]);

  useEffect(() => {
    const isFormField = (element: EventTarget | null): element is HTMLElement => {
      return (
        element instanceof HTMLElement &&
        element.matches("input, textarea, select, [contenteditable='true']")
      );
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (isFormField(event.target)) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        setIsInputFocused(isFormField(active));
      }, 0);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);


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
      setError(err instanceof Error ? err.message : "Không thể đăng xuất.");
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
      setError(err instanceof Error ? err.message : "Không thể lưu nội dung trang chủ.");
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
      setError("Vui lòng nhập tiêu đề trang giới thiệu.");
      return;
    }
    if (!aboutDraft.slides.length) {
      setError("Trang giới thiệu cần ít nhất một slide nội dung.");
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
      setError(err instanceof Error ? err.message : "Không thể lưu trang giới thiệu.");
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

  const navOrderDirty = useMemo(() => {
    if (navOrderDraft.length !== navOrderSnapshot.length) {
      return true;
    }
    return navOrderDraft.some((id, index) => id !== navOrderSnapshot[index]);
  }, [navOrderDraft, navOrderSnapshot]);

  const hasUnsavedAdminDrafts = useMemo(
    () =>
      navOrderDirty ||
      isNavSortMode ||
      navOrderSaving ||
      uiPreferencesSaving ||
      aboutDirty ||
      contactDirty ||
      Object.values(homeDirtyMap).some(Boolean),
    [
      navOrderDirty,
      isNavSortMode,
      navOrderSaving,
      uiPreferencesSaving,
      aboutDirty,
      contactDirty,
      homeDirtyMap
    ]
  );

  const autoRefreshPaused = hasUnsavedAdminDrafts || isInputFocused;

  useEffect(() => {
    refreshPausedRef.current = autoRefreshPaused;
  }, [autoRefreshPaused]);

  const triggerAutoRefresh = useCallback(async () => {
    if (!isAuthed || refreshPausedRef.current || refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    try {
      await loadAllRef.current();
      if (activeSectionRef.current === "overview") {
        await loadDashboardRef.current(dashboardGrainRef.current);
      }
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void triggerAutoRefresh();
    }, 30_000);

    const handleFocusRefresh = () => {
      void triggerAutoRefresh();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        void triggerAutoRefresh();
      }
    };

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [isAuthed, triggerAutoRefresh]);

  const handleNavOrderReorder = (fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }
    setNavOrderDraft((prev) => {
      const fromIndex = prev.indexOf(fromId);
      const toIndex = prev.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return prev;
      }
      return reorderList(prev, fromIndex, toIndex);
    });
  };

  const handleNavOrderMove = (id: string, direction: -1 | 1) => {
    setNavOrderDraft((prev) => {
      const fromIndex = prev.indexOf(id);
      const toIndex = fromIndex + direction;
      if (fromIndex < 0 || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      return reorderList(prev, fromIndex, toIndex);
    });
  };

  const handleNavOrderSave = async () => {
    if (!navOrderDirty || navOrderSaving) {
      return;
    }

    setError("");
    setNavOrderSaving(true);
    try {
      const updatedProfile = await updateAdminPreferences({
        nav_order: navOrderDraft,
        ui_preferences: uiPreferencesDraft
      });
      const normalizedOrder = normalizeAdminNavOrder(updatedProfile.nav_order);
      const normalizedUIPreferences = normalizeAdminUIPreferences(
        updatedProfile.ui_preferences
      );
      setProfile(updatedProfile);
      setNavOrderSnapshot(normalizedOrder);
      setNavOrderDraft(normalizedOrder);
      setUiPreferencesSnapshot(normalizedUIPreferences);
      setUiPreferencesDraft(normalizedUIPreferences);
      setIsNavSortMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu thứ tự menu quản trị.");
    } finally {
      setNavOrderSaving(false);
    }
  };

  const persistUIPreferences = async (
    patch: Partial<Pick<AdminUIPreferences, "sidebar_mode" | "density" | "orders_columns">>
  ) => {
    const next = normalizeAdminUIPreferences({
      ...uiPreferencesDraft,
      ...patch
    });
    setUiPreferencesDraft(next);
    setError("");
    setUiPreferencesSaving(true);

    try {
      const updatedProfile = await updateAdminPreferences({
        ui_preferences: next
      });
      const normalizedUIPreferences = normalizeAdminUIPreferences(
        updatedProfile.ui_preferences
      );
      setProfile(updatedProfile);
      setUiPreferencesSnapshot(normalizedUIPreferences);
      setUiPreferencesDraft(normalizedUIPreferences);
    } catch (err) {
      setUiPreferencesDraft(uiPreferencesSnapshot);
      setError(err instanceof Error ? err.message : "Không thể lưu thiết lập hiển thị admin.");
    } finally {
      setUiPreferencesSaving(false);
    }
  };

  const handleOrdersColumnsChange = (columns: AdminOrderColumnId[]) => {
    const normalizedColumns = normalizeOrdersColumns(columns);
    if (
      normalizedColumns.length === uiPreferencesDraft.orders_columns.length &&
      normalizedColumns.every((value, index) => value === uiPreferencesDraft.orders_columns[index])
    ) {
      return;
    }
    void persistUIPreferences({ orders_columns: normalizedColumns });
  };

  const navItems = useMemo<AdminNavItem[]>(
    () => buildOrderedAdminNavItems(navOrderDraft),
    [navOrderDraft]
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
            Đang kiểm tra quyền quản trị...
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
              Cần đăng nhập
            </h1>
            <p className="mt-3 text-base text-slate-600 md:text-sm">
              Vui lòng đăng nhập để quản lý nội dung.
            </p>
            <Button
              asChild
              className="mt-6 h-11 w-full bg-[var(--color-cta)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              <Link href="/admin/login">Đăng nhập quản trị</Link>
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
      density={uiPreferencesDraft.density}
      navSort={{
        enabled: isNavSortMode,
        dirty: navOrderDirty,
        saving: navOrderSaving,
        onToggle: () => setIsNavSortMode((prev) => !prev),
        onSave: () => void handleNavOrderSave(),
        onReset: () => setNavOrderDraft([...navOrderSnapshot]),
        onMove: handleNavOrderMove,
        onReorder: handleNavOrderReorder
      }}
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700 md:text-sm">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-600 md:text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
          Đang tải dữ liệu quản trị...
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
          dashboard={dashboard}
          dashboardLoading={dashboardLoading}
          dashboardError={dashboardError}
          dashboardGrain={dashboardGrain}
          onDashboardGrainChange={setDashboardGrain}
          density={uiPreferencesDraft.density}
          onNavigate={setActiveSection}
        />
      )}

      {activeSection === "home" && (
        <AdminHomeSection
          density={uiPreferencesDraft.density}
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
          density={uiPreferencesDraft.density}
        />
      )}

      {activeSection === "categories" && (
        <AdminCategoriesSection
          categories={categories}
          onReload={loadAll}
          setError={setError}
          density={uiPreferencesDraft.density}
        />
      )}

      {activeSection === "posts" && (
        <AdminPostsSection
          posts={posts}
          onReload={loadAll}
          setError={setError}
          density={uiPreferencesDraft.density}
        />
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
        <AdminOrdersSection
          orders={orders}
          setError={setError}
          density={uiPreferencesDraft.density}
          columns={uiPreferencesDraft.orders_columns}
          onColumnsChange={handleOrdersColumnsChange}
          savingPreferences={uiPreferencesSaving}
        />
      )}

      {activeSection === "payments" && (
        <AdminPaymentsSection
          settings={settings}
          onSave={setSettings}
          setError={setError}
          density={uiPreferencesDraft.density}
        />
      )}

      {activeSection === "contact" && (
        <AdminContactSection
          density={uiPreferencesDraft.density}
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
  density,
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
  density: AdminDensityMode;
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
  const isCompact = density === "compact";
  const homePanelClass = panelByDensity(density);
  const sectionStackClass = isCompact ? "space-y-5" : "space-y-6";
  const spotlightsStackClass = isCompact ? "mt-4 space-y-5" : "mt-5 space-y-6";
  const tabs: { id: HomeGroupKey; label: string; icon: typeof Home }[] = [
    { id: "banners", label: "Banner", icon: ImageIcon },
    { id: "intro", label: "Định hướng", icon: Home },
    { id: "spotlights", label: "Banner sản phẩm", icon: Layers },
    { id: "features", label: "Ưu điểm", icon: Bell },
    { id: "aboutTeaser", label: "Giới thiệu", icon: BookOpen },
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

  const patchBanner = (index: number, patch: Partial<HomeBanner>) => {
    if (!content.banners[index]) {
      return;
    }
    onBannersChange(
      content.banners.map((banner, bannerIndex) =>
        bannerIndex === index ? { ...banner, ...patch } : banner
      )
    );
  };

  const patchSpotlight = (
    index: number,
    patch: Partial<HomePageContent["spotlights"][number]>
  ) => {
    if (!content.spotlights[index]) {
      return;
    }
    onSpotlightChange(index, patch);
  };

  const firstBanner = content.banners[0];
  const firstSpotlight = content.spotlights[0];
  const secondSpotlight = content.spotlights[1];

  const renderSaveActions = (group: HomeGroupKey, label: string) => (
    <div className="flex flex-wrap items-center gap-2">
      {savedAtMap[group] ? (
        <span className="text-base text-slate-500 md:text-sm">Đã lưu: {savedAtMap[group]}</span>
      ) : null}
      <Button
        onClick={() => void onSaveGroup(group)}
        disabled={!dirtyMap[group]}
        data-testid={`admin-home-save-${group}`}
        className={primaryActionClass}
      >
        {label}
      </Button>
    </div>
  );

  return (
    <div className={sectionStackClass}>
      <div className={homePanelClass}>
        <AdminSectionHeader
          title="Trang chủ"
          description="Quản lý toàn bộ nội dung hiển thị trên homepage trong một nơi."
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
                data-testid={`admin-home-tab-${tab.id}`}
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

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Preview trực tiếp trang chủ</p>
            <p className="text-xs text-slate-500">
              Bấm vào section và chỉnh ngay trên khối preview.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            <button
              type="button"
              onClick={() => setActiveTab("banners")}
              className={`group overflow-hidden rounded-xl border text-left transition ${
                activeTab === "banners"
                  ? "border-[var(--color-primary)] bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-[var(--color-primary)]/40"
              }`}
              data-testid="admin-home-live-banner"
            >
              <div className="relative h-36 w-full bg-slate-200">
                {firstBanner ? (
                  <Image
                    src={firstBanner.desktopSrc}
                    alt={firstBanner.alt || firstBanner.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 1280px) 100vw, 420px"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/25 to-transparent p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                    Banner chính
                  </p>
                  <p className="mt-2 line-clamp-2 text-base font-semibold text-white">
                    {firstBanner?.title || "Chưa có banner"}
                  </p>
                </div>
              </div>
              {firstBanner ? (
                <div className="space-y-2 p-3">
                  <input
                    className={inputClass}
                    value={firstBanner.title}
                    onChange={(event) => patchBanner(0, { title: event.target.value })}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Tiêu đề banner"
                  />
                  <input
                    className={inputClass}
                    value={firstBanner.ctaLabel}
                    onChange={(event) => patchBanner(0, { ctaLabel: event.target.value })}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Nhãn CTA"
                  />
                </div>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("intro")}
              className={`rounded-xl border p-4 text-left transition ${
                activeTab === "intro"
                  ? "border-[var(--color-primary)] bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-[var(--color-primary)]/40"
              }`}
              data-testid="admin-home-live-intro"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Định hướng
              </p>
              <input
                className={`${inputClass} mt-2`}
                value={content.intro.headline}
                onChange={(event) => onIntroChange({ headline: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                placeholder="Headline"
              />
              <textarea
                className={`${textareaClass} mt-2 min-h-[88px]`}
                value={content.intro.description}
                onChange={(event) => onIntroChange({ description: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                placeholder="Mô tả định hướng"
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={content.intro.secondaryCtaLabel}
                  onChange={(event) =>
                    onIntroChange({ secondaryCtaLabel: event.target.value })
                  }
                  onClick={(event) => event.stopPropagation()}
                  placeholder="CTA phụ"
                />
                <input
                  className={inputClass}
                  value={content.intro.primaryCtaLabel}
                  onChange={(event) => onIntroChange({ primaryCtaLabel: event.target.value })}
                  onClick={(event) => event.stopPropagation()}
                  placeholder="CTA chính"
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("spotlights")}
              className={`rounded-xl border p-4 text-left transition ${
                activeTab === "spotlights"
                  ? "border-[var(--color-primary)] bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-[var(--color-primary)]/40"
              }`}
              data-testid="admin-home-live-spotlights"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Banner sản phẩm
              </p>
              {[firstSpotlight, secondSpotlight]
                .filter(Boolean)
                .map((spotlight, index) => (
                  <div key={`live-spotlight-${spotlight?.id}`} className="mt-2 rounded-lg border border-slate-200 p-2">
                    <input
                      className={inputClass}
                      value={spotlight?.title || ""}
                      onChange={(event) =>
                        patchSpotlight(index, { title: event.target.value })
                      }
                      onClick={(event) => event.stopPropagation()}
                      placeholder={`Tiêu đề block ${index + 1}`}
                    />
                    <input
                      className={`${inputClass} mt-2`}
                      value={spotlight?.ctaLabel || ""}
                      onChange={(event) =>
                        patchSpotlight(index, { ctaLabel: event.target.value })
                      }
                      onClick={(event) => event.stopPropagation()}
                      placeholder="Nhãn CTA"
                    />
                  </div>
                ))}
              {content.spotlights.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">Chưa có block spotlight.</p>
              ) : null}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveTab("features")}
              className={`rounded-xl border p-3 text-left transition ${
                activeTab === "features"
                  ? "border-[var(--color-primary)] bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-[var(--color-primary)]/40"
              }`}
              data-testid="admin-home-live-features"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Ưu điểm
              </p>
              <input
                className={`${inputClass} mt-2`}
                value={content.features[0]?.title || ""}
                onChange={(event) => onFeatureChange(0, { title: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                placeholder="Tiêu đề ưu điểm 1"
              />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("aboutTeaser")}
              className={`rounded-xl border p-3 text-left transition ${
                activeTab === "aboutTeaser"
                  ? "border-[var(--color-primary)] bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-[var(--color-primary)]/40"
              }`}
              data-testid="admin-home-live-about"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Giới thiệu nhanh
              </p>
              <input
                className={`${inputClass} mt-2`}
                value={content.aboutTeaser.title}
                onChange={(event) => onAboutTeaserChange({ title: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                placeholder="Tiêu đề about teaser"
              />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("promoPopup")}
              className={`rounded-xl border p-3 text-left transition ${
                activeTab === "promoPopup"
                  ? "border-[var(--color-primary)] bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-[var(--color-primary)]/40"
              }`}
              data-testid="admin-home-live-popup"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Popup ưu đãi
              </p>
              <input
                className={`${inputClass} mt-2`}
                value={content.promoPopup.title}
                onChange={(event) => onPopupChange({ title: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                placeholder="Tiêu đề popup"
              />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`rounded-xl border p-3 text-left transition ${
                activeTab === "notifications"
                  ? "border-[var(--color-primary)] bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-[var(--color-primary)]/40"
              }`}
              data-testid="admin-home-live-notifications"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Thông báo
              </p>
              <input
                className={`${inputClass} mt-2`}
                value={content.notifications.items[0]?.title || ""}
                onChange={(event) => {
                  const first = content.notifications.items[0];
                  if (!first) return;
                  onNotificationChange({
                    items: [{ ...first, title: event.target.value }, ...content.notifications.items.slice(1)]
                  });
                }}
                onClick={(event) => event.stopPropagation()}
                placeholder="Thông báo đầu tiên"
              />
            </button>
          </div>
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
        <div className={homePanelClass}>
          <AdminSectionHeader
            title="Định hướng phát triển"
            description="Khối giới thiệu lớn ngay sau slider trang chủ."
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
            <AdminField label="Tiêu đề chính" helper="Dùng headline nổi bật.">
              <input
                className={inputClass}
                value={content.intro.headline}
                onChange={(event) => onIntroChange({ headline: event.target.value })}
              />
            </AdminField>
            <AdminField label="CTA phụ label">
              <input
                className={inputClass}
                data-testid="admin-intro-secondary-cta-label"
                value={content.intro.secondaryCtaLabel}
                onChange={(event) => onIntroChange({ secondaryCtaLabel: event.target.value })}
              />
            </AdminField>
            <AdminField label="CTA chính label">
              <input
                className={inputClass}
                data-testid="admin-intro-primary-cta-label"
                value={content.intro.primaryCtaLabel}
                onChange={(event) => onIntroChange({ primaryCtaLabel: event.target.value })}
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
              <AdminField label="CTA phụ link">
                <input
                  className={inputClass}
                  data-testid="admin-intro-secondary-cta-link"
                  value={content.intro.secondaryCtaHref}
                  onChange={(event) => onIntroChange({ secondaryCtaHref: event.target.value })}
                />
              </AdminField>
              <AdminField label="CTA chính link">
                <input
                  className={inputClass}
                  data-testid="admin-intro-primary-cta-link"
                  value={content.intro.primaryCtaHref}
                  onChange={(event) => onIntroChange({ primaryCtaHref: event.target.value })}
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
        <div className={homePanelClass}>
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
                  className={primaryActionClass}
                >
                  Lưu banner sản phẩm
                </Button>
              </div>
            }
          />
          <div className={spotlightsStackClass} data-testid="admin-spotlights-list">
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
                      className={secondaryActionClass}
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
                      className={secondaryActionClass}
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
                      className={dangerActionClass}
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
                    <AdminField label="Foreground image">
                      <input
                        className={inputClass}
                        value={spotlight.foregroundImageSrc || ""}
                        onChange={(event) =>
                          onSpotlightChange(index, {
                            foregroundImageSrc: event.target.value
                          })
                        }
                        data-testid={`admin-spotlight-foreground-src-${index}`}
                      />
                    </AdminField>
                    <AdminField label="Foreground alt">
                      <input
                        className={inputClass}
                        value={spotlight.foregroundImageAlt || ""}
                        onChange={(event) =>
                          onSpotlightChange(index, {
                            foregroundImageAlt: event.target.value
                          })
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
        <div className={homePanelClass}>
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
        <div className={homePanelClass}>
          <AdminSectionHeader
            title="Khối giới thiệu"
            description="Khối giới thiệu ngắn ở cuối trang chủ."
            actions={renderSaveActions("aboutTeaser", "Lưu khối giới thiệu")}
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AdminField label="Nhãn đầu mục">
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
            <AdminField label="Phụ đề" helper="Mô tả ngắn dưới tiêu đề.">
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
  setError,
  density
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
  onReload: () => void;
  setError: (value: string) => void;
  density: AdminDensityMode;
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
  const isCompact = density === "compact";
  const sectionGapClass = isCompact ? "space-y-5" : "space-y-6";
  const panelClass = panelByDensity(density);
  const filterGridClass = isCompact
    ? "mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]"
    : "mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]";
  const tableHeaderClass = isCompact
    ? "hidden bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] md:gap-3"
    : "hidden md:grid md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] md:gap-3 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-500 md:text-sm";
  const tableRowClass = isCompact
    ? "grid gap-3 px-4 py-3 text-sm md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] md:items-center transition hover:bg-slate-50"
    : "grid gap-4 px-4 py-4 text-base md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] md:items-center md:text-sm transition hover:bg-slate-50";

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
      setError("Vui lòng nhập URL hợp lệ.");
      return;
    }
    if (!canAddMore) {
      setError("Tối đa 10 ảnh cho mỗi sản phẩm.");
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
      setError("Tối đa 10 ảnh cho mỗi sản phẩm.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadAdminFile(file)));
      setNewImages((prev) => [...prev, ...uploaded.map((item) => item.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải ảnh lên.");
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
      setError(err instanceof Error ? err.message : "Không thể xóa sản phẩm.");
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
      setError("Tối đa 10 ảnh cho mỗi sản phẩm.");
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
      setError("Vui lòng nhập giá bán hợp lệ.");
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
      setError(err instanceof Error ? err.message : "Không thể lưu sản phẩm.");
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
          description="Theo dõi tồn kho, cập nhật giá và hình ảnh sản phẩm."
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

        <div className={filterGridClass}>
          <AdminField label="Tìm kiếm" helper="Theo tên hoặc slug sản phẩm.">
            <input
              className={inputClass}
              data-testid="admin-products-filter-query"
              placeholder="Tìm theo tên hoặc slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <select
              className={selectClass}
              data-testid="admin-products-filter-status"
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
              data-testid="admin-products-filter-category"
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

        <div className={`${isCompact ? "mt-4" : "mt-5"} overflow-hidden rounded-xl border border-slate-200`}>
          <div className={tableHeaderClass}>
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
                    className={tableRowClass}
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
                        className={secondaryActionClass}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        className={dangerActionClass}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-base text-slate-500 md:text-sm">
                Chưa có sản phẩm phù hợp bộ lọc.
              </div>
            )}
          </div>
        </div>

        <div className={`${isCompact ? "mt-3" : "mt-4"} flex flex-wrap items-center justify-between gap-3`}>
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
              Tối thiểu 3 ảnh và tối đa 10 ảnh cho mỗi sản phẩm. Có thể thêm ảnh bằng
              URL hoặc tải trực tiếp.
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
                  <AdminField label="Tên sản phẩm" helper="Hiển thị trên trang chi tiết.">
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
                  description="Kiểm soát giá bán và hiển thị."
                />
                <div className="mt-4 grid gap-4">
                  <AdminField label="Giá bán" helper="Nhập giá bán hiện tại.">
                    <input
                      type="number"
                      className={inputClass}
                      value={form.price}
                      onChange={(event) => setForm({ ...form, price: event.target.value })}
                    />
                  </AdminField>
                  <AdminField
                    label="Giá niêm yết"
                    helper="Bỏ trống nếu không có giá gốc."
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
                      helper="Đánh dấu để hiển thị nổi bật."
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
                  description="Thẻ và thứ tự hiển thị trên danh sách."
                />
                <div className="mt-4 grid gap-4">
                  <AdminField
                    label="Thẻ sản phẩm"
                    helper="NgĒn cách bằng dấu phẩy."
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
                      Chưa có danh mục để chọn.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <AdminSectionHeader
                  title="Hình ảnh sản phẩm"
                  description="Tối thiểu 3 ảnh và tối đa 10 ảnh."
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
                        className={secondaryActionClass}
                      >
                        Thêm URL
                      </Button>
                    </div>
                    <p className="text-base text-slate-500 md:text-xs">
                      Dùng URL bắt đầu bằng http(s). Còn trống {remainingSlots} ảnh.
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
                          Hiện có
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
              className={secondaryActionClass}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className={primaryActionClass}
            >
              {editingId ? "Lưu sản phẩm" : "Tạo sản phẩm"}
            </Button>
          </div>
          </div>

          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            <button
              type="button"
              aria-label="Cuộn lên đầu"
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
  setError,
  density
}: {
  categories: AdminCategory[];
  onReload: () => void;
  setError: (value: string) => void;
  density: AdminDensityMode;
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
  const isCompact = density === "compact";
  const layoutClass = isCompact ? "grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" : "grid gap-6 lg:grid-cols-[1.1fr_0.9fr]";
  const panelClass = panelByDensity(density);
  const rowClass = isCompact
    ? "flex flex-wrap items-start justify-between gap-3 py-3"
    : "flex flex-wrap items-start justify-between gap-3 py-4";

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
      setError(err instanceof Error ? err.message : "Không thể lưu danh mục.");
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
      setError(err instanceof Error ? err.message : "Không thể xóa danh mục.");
    }
  };

  return (
    <div className={layoutClass}>
      <div className={panelClass}>
        <AdminSectionHeader
          title="Danh mục sản phẩm"
          description="Quản lý danh mục để lọc và sắp xếp sản phẩm."
        />
        <div className={`${isCompact ? "mt-3" : "mt-4"} grid gap-4`}>
          <AdminField label="Tìm kiếm" helper="Theo tên hoặc slug danh mục.">
            <input
              className={inputClass}
              placeholder="Tìm theo tên hoặc slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
        </div>

        <div className={`${isCompact ? "mt-3" : "mt-4"} divide-y divide-slate-200`}>
          {pagedCategories.length ? (
            pagedCategories.map((category) => (
              <div
                key={category.id}
                className={rowClass}
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
                    className={secondaryActionClass}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    className={dangerActionClass}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-base text-slate-500 md:text-sm">
              Chưa có danh mục phù hợp bộ lọc.
            </p>
          )}
        </div>

        <div className={`${isCompact ? "mt-3" : "mt-4"} flex flex-wrap items-center justify-between gap-3`}>
            <span className="text-base text-slate-500 md:text-sm">
              Tổng {filteredCategories.length} danh mục
            </span>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <div className={panelClass}>
        <AdminSectionHeader
          title={editingId ? "Cập nhật danh mục" : "Tạo danh mục"}
          description="Cập nhật thông tin hiển thị cho danh mục."
        />
        <div className={`${isCompact ? "mt-3" : "mt-4"} grid gap-4`}>
          <AdminField label="Tên danh mục" helper="Hiển thị trên menu và sản phẩm.">
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
            helper="Giới thiệu ngắn gọn giúp khách dễ lựa chọn."
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
              className={primaryActionClass}
            >
              {editingId ? "Lưu danh mục" : "Tạo danh mục"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={resetForm}
                className={secondaryActionClass}
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
  setError,
  density
}: {
  posts: AdminPost[];
  onReload: () => void;
  setError: (value: string) => void;
  density: AdminDensityMode;
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
  const isCompact = density === "compact";
  const layoutClass = isCompact ? "grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" : "grid gap-6 lg:grid-cols-[1.1fr_0.9fr]";
  const panelClass = panelByDensity(density);
  const rowClass = isCompact
    ? "flex flex-wrap items-start justify-between gap-3 py-3"
    : "flex flex-wrap items-start justify-between gap-3 py-4";

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
      setError("Vui lòng nhập tiêu đề bài viết.");
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
      setError(err instanceof Error ? err.message : "Không thể lưu bài viết.");
    }
  };

  const statusOptions = [
    { value: "published", label: "Đang hiển thị" },
    { value: "hidden", label: "Đang ẩn" }
  ];

  return (
    <div className={layoutClass}>
      <div className={panelClass}>
        <AdminSectionHeader
          title="Tin tức & kiến thức"
          description="Cập nhật bài viết, tin tức và kiến thức nhà nông."
        />

        <div className={`${isCompact ? "mt-3" : "mt-4"} grid gap-4 md:grid-cols-2`}>
          <AdminField label="Tìm kiếm" helper="Theo tiêu đề hoặc slug.">
            <input
              className={inputClass}
              placeholder="Tìm theo tiêu đề hoặc slug"
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

        <div className={`${isCompact ? "mt-3" : "mt-4"} divide-y divide-slate-200`}>
          {pagedPosts.length ? (
            pagedPosts.map((post) => {
              const statusLabel =
                statusOptions.find((option) => option.value === post.status)?.label ||
                post.status;
              return (
                <div
                  key={post.id}
                  className={rowClass}
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
                        Ngày đăng: {post.published_at}
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
                      className={secondaryActionClass}
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
                                : "Không thể xóa bài viết."
                            )
                          )
                      }
                      className={dangerActionClass}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-base text-slate-500 md:text-sm">
              Chưa có bài viết phù hợp bộ lọc.
            </p>
          )}
        </div>

        <div className={`${isCompact ? "mt-3" : "mt-4"} flex flex-wrap items-center justify-between gap-3`}>
          <span className="text-base text-slate-500 md:text-sm">
            Tổng {filteredPosts.length} bài viết
          </span>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <div className={panelClass}>
        <AdminSectionHeader
          title={editingId ? "Cập nhật bài viết" : "Tạo bài viết"}
          description="Quản lý nội dung tin tức và kiến thức."
        />
        <div className={`${isCompact ? "mt-3" : "mt-4"} grid gap-4`}>
          <AdminField label="Tiêu đề" helper="Tiêu đề hiển thị trên trang bài viết.">
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
            helper="Dùng ảnh bìa tỉ lệ ngang (1200x630)."
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
            label="Ngày đăng"
            helper="Định dạng YYYY-MM-DD HH:MM:SS (tùy chọn)."
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
            helper="Đoạn mô tả ngắn hiển thị ở danh sách."
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
              className={primaryActionClass}
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
                className={secondaryActionClass}
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
      setError(err instanceof Error ? err.message : "Không thể lưu hỏi đáp.");
    }
  };

  const statusOptions = [
    { value: "published", label: "Đang hiển thị" },
    { value: "hidden", label: "Đang ẩn" }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Hỏi đáp"
          description="Quản lý câu hỏi thường gặp và nội dung hỗ trợ."
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
                      className={secondaryActionClass}
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
                                : "Không thể xóa hỏi đáp."
                            )
                          )
                      }
                      className={dangerActionClass}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-base text-slate-500 md:text-sm">
              Chưa có hỏi đáp phù hợp bộ lọc.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-base text-slate-500 md:text-sm">
            Tổng {filteredItems.length} hỏi đáp
          </span>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title={editingId ? "Cập nhật hỏi đáp" : "Tạo hỏi đáp"}
          description="Son nội dung trả lời cho khách hàng."
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
              className={primaryActionClass}
            >
              {editingId ? "Lưu hỏi đáp" : "Tạo hỏi đáp"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setForm(initialForm);
                  setEditingId(null);
                }}
                className={secondaryActionClass}
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
  setError,
  density,
  columns,
  onColumnsChange,
  savingPreferences
}: {
  orders: AdminOrder[];
  setError: (value: string) => void;
  density: AdminDensityMode;
  columns: AdminOrderColumnId[];
  onColumnsChange: (columns: AdminOrderColumnId[]) => void;
  savingPreferences: boolean;
}) {
  const statusOptions = ADMIN_ORDER_STATUS_OPTIONS;
  const paymentOptions = ADMIN_PAYMENT_STATUS_OPTIONS;
  const optionalColumns: Array<{ id: AdminOrderColumnId; label: string }> = [
    { id: "payment_method", label: "Phương thức thanh toán" },
    { id: "shipping_method", label: "Hình thức giao hàng" }
  ];
  const isCompact = density === "compact";
  const panelClass = isCompact
    ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
  const toolbarGridClass = isCompact
    ? "mt-3 grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_auto]"
    : "mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_auto]";
  const visibleColumns = useMemo(() => normalizeOrdersColumns(columns), [columns]);
  const orderTableTemplate = useMemo(() => {
    const widthMap: Record<AdminOrderColumnId, string> = {
      order: "minmax(190px,1.3fr)",
      customer: "minmax(220px,1.5fr)",
      total: "minmax(120px,0.9fr)",
      payment: "minmax(170px,1.1fr)",
      delivery: "minmax(170px,1.1fr)",
      payment_method: "minmax(150px,0.9fr)",
      shipping_method: "minmax(150px,0.9fr)",
      actions: "minmax(88px,0.7fr)"
    };
    return visibleColumns.map((column) => widthMap[column]).join(" ");
  }, [visibleColumns]);

  const headerLabels: Record<AdminOrderColumnId, string> = {
    order: "M n / thi gian",
    customer: "Khách hàng",
    total: "Tổng tiền",
    payment: "Thanh toán",
    delivery: "Trạng thái đơn hàng",
    payment_method: "PTTT",
    shipping_method: "Vận chuyển",
    actions: "Hành động"
  };

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

  type OrderSaveState = {
    saving: boolean;
    saved: boolean;
    error: string;
    lastSavedAt: string | null;
  };

  const createOrderEdit = (order: AdminOrder): OrderEdit => ({
    customer_name: order.customer_name || "",
    email: order.email || "",
    phone: order.phone || "",
    address: order.address || "",
    note: order.note || "",
    delivery_time: order.delivery_time || "",
    status: order.status || "pending",
    payment_status: order.payment_status || "pending",
    admin_note: order.admin_note || ""
  });

  const createEmptyOrderEdit = (): OrderEdit => ({
    customer_name: "",
    email: "",
    phone: "",
    address: "",
    note: "",
    delivery_time: "",
    status: "pending",
    payment_status: "pending",
    admin_note: ""
  });

  const formatOrderTime = (raw: string) => {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw || "-";
    }
    return parsed.toLocaleString("vi-VN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderRows, setOrderRows] = useState<AdminOrder[]>(orders);
  const [edits, setEdits] = useState<Record<number, OrderEdit>>({});
  const [saveStates, setSaveStates] = useState<Record<number, OrderSaveState>>({});
  const [proofPreview, setProofPreview] = useState<{ url: string; orderNumber: string } | null>(
    null
  );

  const editsRef = useRef<Record<number, OrderEdit>>({});
  const inFlightRef = useRef<Record<number, boolean>>({});
  const queuedRef = useRef<Record<number, boolean>>({});
  const requestSeqRef = useRef<Record<number, number>>({});
  const appliedSeqRef = useRef<Record<number, number>>({});
  const debounceTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const pageSize = 8;
  const autoSaveDelayMs = 700;

  useEffect(() => {
    setOrderRows(orders);
  }, [orders]);

  useEffect(() => {
    const next: Record<number, OrderEdit> = {};
    orders.forEach((order) => {
      next[order.id] = createOrderEdit(order);
    });
    setEdits(next);
    editsRef.current = next;
    setSaveStates({});
    inFlightRef.current = {};
    queuedRef.current = {};
    requestSeqRef.current = {};
    appliedSeqRef.current = {};
  }, [orders]);

  useEffect(() => {
    editsRef.current = edits;
  }, [edits]);

  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach((timer) => clearTimeout(timer));
      debounceTimersRef.current = {};
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orderRows.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (paymentFilter && order.payment_status !== paymentFilter) return false;
      if (!term) return true;
      return [order.order_number, order.customer_name, order.phone, order.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [orderRows, statusFilter, paymentFilter, query]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentFilter, query, orderRows.length]);

  useEffect(() => {
    if (expandedOrderId === null) {
      return;
    }
    const exists = filteredOrders.some((order) => order.id === expandedOrderId);
    if (!exists) {
      setExpandedOrderId(null);
    }
  }, [expandedOrderId, filteredOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, page, pageSize]
  );

  const clearOrderDebounce = (orderId: number) => {
    const timer = debounceTimersRef.current[orderId];
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    delete debounceTimersRef.current[orderId];
  };

  const setOrderSaveState = (orderId: number, patch: Partial<OrderSaveState>) => {
    setSaveStates((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        saving: false,
        saved: false,
        error: "",
        lastSavedAt: null,
        ...patch
      }
    }));
  };

  const getUpdatePayload = (edit: OrderEdit) => ({
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

  const persistOrder = async (orderId: number) => {
    const edit = editsRef.current[orderId];
    if (!edit) {
      return;
    }

    if (inFlightRef.current[orderId]) {
      queuedRef.current[orderId] = true;
      return;
    }

    const requestSeq = (requestSeqRef.current[orderId] || 0) + 1;
    requestSeqRef.current[orderId] = requestSeq;
    inFlightRef.current[orderId] = true;
    setOrderSaveState(orderId, { saving: true, saved: false, error: "" });

    try {
      const updated = await updateAdminOrder(orderId, getUpdatePayload(edit));
      if (requestSeq < (appliedSeqRef.current[orderId] || 0)) {
        return;
      }
      appliedSeqRef.current[orderId] = requestSeq;
      setOrderRows((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order))
      );
      setOrderSaveState(orderId, {
        saving: false,
        saved: true,
        error: "",
        lastSavedAt: new Date().toLocaleTimeString("vi-VN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      });
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể cập nhật đơn hàng.";
      setOrderSaveState(orderId, {
        saving: false,
        saved: false,
        error: message
      });
      setError(message);
    } finally {
      inFlightRef.current[orderId] = false;
      if (queuedRef.current[orderId]) {
        queuedRef.current[orderId] = false;
        void persistOrder(orderId);
      }
    }
  };

  const scheduleOrderSave = (orderId: number) => {
    clearOrderDebounce(orderId);
    debounceTimersRef.current[orderId] = setTimeout(() => {
      delete debounceTimersRef.current[orderId];
      void persistOrder(orderId);
    }, autoSaveDelayMs);
  };

  const flushOrderSave = (orderId: number) => {
    clearOrderDebounce(orderId);
    void persistOrder(orderId);
  };

  const updateOrderField = (
    orderId: number,
    patch: Partial<OrderEdit>,
    mode: "debounce" | "immediate" = "debounce"
  ) => {
    const nextEdit = {
      ...(editsRef.current[orderId] || createEmptyOrderEdit()),
      ...patch
    };
    setEdits((prev) => {
      const next = {
        ...prev,
        [orderId]: nextEdit
      };
      editsRef.current = next;
      return next;
    });

    if (mode === "immediate") {
      clearOrderDebounce(orderId);
      editsRef.current = {
        ...editsRef.current,
        [orderId]: nextEdit
      };
      void persistOrder(orderId);
      return;
    }

    scheduleOrderSave(orderId);
  };

  const toggleOptionalColumn = (columnId: AdminOrderColumnId) => {
    const hasColumn = visibleColumns.includes(columnId);
    if (hasColumn) {
      onColumnsChange(visibleColumns.filter((column) => column !== columnId));
      return;
    }
    onColumnsChange([...visibleColumns, columnId]);
  };

  return (
    <div className="space-y-4">
      <div className={panelClass}>
        <AdminSectionHeader
          title="Quản lý đơn hàng"
          description="Hiển thị danh sách đơn theo dạng dòng để xử lý nhanh, mở chi tiết khi cần chỉnh sửa."
        />
        <div className={toolbarGridClass}>
          <AdminField label="Tìm kiếm" helper="Theo mã đơn, tên khách hàng, email hoặc số điện thoại.">
            <input
              className={inputClass}
              placeholder="Nhập từ khóa tìm đơn hàng"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
          <AdminField label="Trạng thái đơn hàng">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tất cả</option>
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {getAdminOrderStatusMeta(value).label}
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
                  {getAdminPaymentStatusMeta(value).label}
                </option>
              ))}
            </select>
          </AdminField>
          <div className="flex flex-wrap items-end justify-end gap-2 xl:pb-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="normal-case border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  data-testid="admin-orders-column-toggle"
                  disabled={savingPreferences}
                >
                  <ListFilter className="h-4 w-4" />
                  Cột hiển thị
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Tùy chọn cột</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {optionalColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns.includes(column.id)}
                    onCheckedChange={() => toggleOptionalColumn(column.id)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div
            className="sticky top-0 z-10 hidden items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid"
            style={{ gridTemplateColumns: orderTableTemplate }}
          >
            {visibleColumns.map((column) => (
              <span key={column} className={column === "actions" ? "text-right" : ""}>
                {headerLabels[column]}
              </span>
            ))}
          </div>

          {pagedOrders.length ? (
            pagedOrders.map((order) => {
              const edit = edits[order.id] || createOrderEdit(order);
              const isExpanded = expandedOrderId === order.id;
              const saveState = saveStates[order.id];
              const saveStateText = saveState?.saving
                ? "Đang lưu..."
                : saveState?.error
                  ? "Lưu thất bại"
                  : saveState?.saved
                    ? `Đã lưu lúc ${saveState.lastSavedAt}`
                    : "Chưa lưu";
              const saveStateClass = saveState?.saving
                ? "text-slate-600"
                : saveState?.error
                  ? "text-rose-600"
                  : saveState?.saved
                    ? "text-emerald-600"
                    : "text-slate-500";

              return (
                <div key={order.id} className="border-b border-slate-200 last:border-b-0" data-testid={`admin-order-row-${order.id}`}>
                  <div
                    className={`grid gap-3 px-4 ${isCompact ? "py-3" : "py-4"} lg:items-center`}
                    style={{ gridTemplateColumns: orderTableTemplate }}
                  >
                    {visibleColumns.map((column) => {
                      if (column === "order") {
                        return (
                          <div key={column}>
                            <p className="text-sm font-semibold text-slate-900">{order.order_number}</p>
                            <p className="text-xs text-slate-500">{formatOrderTime(order.created_at)}</p>
                          </div>
                        );
                      }

                      if (column === "customer") {
                        return (
                          <div key={column}>
                            <p className="text-sm font-semibold text-slate-900">{order.customer_name || "Chưa có tên"}</p>
                            <p className="text-xs text-slate-600">{order.phone || "-"}</p>
                            <p className="text-xs text-slate-500">{order.email || "-"}</p>
                          </div>
                        );
                      }

                      if (column === "total") {
                        return (
                          <div key={column} className="text-sm font-semibold text-slate-900">
                            {formatCurrency(order.total)}
                          </div>
                        );
                      }

                      if (column === "payment") {
                        const paymentMeta = getAdminPaymentStatusMeta(edit.payment_status);
                        return (
                          <div key={column}>
                            <select
                              className={`${selectClass} min-h-[44px] py-1 text-xs ${paymentMeta.selectToneClass}`}
                              value={edit.payment_status}
                              onChange={(event) =>
                                updateOrderField(
                                  order.id,
                                  { payment_status: event.target.value },
                                  "immediate"
                                )
                              }
                              data-testid={`admin-order-quick-payment-${order.id}`}
                              aria-label={paymentMeta.ariaLabel}
                            >
                              {paymentOptions.map((value) => (
                                <option key={value} value={value}>
                                  {getAdminPaymentStatusMeta(value).label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      if (column === "delivery") {
                        const orderMeta = getAdminOrderStatusMeta(edit.status);
                        return (
                          <div key={column}>
                            <select
                              className={`${selectClass} min-h-[44px] py-1 text-xs ${orderMeta.selectToneClass}`}
                              value={edit.status}
                              onChange={(event) =>
                                updateOrderField(order.id, { status: event.target.value }, "immediate")
                              }
                              data-testid={`admin-order-quick-status-${order.id}`}
                              aria-label={orderMeta.ariaLabel}
                            >
                              {statusOptions.map((value) => (
                                <option key={value} value={value}>
                                  {getAdminOrderStatusMeta(value).label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      if (column === "payment_method") {
                        return (
                          <div key={column} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            {order.payment_method || "-"}
                          </div>
                        );
                      }

                      if (column === "shipping_method") {
                        return (
                          <div key={column} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            {order.shipping_method || "standard"}
                          </div>
                        );
                      }

                      return (
                        <div key={column} className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                            className="h-11 w-11 border-slate-200 p-0 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                            data-testid={`admin-order-toggle-${order.id}`}
                            aria-label={
                              isExpanded
                                ? `Ẩn chi tiết đơn ${order.order_number}`
                                : `Mở chi tiết đơn ${order.order_number}`
                            }
                            title={
                              isExpanded
                                ? `Ẩn chi tiết đơn ${order.order_number}`
                                : `Mở chi tiết đơn ${order.order_number}`
                            }
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-4" data-testid={`admin-order-detail-${order.id}`}>
                      <div className="mb-3 flex items-center justify-end">
                        <span
                          className={`text-xs font-semibold ${saveStateClass}`}
                          data-testid={`admin-order-save-state-${order.id}`}
                          aria-live="polite"
                        >
                          {saveStateText}
                        </span>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <AdminField label="Tên khách hàng">
                          <input
                            className={inputClass}
                            value={edit.customer_name}
                            onChange={(event) =>
                              updateOrderField(order.id, { customer_name: event.target.value })
                            }
                            onBlur={() => flushOrderSave(order.id)}
                          />
                        </AdminField>
                        <AdminField label="Email">
                          <input
                            className={inputClass}
                            value={edit.email}
                            onChange={(event) => updateOrderField(order.id, { email: event.target.value })}
                            onBlur={() => flushOrderSave(order.id)}
                          />
                        </AdminField>
                        <AdminField label="Số điện thoại">
                          <input
                            className={inputClass}
                            data-testid={`admin-order-phone-${order.id}`}
                            value={edit.phone}
                            onChange={(event) => updateOrderField(order.id, { phone: event.target.value })}
                            onBlur={() => flushOrderSave(order.id)}
                          />
                        </AdminField>
                        <AdminField label="Địa chỉ">
                          <input
                            className={inputClass}
                            value={edit.address}
                            onChange={(event) => updateOrderField(order.id, { address: event.target.value })}
                            onBlur={() => flushOrderSave(order.id)}
                          />
                        </AdminField>
                        <AdminField label="Thời gian giao">
                          <input
                            className={inputClass}
                            value={edit.delivery_time}
                            onChange={(event) =>
                              updateOrderField(order.id, { delivery_time: event.target.value })
                            }
                            onBlur={() => flushOrderSave(order.id)}
                          />
                        </AdminField>
                        <AdminField label="Ghi chú khách">
                          <textarea
                            className={textareaClass}
                            value={edit.note}
                            onChange={(event) => updateOrderField(order.id, { note: event.target.value })}
                            onBlur={() => flushOrderSave(order.id)}
                          />
                        </AdminField>
                        <AdminField label="Trạng thái đơn hàng">
                          {(() => {
                            const orderMeta = getAdminOrderStatusMeta(edit.status);
                            return (
                              <select
                                className={`${selectClass} ${orderMeta.selectToneClass}`}
                                value={edit.status}
                                onChange={(event) =>
                                  updateOrderField(order.id, { status: event.target.value }, "immediate")
                                }
                                aria-label={orderMeta.ariaLabel}
                              >
                                {statusOptions.map((value) => (
                                  <option key={value} value={value}>
                                    {getAdminOrderStatusMeta(value).label}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}
                        </AdminField>
                        <AdminField label="Trạng thái thanh toán">
                          {(() => {
                            const paymentMeta = getAdminPaymentStatusMeta(edit.payment_status);
                            return (
                              <select
                                className={`${selectClass} ${paymentMeta.selectToneClass}`}
                                value={edit.payment_status}
                                onChange={(event) =>
                                  updateOrderField(
                                    order.id,
                                    { payment_status: event.target.value },
                                    "immediate"
                                  )
                                }
                                aria-label={paymentMeta.ariaLabel}
                              >
                                {paymentOptions.map((value) => (
                                  <option key={value} value={value}>
                                    {getAdminPaymentStatusMeta(value).label}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}
                        </AdminField>
                      </div>

                      <div className="mt-4">
                        <AdminField label="Ghi chú nội bộ" helper="Chỉ hiển thị cho quản trị viên.">
                          <textarea
                            className={textareaClass}
                            value={edit.admin_note}
                            onChange={(event) =>
                              updateOrderField(order.id, { admin_note: event.target.value })
                            }
                            onBlur={() => flushOrderSave(order.id)}
                          />
                        </AdminField>
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Sản phẩm trong đơn</p>
                        {order.items?.length ? (
                          <div className="mt-2 space-y-2">
                            {order.items.map((item) => (
                              <div key={`${order.id}-${item.product_id}`} className="flex items-center justify-between gap-3">
                                <span>
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="font-semibold">{formatCurrency(item.unit_price)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-slate-500">Đơn hàng chưa có dòng sản phẩm.</p>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Chứng từ thanh toán</p>
                            <p className="text-xs text-slate-500">
                              {order.payment_proof_url
                                ? "Khách đã gửi chứng từ. Bạn có thể xem nhanh hoặc mở tab mới."
                                : "Chưa có chứng từ thanh toán cho đơn hàng này."}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold ${saveStateClass}`}>{saveStateText}</span>
                        </div>
                        {order.payment_proof_url ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-[44px]"
                              onClick={() =>
                                setProofPreview({
                                  url: order.payment_proof_url,
                                  orderNumber: order.order_number
                                })
                              }
                              data-testid={`admin-order-proof-preview-${order.id}`}
                            >
                              <FileImage className="h-4 w-4" />
                              Xem chứng từ
                            </Button>
                            <a
                              href={order.payment_proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Mở tab mới
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Chưa có đơn hàng phù hợp bộ lọc.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">
          Hiển thị {pagedOrders.length}/{filteredOrders.length} đơn hàng
        </span>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Dialog open={Boolean(proofPreview)} onOpenChange={(open) => !open && setProofPreview(null)}>
        <AdminDialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {proofPreview ? `Chứng từ thanh toán - ${proofPreview.orderNumber}` : "Chứng từ thanh toán"}
            </DialogTitle>
            <DialogDescription>
              Dùng để đối soát giao dịch thanh toán cho đơn hàng.
            </DialogDescription>
          </DialogHeader>
          {proofPreview ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={proofPreview.url}
                  alt={`Chứng từ ${proofPreview.orderNumber}`}
                  className="h-auto max-h-[70vh] w-full object-contain"
                />
              </div>
              <a
                href={proofPreview.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Mở chứng từ ở tab mới
              </a>
            </div>
          ) : null}
        </AdminDialogContent>
      </Dialog>
    </div>
  );
}
function AdminPaymentsSection({
  settings,
  onSave,
  setError,
  density
}: {
  settings: PaymentSettings | null;
  onSave: (value: PaymentSettings) => void;
  setError: (value: string) => void;
  density: AdminDensityMode;
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
  const isCompact = density === "compact";
  const panelClass = panelByDensity(density);
  const gridGapClass = isCompact ? "mt-4 grid gap-3" : "mt-5 grid gap-4";

  const handleSave = async () => {
    try {
      const updated = await updatePaymentSettings(form);
      onSave(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật thanh toán.");
    }
  };

  return (
    <div className={panelClass}>
      <AdminSectionHeader
        title="Cấu hình thanh toán"
        description="Thiết lập các phương thức thanh toán và thông tin chuyển khoản."
      />
      <div className={gridGapClass}>
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
            Chuyn khon ngắđơn hàng
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

        <AdminField label="Ngân hàng" helper="Tên ngân hàng nhận chuyển khoản.">
          <input
            className={inputClass}
            value={form.bank_name}
            onChange={(event) => setForm({ ...form, bank_name: event.target.value })}
          />
        </AdminField>
        <AdminField label="Số tài khoản" helper="Số tài khoản nhận thanh toán đơn hàng.">
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
          helper="Dán link VietQR tự động hiển thị mã QR thanh toán."
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
          className={primaryActionClass}
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
      setError("Vui lòng nhập tiêu đề slide.");
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
      ctaLabel: slideForm.ctaLabel.trim() || "Liên hệ tư vấn",
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
            description="Cập nhật nội dung hiển thị trên trang giới thiệu. Hỗ trợ ảnh và CTA theo từng slide."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {savedAt ? (
                  <span className="text-base text-slate-500 md:text-sm">Đã lưu: {savedAt}</span>
                ) : null}
                <Button
                  onClick={onSave}
                  disabled={!isDirty}
                  className={primaryActionClass}
                >
                  Lưu trang giới thiệu
                </Button>
              </div>
            }
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AdminField label="Eyebrow" helper="Ví dụ: Giới thiệu">
              <input
                className={inputClass}
                value={value.hero.eyebrow}
                onChange={(event) => updateHero({ eyebrow: event.target.value })}
              />
            </AdminField>
            <AdminField label="Tiêu đề chính" helper="Tiêu  l:n hiển thị x phn u trang.">
              <input
                className={inputClass}
                value={value.hero.title}
                onChange={(event) => updateHero({ title: event.target.value })}
              />
            </AdminField>
            <AdminField label="Mô tả" helper="Đoạn giới thiệu ngắn bên dưới tiêu đề.">
              <textarea
                className={textareaClass}
                value={value.hero.lead}
                onChange={(event) => updateHero({ lead: event.target.value })}
              />
            </AdminField>
            <AdminField label="Ảnh hero" helper="Kích thước gợi ý 1400x900px.">
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
            <AdminField label="CTA chính" helper="Nút liên hệ nổi bật.">
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
            <AdminField label="CTA phụ" helper="Nút ph x phn hero.">
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
            <AdminField label="Pill highlights" helper="Mỗi dòng là một nhãn nổi bật.">
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
                  placeholder="Mô tả chỉ số"
                  value={stat.label}
                  onChange={(event) => handleStatChange(index, { label: event.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStat(index)}
                  className={dangerActionClass}
                >
                  Xóa
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addStat}
              className={secondaryActionClass}
            >
              Thêm chỉ số
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title="Nội dung chi tit"
            description="Có thể dùng HTML (p, h3, ul, li). Nội dung này hiển thị như một slide dài."
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
          <AdminSectionHeader title="CTA cuối trang" description="Khối kêu gọi liên hệ cuối trang giới thiệu." />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminField label="Tiêu " helper="Dùng tiêu đề kêu gọi hành động.">
              <input
                className={inputClass}
                value={value.contact.title}
                onChange={(event) => handleContactChange({ title: event.target.value })}
              />
            </AdminField>
            <AdminField label="Nội dung" helper="Mô tả ngắn bên dưới tiêu đề.">
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
            description="Các slide giới thiệu hiển thị theo chiều dọc trên trang."
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
                      className={secondaryActionClass}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSlideDelete(slide)}
                      className={dangerActionClass}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-base text-slate-500 md:text-sm">
                Chưa có slide nào. Hãy tạo slide đầu tiên.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <AdminSectionHeader
            title={editingId ? "Cập nhật slide" : "Tạo slide mới"}
            description="Mỗi slide gồm hình ảnh, mô tả và nút liên hệ."
          />
          <div className="mt-4 grid gap-4">
            <AdminField label="Tag" helper="Ví dụ: Chặng 01 (có thể để trống).">
              <input
                className={inputClass}
                value={slideForm.tag}
                onChange={(event) => setSlideForm({ ...slideForm, tag: event.target.value })}
              />
            </AdminField>
            <AdminField label="Tiêu đề" helper="Tiêu đề chính của slide.">
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
            <AdminField label="Danh sách bullet" helper="Mỗi dòng là một bullet.">
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
            <AdminField label="Nút CTA" helper="Ví dụ: Liên hệ tư vấn.">
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
                className={primaryActionClass}
              >
                {editingId ? "Lưu slide" : "Tạo slide"}
              </Button>
              {editingId ? (
                <Button
                  variant="outline"
                  onClick={resetSlideForm}
                  className={secondaryActionClass}
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
  density,
  value,
  onChange,
  onSave,
  isDirty,
  savedAt
}: {
  density: AdminDensityMode;
  value: ContactSettings;
  onChange: (patch: Partial<ContactSettings>) => void;
  onSave: () => void;
  isDirty: boolean;
  savedAt: string | null;
}) {
  const panelClass = panelByDensity(density);
  return (
    <div className={panelClass}>
      <AdminSectionHeader
        title="Thông tin liên hệ"
        description="Cập nhật thông tin hiển thị ở trang liên hệ, topbar và footer."
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
              className={primaryActionClass}
            >
              Lưu thông tin
            </Button>
          </div>
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AdminField label="Số điện thoại" helper="Hiển thị ở topbar và footer.">
          <input
            className={inputClass}
            value={value.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </AdminField>
        <AdminField label="Số fax" helper="Tùy chọn, hiển thị ở trang liên hệ.">
          <input
            className={inputClass}
            value={value.fax}
            onChange={(event) => onChange({ fax: event.target.value })}
          />
        </AdminField>
        <AdminField label="Email" helper="Địa chỉ email nhận liên hệ.">
          <input
            className={inputClass}
            value={value.email}
            onChange={(event) => onChange({ email: event.target.value })}
          />
        </AdminField>
        <AdminField label="Giờ làm việc" helper="Ví dụ: 8:00 - 17:00 mỗi ngày.">
          <input
            className={inputClass}
            value={value.businessHours}
            onChange={(event) => onChange({ businessHours: event.target.value })}
          />
        </AdminField>
        <AdminField label="Địa chỉ" helper="Địa chỉ cửa hàng hoặc văn phòng.">
          <textarea
            className={textareaClass}
            value={value.address}
            onChange={(event) => onChange({ address: event.target.value })}
          />
        </AdminField>
        <AdminField
          label="URL bản đồ"
          helper="Dán URL embed Google Maps để hiển thị bản đồ."
        >
          <textarea
            className={textareaClass}
            value={value.mapUrl}
            onChange={(event) => onChange({ mapUrl: event.target.value })}
          />
        </AdminField>
        <div className="grid gap-4 lg:col-span-2 lg:grid-cols-3">
          <AdminField
            label="Số điện thoại di động"
            helper="Dùng cho nút gọi nhanh."
          >
            <input
              className={inputClass}
              value={value.mobilePhone}
              onChange={(event) => onChange({ mobilePhone: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Link Facebook"
            helper="Dùng cho nút liên hệ Facebook."
          >
            <input
              className={inputClass}
              value={value.facebookUrl}
              onChange={(event) => onChange({ facebookUrl: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Link Zalo"
            helper="Dùng cho nút liên hệ Zalo."
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
      programs: [...value.programs, { title: "Ưu đãi mới", description: "" }]
    });
  };

  const removeProgram = (index: number) => {
    onChange({ programs: value.programs.filter((_, idx) => idx != index) });
  };

  const addCoupon = () => {
    onChange({
      coupons: [...value.coupons, { label: "Mã ưu đãi", code: "", description: "" }]
    });
  };

  const removeCoupon = (index: number) => {
    onChange({ coupons: value.coupons.filter((_, idx) => idx != index) });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <AdminSectionHeader
        title="Popup khuyến mãi"
        description="Thiết lập nội dung popup khuyến mãi hiển thị ở trang chủ."
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
              className={primaryActionClass}
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
        <AdminField label="Độ trễ (giây)" helper="Popup sẽ hiển thị sau số giây này.">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={value.delaySeconds}
            onChange={(event) => onChange({ delaySeconds: Number(event.target.value) || 0 })}
          />
        </AdminField>
        <AdminField label="Tiêu đề" helper="Tiêu đề nổi bật của popup.">
          <input
            className={inputClass}
            value={value.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </AdminField>
        <AdminField label="Phụ đề" helper="Dòng mô tả ngắn bên dưới tiêu đề.">
          <input
            className={inputClass}
            value={value.subtitle}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </AdminField>
        <AdminField label="Ảnh popup" helper="URL ảnh hiển thị ở phần trên của popup.">
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
        <AdminField label="Nút CTA" helper="Nhãn nút liên hệ trong popup.">
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
              Chương trình ưu đãi
            </h3>
            <Button
              onClick={addProgram}
              className="h-9 bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 normal-case tracking-normal text-base md:text-sm cursor-pointer"
            >
              Thêm ưu đãi
            </Button>
          </div>
          <div className="mt-4 space-y-4">
            {value.programs.map((item, index) => (
              <div key={`program-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Ưu đãi #{index + 1}</span>
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
                    placeholder="Tên ưu đãi"
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
      title: "Thông báo mới",
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
              className={primaryActionClass}
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
              Chưa có thông báo tùy chỉnh.
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
                  <AdminField label="Tiêu đề">
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
      setError("Vui lòng nhập tiêu đề banner.");
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
      setError("Vui lòng nhập đường dẫn CTA.");
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
          description="Quản lý nội dung slider hiển thị ở trang chủ."
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
                className={primaryActionClass}
              >
                Lưu thay đổi
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
                      {banner.isActive ? "Đang hiển thị" : "Đang ẩn"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                    className={secondaryActionClass}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(banner)}
                    className={dangerActionClass}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-base text-slate-500 md:text-sm">
              Chưa có banner nào. Hãy tạo banner đầu tiên.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title={editingId ? "Cập nhật banner" : "Tạo banner"}
          description="Nhập đầy đủ thông tin để hiển thị trên slider."
        />
        <div className="mt-4 grid gap-4">
          <AdminField label="Tiêu đề" helper="Tiêu đề chính của banner.">
            <input
              className={inputClass}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </AdminField>
          <AdminField
            label="Nhãn banner"
            helper="Ví dụ: Banner nổi bật, ưu đãi tuần này."
          >
            <input
              className={inputClass}
              value={form.badge}
              onChange={(event) => setForm({ ...form, badge: event.target.value })}
            />
          </AdminField>
          <AdminField label="Mô tả" helper="Mô tả ngắn, tối đa 2 dòng.">
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
          <AdminField label="Ảnh desktop" helper="Kích thước gợi ý 1600x720px.">
            <input
              className={inputClass}
              value={form.desktopSrc}
              onChange={(event) => setForm({ ...form, desktopSrc: event.target.value })}
            />
          </AdminField>
          <AdminField label="Ảnh mobile" helper="Nếu bỏ trống sẽ dùng ảnh desktop.">
            <input
              className={inputClass}
              value={form.mobileSrc}
              onChange={(event) => setForm({ ...form, mobileSrc: event.target.value })}
            />
          </AdminField>
          <AdminField label="Alt text" helper="Mô tả cho ảnh, hỗ trợ SEO.">
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
              className={primaryActionClass}
            >
              {editingId ? "Lưu banner" : "Tạo banner"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={resetForm}
                className={secondaryActionClass}
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
