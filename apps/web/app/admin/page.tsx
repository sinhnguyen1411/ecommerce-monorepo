"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import {
  AdminCategory,
  AdminOrder,
  AdminPost,
  AdminProduct,
  AdminQnA,
  PaymentSettings,
  addAdminProductImage,
  adminLogout,
  adminMe,

  createAdminPost,
  createAdminProduct,
  createAdminQnA,

  deleteAdminPost,
  deleteAdminProduct,
  deleteAdminQnA,
  getPaymentSettings,
  listAdminCategories,
  listAdminOrders,
  listAdminPosts,
  listAdminProducts,
  listAdminQnA,

  updateAdminOrder,
  updateAdminPost,
  updateAdminProduct,
  updateAdminQnA,
  updatePaymentSettings,
  uploadAdminFile
} from "@/lib/admin";

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
  const [loggingOut, setLoggingOut] = useState(false);

  const loadAll = async () => {
    setError("");
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
    }
  };

  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then(() => {
        if (!cancelled) {
          setIsAuthed(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAuthed(false);
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

  if (isAuthed === null) {
    return (
      <div className="section-shell pb-16 pt-14">
        <p className="text-sm text-ink/70">Đang kiểm tra quyền quản trị...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="section-shell pb-16 pt-14">
        <SectionTitle
          eyebrow="Admin"
          title="Đăng nhập quản trị"
          description="Vui lòng đăng nhập để quản lý nội dung."
        />
        <div className="mt-6">
          <Link className="btn-primary" href="/admin/login">
            Đi đến trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="section-shell pb-6 pt-14">
        <SectionTitle
          eyebrow="Admin"
          title="Bảng điều khiển"
          description="Quản lý sản phẩm, bài viết, đơn hàng và thanh toán."
        />
      </section>

      <section className="section-shell pb-16">
        {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
        <div className="mb-6 rounded-[28px] border border-forest/10 bg-white/90 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Tải lên hình ảnh</h2>
              <p className="text-sm text-ink/70">Dùng URL này cho ảnh sản phẩm/bài viết.</p>
            </div>
            <input type="file" onChange={(event) => handleUpload(event.target.files?.[0] || null)} />
          </div>
          {uploadUrl ? (
            <p className="mt-3 text-sm text-ink/70">URL: {uploadUrl}</p>
          ) : null}
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
            
            <TabsTrigger value="posts">Kiến thức nhà nông</TabsTrigger>
            <TabsTrigger value="qna">Hỏi đáp</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="pt-6">
            <AdminProducts
              products={products}
              categories={categories}
              onReload={loadAll}
              setError={setError}
            />
          </TabsContent>

          <TabsContent value="posts" className="pt-6">
            <AdminPosts posts={posts} onReload={loadAll} setError={setError} />
          </TabsContent>

          <TabsContent value="qna" className="pt-6">
            <AdminQnASection items={qna} onReload={loadAll} setError={setError} />
          </TabsContent>

          <TabsContent value="orders" className="pt-6">
            <AdminOrders orders={orders} onReload={loadAll} setError={setError} />
          </TabsContent>

          <TabsContent value="payments" className="pt-6">
            <AdminPayments settings={settings} onSave={setSettings} setError={setError} />
          </TabsContent>
        </Tabs>

        <div className="mt-10">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất quản trị"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function AdminProducts({
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
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const totalImages = existingImages.length + newImages.length;
  const canAddMore = totalImages < 10;
  const remainingSlots = Math.max(0, 10 - totalImages);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return products;
    }
    return products.filter((product) =>
      [product.name, product.slug].some((value) => value?.toLowerCase().includes(term))
    );
  }, [products, query]);

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
      prev.includes(id) ? prev.filter((value) => value != id) : [...prev, id]
    );
  };

  const handleAddUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) {
      return;
    }
    if (!url.startsWith("http")) {
      setError("Vui l?ng nh?p URL h?p l?.");
      return;
    }
    if (!canAddMore) {
      setError("T?i ?a 10 ?nh cho m?i s?n ph?m.");
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
    if (files.length == 0) {
      return;
    }

    if (totalImages + files.length > 10) {
      setError("T?i ?a 10 ?nh cho m?i s?n ph?m.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadAdminFile(file)));
      setNewImages((prev) => [...prev, ...uploaded.map((item) => item.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? t?i ?nh l?n.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx != index));
  };

  const handleDeleteProduct = async (product: AdminProduct) => {
    const confirmed = window.confirm(`X?a s?n ph?m "${product.name}"?`);
    if (!confirmed) {
      return;
    }
    setError("");
    try {
      await deleteAdminProduct(product.id);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kh?ng th? x?a s?n ph?m.");
    }
  };

  const handleSubmit = async () => {
    setError("");
    const total = existingImages.length + newImages.length;
    if (total < 3) {
      setError("M?i s?n ph?m c?n t?i thi?u 3 ?nh.");
      return;
    }
    if (total > 10) {
      setError("T?i ?a 10 ?nh cho m?i s?n ph?m.");
      return;
    }
    if (!form.name.trim()) {
      setError("Vui l?ng nh?p t?n s?n ph?m.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Vui l?ng nh?p slug s?n ph?m.");
      return;
    }

    const priceValue = Number(form.price || 0);
    if (!priceValue || Number.isNaN(priceValue)) {
      setError("Vui l?ng nh?p gi? b?n h?p l?.");
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
      setError(err instanceof Error ? err.message : "Kh?ng th? l?u s?n ph?m.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Qu?n l? s?n ph?m</h3>
            <p className="text-sm text-ink/70">
              C?p nh?t th?ng tin, h?nh ?nh v? danh m?c cho t?ng s?n ph?m.
            </p>
          </div>
          <Button onClick={openCreateDialog}>Th?m s?n ph?m</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="field max-w-xs"
            placeholder="T?m theo t?n ho?c slug"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="text-xs text-ink/60">
            Hi?n th? {filteredProducts.length}/{products.length} s?n ph?m
          </span>
        </div>
        <div className="mt-5 grid gap-4">
          {filteredProducts.map((product) => {
            const firstImage = product.images?.[0]?.url;
            const statusLabel = product.status == "published" ? "?ang b?n" : "?n";
            return (
              <div
                key={product.id}
                className="rounded-2xl border border-forest/10 bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-mist">
                    {firstImage ? (
                      <Image
                        src={firstImage}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-ink/50">
                        Ch?a c? ?nh
                      </div>
                    )}
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <p className="text-base font-semibold">{product.name}</p>
                    <p className="text-xs text-ink/60">/{product.slug}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                      <span className="rounded-full bg-forest/10 px-3 py-1 text-forest">
                        {statusLabel}
                      </span>
                      <span>?nh: {product.images?.length || 0}</span>
                      <span>Th? t?: {product.sort_order}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold">{formatCurrency(product.price)}</p>
                    {product.compare_at_price ? (
                      <p className="text-xs text-ink/50 line-through">
                        {formatCurrency(product.compare_at_price)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.categories?.length ? (
                    product.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest"
                      >
                        {cat.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink/50">Ch?a g?n danh m?c</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSelectProduct(product)}>
                    Ch?nh s?a
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product)}>
                    X?a
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "C?p nh?t s?n ph?m" : "Th?m s?n ph?m"}</DialogTitle>
            <DialogDescription>
              T?i t?i thi?u 3 ?nh v? t?i ?a 10 ?nh cho m?i s?n ph?m. C? th? d?ng file t? m?y
              ho?c d?n URL h?nh ?nh.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-2xl border border-forest/10 bg-white p-4">
                <p className="text-sm font-semibold">Th?ng tin c? b?n</p>
                <input
                  className="field"
                  placeholder="T?n s?n ph?m"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                <input
                  className="field"
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                />
                <textarea
                  className="field h-24"
                  placeholder="M? t? ng?n"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>

              <div className="grid gap-3 rounded-2xl border border-forest/10 bg-white p-4">
                <p className="text-sm font-semibold">Gi? & tr?ng th?i</p>
                <input
                  className="field"
                  placeholder="Gi? b?n"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                />
                <input
                  className="field"
                  placeholder="Gi? ni?m y?t (n?u c?)"
                  value={form.compare_at_price}
                  onChange={(event) => setForm({ ...form, compare_at_price: event.target.value })}
                />
                <select
                  className="field"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="published">?ang b?n</option>
                  <option value="hidden">?n</option>
                </select>
                <input
                  className="field"
                  placeholder="Th? (ph?n t?ch b?ng d?u ph?y)"
                  value={form.tags}
                  onChange={(event) => setForm({ ...form, tags: event.target.value })}
                />
                <input
                  className="field"
                  placeholder="Th? t? hi?n th?"
                  value={form.sort_order}
                  onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                  />
                  S?n ph?m n?i b?t
                </label>
              </div>

              <div className="grid gap-3 rounded-2xl border border-forest/10 bg-white p-4">
                <p className="text-sm font-semibold">Danh m?c s?n ph?m</p>
                {categories.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => handleToggleCategory(cat.id)}
                        />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink/60">Ch?a c? danh m?c n?o.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 rounded-2xl border border-forest/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">?nh s?n ph?m</p>
                  <span className="text-xs text-ink/60">{totalImages}/10 ?nh</span>
                </div>

                {existingImages.length > 0 ? (
                  <div>
                    <p className="text-xs text-ink/60">?nh hi?n c? ({existingImages.length})</p>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {existingImages.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="h-14 w-14 overflow-hidden rounded-lg bg-mist"
                        >
                          <Image
                            src={url}
                            alt="?nh s?n ph?m"
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                            sizes="56px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink/60">Ch?a c? ?nh hi?n c?.</p>
                )}

                {newImages.length > 0 ? (
                  <div>
                    <p className="text-xs text-ink/60">?nh m?i ({newImages.length})</p>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {newImages.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative h-14 w-14 overflow-hidden rounded-lg bg-mist"
                        >
                          <Image
                            src={url}
                            alt="?nh m?i"
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                            sizes="56px"
                          />
                          <button
                            type="button"
                            className="absolute right-0 top-0 rounded-bl bg-white/90 px-1 text-xs"
                            onClick={() => handleRemoveNewImage(index)}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink/60">Ch?a c? ?nh m?i ???c th?m.</p>
                )}
              </div>

              <div className="grid gap-3 rounded-2xl border border-forest/10 bg-white p-4">
                <p className="text-sm font-semibold">Th?m ?nh</p>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold">T?i ?nh t? m?y</label>
                  <input
                    type="file"
                    className="field"
                    accept="image/*"
                    multiple
                    disabled={!canAddMore || uploading}
                    onChange={handleUploadFiles}
                  />
                  {uploading ? <p className="text-xs text-ink/60">?ang t?i ?nh...</p> : null}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold">Th?m ?nh b?ng URL</label>
                  <div className="flex gap-2">
                    <input
                      className="field"
                      placeholder="https://..."
                      value={imageUrlInput}
                      onChange={(event) => setImageUrlInput(event.target.value)}
                      disabled={!canAddMore}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddUrl}
                      disabled={!canAddMore}
                    >
                      Th?m
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-ink/60">
                  C?n c? th? th?m {remainingSlots} ?nh. H? th?ng y?u c?u t?i thi?u 3 ?nh.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest/10 bg-white p-4">
            <div className="text-sm text-ink/70">
              T?ng ?nh: {totalImages}/10. T?i thi?u 3 ?nh ?? l?u s?n ph?m.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
                ??ng
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || totalImages < 3 || totalImages > 10}
              >
                {editingId ? "L?u thay ??i" : "T?o s?n ph?m"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function AdminPosts({
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

  const handleSubmit = async () => {
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        cover_image: form.cover_image,
        status: form.status,
        tags: form.tags,
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
      setError(err instanceof Error ? err.message : "Failed to save post");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Danh sách kiến thức nhà nông</h3>
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-forest/10 bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{post.title}</p>
                  <p className="text-xs text-ink/60">{post.slug}</p>
                  <p className="text-xs text-ink/60">Trạng thái: {post.status}</p>
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
                          setError(err instanceof Error ? err.message : "Failed to delete post")
                        )
                    }
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Thêm kiến thức nhà nông</h3>
        <div className="mt-4 grid gap-3">
          <input className="field" placeholder="Tiêu đề" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <input className="field" placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          <input className="field" placeholder="URL ảnh bìa" value={form.cover_image} onChange={(event) => setForm({ ...form, cover_image: event.target.value })} />
          <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="published">published</option>
            <option value="hidden">hidden</option>
          </select>
          <input className="field" placeholder="Thẻ" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
          <input className="field" placeholder="Thứ tự" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} />
          <input className="field" placeholder="Ngày đăng (YYYY-MM-DD HH:MM:SS)" value={form.published_at} onChange={(event) => setForm({ ...form, published_at: event.target.value })} />
          <textarea className="field h-20" placeholder="Trích dẫn" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />
          <textarea className="field h-32" placeholder="Nội dung" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
          <Button onClick={handleSubmit}>
            {editingId ? "Lưu kiến thức" : "Tạo kiến thức"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={() => { setForm(initialForm); setEditingId(null); }}>
              Huy
            </Button>
          ) : null}
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

  const handleSubmit = async () => {
    try {
      const payload = {
        question: form.question,
        answer: form.answer,
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
      setError(err instanceof Error ? err.message : "Failed to save QnA");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Danh sách hỏi đáp</h3>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-forest/10 bg-white/80 p-4">
              <p className="text-sm font-semibold">{item.question}</p>
              <p className="mt-2 text-sm text-ink/70">{item.answer}</p>
              <p className="mt-2 text-xs text-ink/60">Trạng thái: {item.status}</p>
              <div className="mt-2 flex flex-wrap gap-2">
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
                        setError(err instanceof Error ? err.message : "Failed to delete QnA")
                      )
                  }
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Thêm hỏi đáp</h3>
        <div className="mt-4 grid gap-3">
          <input className="field" placeholder="Câu hỏi" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} />
          <textarea className="field h-24" placeholder="Trả lời" value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} />
          <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="published">published</option>
            <option value="hidden">hidden</option>
          </select>
          <input className="field" placeholder="Thứ tự" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} />
          <Button onClick={handleSubmit}>
            {editingId ? "Lưu hỏi đáp" : "Tạo hỏi đáp"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={() => { setForm(initialForm); setEditingId(null); }}>
              Huy
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AdminOrders({
  orders,
  onReload,
  setError
}: {
  orders: AdminOrder[];
  onReload: () => void;
  setError: (value: string) => void;
}) {
  const statusOptions = useMemo(() => ["pending", "confirmed", "shipping", "completed", "cancelled"], []);
  const paymentOptions = useMemo(() => ["pending", "proof_submitted", "paid", "rejected"], []);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
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
    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (paymentFilter && order.payment_status !== paymentFilter) return false;
      return true;
    });
  }, [orders, statusFilter, paymentFilter]);

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
      setError(err instanceof Error ? err.message : "Failed to update order");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-forest/10 bg-white/90 p-4">
        <label className="text-sm">
          Trạng thái
          <select className="field mt-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Thanh toán
          <select className="field mt-2" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
            <option value="">All</option>
            {paymentOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredOrders.map((order) => {
        const edit = edits[order.id];
        return (
          <div key={order.id} className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{order.order_number}</p>
                <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
                <p className="text-xs text-ink/60">Giao hàng: {order.shipping_method || "standard"}</p>
                {order.promo_code ? (
                  <p className="text-xs text-ink/60">Mã khuyến mãi: {order.promo_code}</p>
                ) : null}
              </div>
              <div className="text-sm text-ink/70">
                <p>{order.customer_name}</p>
                <p>{order.phone}</p>
              </div>
            </div>
            {edit ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  Tên khách hàng
                  <input className="field mt-2" value={edit.customer_name} onChange={(event) => updateEdit(order.id, { customer_name: event.target.value })} />
                </label>
                <label className="text-sm">
                  Email
                  <input className="field mt-2" value={edit.email} onChange={(event) => updateEdit(order.id, { email: event.target.value })} />
                </label>
                <label className="text-sm">
                  Số điện thoại
                  <input className="field mt-2" value={edit.phone} onChange={(event) => updateEdit(order.id, { phone: event.target.value })} />
                </label>
                <label className="text-sm">
                  Địa chỉ
                  <input className="field mt-2" value={edit.address} onChange={(event) => updateEdit(order.id, { address: event.target.value })} />
                </label>
                <label className="text-sm">
                  Thẻi gian giao
                  <input className="field mt-2" value={edit.delivery_time} onChange={(event) => updateEdit(order.id, { delivery_time: event.target.value })} />
                </label>
                <label className="text-sm">
                  Ghi chú đơn hàng
                  <textarea className="field mt-2 h-20" value={edit.note} onChange={(event) => updateEdit(order.id, { note: event.target.value })} />
                </label>
                <label className="text-sm">
                  Trạng thái
                  <select className="field mt-2" value={edit.status} onChange={(event) => updateEdit(order.id, { status: event.target.value })}>
                    {statusOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Trạng thái thanh toán
                  <select className="field mt-2" value={edit.payment_status} onChange={(event) => updateEdit(order.id, { payment_status: event.target.value })}>
                    {paymentOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            <div className="mt-3">
              <label className="text-sm">
                Ghi chú nội bộ
                <textarea className="field mt-2 h-20" value={edit?.admin_note || ""} onChange={(event) => updateEdit(order.id, { admin_note: event.target.value })} />
              </label>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => handleUpdate(order)}>
                  Lưu đơn hàng
                </Button>
              </div>
            </div>
            {order.payment_proof_url ? (
              <p className="mt-3 text-sm text-ink/70">Proof: {order.payment_proof_url}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AdminPayments({
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
      setError(err instanceof Error ? err.message : "Kh?ng th? c?p nh?t c?u h?nh thanh to?n.");
    }
  };

  return (
    <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
      <h3 className="text-lg font-semibold">C?u h?nh thanh to?n</h3>
      <p className="mt-2 text-sm text-ink/70">
        Admin ch? c?n nh?p Quick Link VietQR c?a shop. H? th?ng s? t? th?m s? ti?n
        v? n?i dung chuy?n kho?n theo t?ng ??n h?ng.
      </p>
      <div className="mt-5 grid gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.cod_enabled}
            onChange={(event) => setForm({ ...form, cod_enabled: event.target.checked })}
          />
          COD
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.bank_transfer_enabled}
            onChange={(event) => setForm({ ...form, bank_transfer_enabled: event.target.checked })}
          />
          Chuy?n kho?n
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.bank_qr_enabled}
            onChange={(event) => setForm({ ...form, bank_qr_enabled: event.target.checked })}
          />
          QR ng?n h?ng
        </label>

        <div className="mt-2">
          <label className="text-sm font-semibold">Quick Link VietQR</label>
          <input
            className="field mt-2"
            placeholder="https://img.vietqr.io/image/vcb-0123456789-compact2.png?accountName=NGUYEN%20VAN%20A"
            value={form.bank_qr_payload}
            onChange={(event) => setForm({ ...form, bank_qr_payload: event.target.value })}
          />
          <p className="mt-2 text-xs text-ink/60">
            V? d?: link VietQR c? s?n t? ng?n h?ng. B?n kh?ng c?n ?i?n th?m th?ng tin kh?c.
          </p>
        </div>

        <Button onClick={handleSave}>L?u c?u h?nh</Button>
      </div>
    </div>
  );
}
