"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  Newspaper,
  Package,
  Phone,
  ShoppingCart
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
  listAdminPosts,
  listAdminProducts,
  listAdminQnA,
  updateAdminCategory,
  updateAdminOrder,
  updateAdminPost,
  updateAdminProduct,
  updateAdminQnA,
  updatePaymentSettings,
  uploadAdminFile
} from "@/lib/admin";
import type { ContactSettings, HomeBanner } from "@/lib/content";
import { defaultContactSettings, defaultHomeBanners } from "@/lib/content";
import {
  loadContactSettings,
  loadHomeBanners,
  saveContactSettings,
  saveHomeBanners
} from "@/lib/client-content";

const sectionLabels: Record<string, string> = {
  overview: "Tổng quan",
  products: "Sản phẩm",
  categories: "Danh mục",
  posts: "Tin tức",
  qna: "Hỏi đáp",
  orders: "Đơn hàng",
  payments: "Thanh toán",
  contact: "Liên hệ",
  banners: "Banner trang chủ"
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
  const [banners, setBanners] = useState<HomeBanner[]>(defaultHomeBanners);
  const [contactDraft, setContactDraft] = useState<ContactSettings>(defaultContactSettings);
  const [bannerDirty, setBannerDirty] = useState(false);
  const [bannerSavedAt, setBannerSavedAt] = useState<string | null>(null);
  const [contactDirty, setContactDirty] = useState(false);
  const [contactSavedAt, setContactSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setBanners(loadHomeBanners());
    setContactDraft(loadContactSettings());
  }, []);

  const loadAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [productData, categoryData, postData, qnaData, orderData, paymentData] =
        await Promise.all([
          listAdminProducts(),
          listAdminCategories(),
          listAdminPosts(),
          listAdminQnA(),
          listAdminOrders(),
          getPaymentSettings()
        ]);
      setProducts(productData);
      setCategories(categoryData);
      setPosts(postData);
      setQnA(qnaData);
      setOrders(orderData);
      setSettings(paymentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu quản trị.");
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
      setError(err instanceof Error ? err.message : "Không thể tải lên tệp.");
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
      setError(err instanceof Error ? err.message : "Không thể đăng xuất.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleBannerChange = (next: HomeBanner[]) => {
    setBanners(next);
    setBannerDirty(true);
  };

  const handleBannerSave = () => {
    saveHomeBanners(banners);
    setBannerDirty(false);
    setBannerSavedAt(new Date().toLocaleString("vi-VN"));
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
      { id: "products", label: "Sản phẩm", icon: Package },
      { id: "categories", label: "Danh mục", icon: Layers },
      { id: "posts", label: "Tin tức", icon: Newspaper },
      { id: "qna", label: "Hỏi đáp", icon: HelpCircle },
      { id: "orders", label: "Đơn hàng", icon: ShoppingCart },
      { id: "payments", label: "Thanh toán", icon: CreditCard },
      { id: "contact", label: "Liên hệ", icon: Phone },
      { id: "banners", label: "Banner trang chủ", icon: ImageIcon }
    ],
    []
  );

  const navMeta = useMemo(
    () => ({
      products: products.length,
      categories: categories.length,
      posts: posts.length,
      qna: qna.length,
      orders: pendingOrders,
      payments: pendingPayments,
      banners: banners.length
    }),
    [
      products.length,
      categories.length,
      posts.length,
      qna.length,
      pendingOrders,
      pendingPayments,
      banners.length
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
          banners={banners}
          contactSettings={contactDraft}
          uploadUrl={uploadUrl}
          onUpload={handleUpload}
          onNavigate={setActiveSection}
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

      {activeSection === "banners" && (
        <AdminBannersSection
          banners={banners}
          onChange={handleBannerChange}
          onSave={handleBannerSave}
          isDirty={bannerDirty}
          savedAt={bannerSavedAt}
          setError={setError}
        />
      )}
    </AdminShell>
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
    setExistingImages(product.images?.map((image) => image.url) || []);
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
                Chưa có sản phẩm phù hợp bộ lọc.
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
        <DialogContent className="max-w-5xl relative">
          <div ref={dialogScrollRef} className="max-h-[80vh] overflow-y-auto pr-12">
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
                        className="normal-case tracking-normal border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
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
        </DialogContent>
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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Danh mục sản phẩm"
          description="Quản lý danh mục để lọc và sắp xếp sản phẩm."
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
              Chưa có danh mục phù hợp bộ lọc.
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
          description="Cập nhật thông tin hiển thị cho danh mục."
        />
        <div className="mt-4 grid gap-4">
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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Tin tức & kiến thức"
          description="Cập nhật bài viết, tin tức và kiến thức nhà nông."
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                                : "Không thể xóa bài viết."
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
              Chưa có bài viết phù hợp bộ lọc.
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
          description="Quản lý nội dung tin tức và kiến thức."
        />
        <div className="mt-4 grid gap-4">
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
            helper="Dùng ảnh bìa tỷ lệ ngang (1200x630)."
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
            helper="Định dạng YYYY-MM-DD HH:MM:SS (tuỳ chọn)."
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
                                : "Không thể xóa hỏi đáp."
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
          description="Soạn nội dung trả lời cho khách hàng."
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
              {editingId ? "Lưu hỏi đáp" : "Tạo hỏi đáp"}
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
      setError(err instanceof Error ? err.message : "Không thể cập nhật đơn hàng.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminSectionHeader
          title="Quản lý đơn hàng"
          description="Theo dõi trạng thái giao hàng và thanh toán."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <AdminField label="Tìm kiếm" helper="Theo mã đơn, tên, điện thoại.">
            <input
              className={inputClass}
              placeholder="Tìm theo mã đơn hoặc khách hàng"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AdminField>
          <AdminField label="Trạng thái đơn">
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
                  <AdminField label="Số điện thoại">
                    <input
                      className={inputClass}
                      value={edit.phone}
                      onChange={(event) => updateEdit(order.id, { phone: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Địa chỉ">
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
                  <AdminField label="Ghi chú đơn hàng">
                    <textarea
                      className={textareaClass}
                      value={edit.note}
                      onChange={(event) => updateEdit(order.id, { note: event.target.value })}
                    />
                  </AdminField>
                  <AdminField label="Trạng thái đơn">
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
                <AdminField label="Ghi chú nội bộ" helper="Chỉ hiển thị cho quản trị viên.">
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
                    Lưu đơn hàng
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
                  <p className="font-semibold text-slate-700">Sản phẩm trong đơn</p>
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
          Chưa có đơn hàng phù hợp bộ lọc.
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
      setError(err instanceof Error ? err.message : "Không thể cập nhật thanh toán.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <AdminSectionHeader
        title="Cấu hình thanh toán"
        description="Thiết lập các phương thức thanh toán và thông tin chuyển khoản."
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
            Chuyển khoản ngân hàng
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
        <AdminField label="Số tài khoản" helper="Số tài khoản ngân hàng.">
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
        <AdminField label="Mã ngân hàng" helper="Mã ngân hàng theo VietQR (tuỳ chọn).">
          <input
            className={inputClass}
            value={form.bank_id}
            onChange={(event) => setForm({ ...form, bank_id: event.target.value })}
          />
        </AdminField>
        <AdminField
          label="Quick Link VietQR"
          helper="Dán link VietQR để tự động hiển thị mã QR thanh toán."
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
              className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
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
        <AdminField label="Số fax" helper="Tuỳ chọn, hiển thị ở trang liên hệ.">
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
                className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case tracking-normal text-base md:text-sm cursor-pointer"
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
            helper="Ví dụ: Banner nổi bật, Ưu đãi tuần này."
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
          <AdminField label="Alt text" helper="Mô tả cho ảnh để hỗ trợ SEO.">
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
