"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import SectionTitle from "@/components/common/SectionTitle";
import { Button } from "@/components/ui/button";
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
import { clearAdminToken, getAdminToken } from "@/lib/auth";

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [qna, setQnA] = useState<AdminQnA[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [error, setError] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");

  const isAuthed = Boolean(getAdminToken());

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
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    }
  };

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
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

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
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
            <TabsTrigger value="posts">Tin tức</TabsTrigger>
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

          <TabsContent value="categories" className="pt-6">
            <AdminCategories categories={categories} onReload={loadAll} setError={setError} />
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
            onClick={() => {
              clearAdminToken();
              window.location.reload();
            }}
          >
            Đăng xuất admin
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
    description: "",
    category_ids: "",
    image_url: ""
  };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async () => {
    try {
      const categoryIds = form.category_ids
        .split(",")
        .map((value) => parseInt(value.trim(), 10))
        .filter((value) => !Number.isNaN(value));

      const payload = {
        name: form.name,
        slug: form.slug,
        price: Number(form.price || 0),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
        status: form.status,
        featured: form.featured,
        tags: form.tags,
        sort_order: Number(form.sort_order || 0),
        description: form.description,
        category_ids: categoryIds
      };

      const result = editingId
        ? await updateAdminProduct(editingId, payload)
        : await createAdminProduct(payload);

      if (form.image_url) {
        const targetId = editingId || result.id;
        await addAdminProductImage(targetId, { url: form.image_url, sort_order: 0 });
      }

      setForm(initialForm);
      setEditingId(null);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Danh sách sản phẩm</h3>
        <div className="mt-4 space-y-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-forest/10 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-ink/60">{product.slug}</p>
                </div>
                <div className="text-sm text-ink/70">{formatCurrency(product.price)}</div>
              </div>
              <div className="mt-2 text-xs text-ink/60">Trạng thái: {product.status}</div>
              <div className="mt-1 text-xs text-ink/60">Thẻ: {product.tags || "-"}</div>
              <div className="mt-1 text-xs text-ink/60">Thứ tự: {product.sort_order}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.categories?.map((cat) => (
                  <span key={cat.id} className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    {cat.name}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
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
                      description: product.description || "",
                      category_ids: product.categories?.map((cat) => cat.id).join(",") || "",
                      image_url: ""
                    });
                  }}
                >
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    deleteAdminProduct(product.id)
                      .then(onReload)
                      .catch((err) =>
                        setError(err instanceof Error ? err.message : "Failed to delete product")
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
        <h3 className="text-lg font-semibold">Thêm sản phẩm</h3>
        <div className="mt-4 grid gap-3">
          <input className="field" placeholder="Tên sản phẩm" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="field" placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          <input className="field" placeholder="Giá" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          <input className="field" placeholder="Giá giam" value={form.compare_at_price} onChange={(event) => setForm({ ...form, compare_at_price: event.target.value })} />
          <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="published">published</option>
            <option value="hidden">hidden</option>
          </select>
          <input className="field" placeholder="Thẻ" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
          <input className="field" placeholder="Thứ tự hiển thị" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} />
          <textarea className="field h-24" placeholder="Mô tả" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input className="field" placeholder="ID danh mục (1,2,3)" value={form.category_ids} onChange={(event) => setForm({ ...form, category_ids: event.target.value })} />
          <input className="field" placeholder="URL hình ảnh" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
            Sản phẩm nổi bật
          </label>
          <Button onClick={handleSubmit}>
            {editingId ? "Lưu sản phẩm" : "Tạo sản phẩm"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={() => { setForm(initialForm); setEditingId(null); }}>
              Huy
            </Button>
          ) : null}
        </div>
        <p className="mt-4 text-xs text-ink/60">Danh mục có sẵn: {categories.map((cat) => `${cat.id}:${cat.name}`).join(" | ")}</p>
      </div>
    </div>
  );
}

function AdminCategories({
  categories,
  onReload,
  setError
}: {
  categories: AdminCategory[];
  onReload: () => void;
  setError: (value: string) => void;
}) {
  const initialForm = { name: "", slug: "", description: "", sort_order: "0" };
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async () => {
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        sort_order: Number(form.sort_order || 0)
      };

      if (editingId) {
        await updateAdminCategory(editingId, payload);
      } else {
        await createAdminCategory(payload);
      }

      setForm(initialForm);
      setEditingId(null);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Danh sach danh muc</h3>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-2xl border border-forest/10 bg-white/80 p-4 text-sm">
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-xs text-ink/60">{category.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(category.id);
                    setForm({
                      name: category.name,
                      slug: category.slug,
                      description: category.description || "",
                      sort_order: String(category.sort_order || 0)
                    });
                  }}
                >
                  Sua
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    deleteAdminCategory(category.id)
                      .then(onReload)
                      .catch((err) =>
                        setError(err instanceof Error ? err.message : "Failed to delete category")
                      )
                  }
                >
                  Xoa
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Them danh muc</h3>
        <div className="mt-4 grid gap-3">
          <input className="field" placeholder="Ten" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="field" placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          <input className="field" placeholder="Thu tu" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} />
          <textarea className="field h-24" placeholder="Mo ta" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <Button onClick={handleSubmit}>
            {editingId ? "Luu danh muc" : "Tao danh muc"}
          </Button>
          {editingId ? (
            <Button
              variant="outline"
              onClick={() => {
                setForm(initialForm);
                setEditingId(null);
              }}
            >
              Huy
            </Button>
          ) : null}
        </div>
      </div>
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
        <h3 className="text-lg font-semibold">Danh sách bài viết</h3>
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
        <h3 className="text-lg font-semibold">Thêm bài viết</h3>
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
            {editingId ? "Lưu bài viết" : "Tạo bài viết"}
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
      bank_qr_payload: ""
    }
  );

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      const updated = await updatePaymentSettings(form);
      onSave(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment settings");
    }
  };

  return (
    <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
      <h3 className="text-lg font-semibold">Cấu hình thanh toán</h3>
      <div className="mt-4 grid gap-3">
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
          Chuyen khoan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.bank_qr_enabled}
            onChange={(event) => setForm({ ...form, bank_qr_enabled: event.target.checked })}
          />
          QR Ngan hang
        </label>
        <input className="field" placeholder="Tên ngân hàng" value={form.bank_name} onChange={(event) => setForm({ ...form, bank_name: event.target.value })} />
        <input className="field" placeholder="Số tài khoản" value={form.bank_account} onChange={(event) => setForm({ ...form, bank_account: event.target.value })} />
        <input className="field" placeholder="Chủ tài khoản" value={form.bank_holder} onChange={(event) => setForm({ ...form, bank_holder: event.target.value })} />
        <input className="field" placeholder="Nội dung QR" value={form.bank_qr_payload} onChange={(event) => setForm({ ...form, bank_qr_payload: event.target.value })} />
        <Button onClick={handleSave}>Lưu cấu hình</Button>
      </div>
    </div>
  );
}
