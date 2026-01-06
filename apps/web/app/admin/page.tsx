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
  updateAdminOrder,
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
          title="Dang nhap quan tri"
          description="Vui long dang nhap de quan ly noi dung."
        />
        <div className="mt-6">
          <Link className="btn-primary" href="/admin/login">
            Di den trang dang nhap
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
          title="Bang dieu khien"
          description="Quan ly san pham, bai viet, don hang va thanh toan."
        />
      </section>

      <section className="section-shell pb-16">
        {error ? <p className="mb-4 text-sm text-clay">{error}</p> : null}
        <div className="mb-6 rounded-[28px] border border-forest/10 bg-white/90 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Tai len hinh anh</h2>
              <p className="text-sm text-ink/70">Dung URL nay cho anh san pham/bai viet.</p>
            </div>
            <input type="file" onChange={(event) => handleUpload(event.target.files?.[0] || null)} />
          </div>
          {uploadUrl ? (
            <p className="mt-3 text-sm text-ink/70">URL: {uploadUrl}</p>
          ) : null}
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">San pham</TabsTrigger>
            <TabsTrigger value="categories">Danh muc</TabsTrigger>
            <TabsTrigger value="posts">Tin tuc</TabsTrigger>
            <TabsTrigger value="qna">Hoi dap</TabsTrigger>
            <TabsTrigger value="orders">Don hang</TabsTrigger>
            <TabsTrigger value="payments">Thanh toan</TabsTrigger>
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
            Dang xuat admin
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
  const [form, setForm] = useState({
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
  });

  const handleCreate = async () => {
    try {
      const categoryIds = form.category_ids
        .split(",")
        .map((value) => parseInt(value.trim(), 10))
        .filter((value) => !Number.isNaN(value));

      const created = await createAdminProduct({
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
      });

      if (form.image_url) {
        await addAdminProductImage(created.id, { url: form.image_url, sort_order: 0 });
      }

      setForm({
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
      });
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Danh sach san pham</h3>
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
              <div className="mt-2 text-xs text-ink/60">Status: {product.status}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.categories?.map((cat) => (
                  <span key={cat.id} className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    {cat.name}
                  </span>
                ))}
              </div>
              <div className="mt-3">
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
                  Xoa
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Them san pham</h3>
        <div className="mt-4 grid gap-3">
          <input className="field" placeholder="Ten san pham" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="field" placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          <input className="field" placeholder="Gia" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          <input className="field" placeholder="Gia giam" value={form.compare_at_price} onChange={(event) => setForm({ ...form, compare_at_price: event.target.value })} />
          <input className="field" placeholder="Tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
          <input className="field" placeholder="Thu tu hien thi" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} />
          <textarea className="field h-24" placeholder="Mo ta" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input className="field" placeholder="Category IDs (1,2,3)" value={form.category_ids} onChange={(event) => setForm({ ...form, category_ids: event.target.value })} />
          <input className="field" placeholder="Image URL" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
            San pham noi bat
          </label>
          <Button onClick={handleCreate}>Tao san pham</Button>
        </div>
        <p className="mt-4 text-xs text-ink/60">Danh muc co san: {categories.map((cat) => `${cat.id}:${cat.name}`).join(" | ")}</p>
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
  const [form, setForm] = useState({ name: "", slug: "", description: "", sort_order: "0" });

  const handleCreate = async () => {
    try {
      await createAdminCategory({
        name: form.name,
        slug: form.slug,
        description: form.description,
        sort_order: Number(form.sort_order || 0)
      });
      setForm({ name: "", slug: "", description: "", sort_order: "0" });
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
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
          <Button onClick={handleCreate}>Tao danh muc</Button>
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
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    status: "published",
    tags: "",
    sort_order: "0",
    published_at: ""
  });

  const handleCreate = async () => {
    try {
      await createAdminPost({
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        cover_image: form.cover_image,
        status: form.status,
        tags: form.tags,
        sort_order: Number(form.sort_order || 0),
        published_at: form.published_at
      });
      setForm({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        cover_image: "",
        status: "published",
        tags: "",
        sort_order: "0",
        published_at: ""
      });
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Danh sach bai viet</h3>
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-forest/10 bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{post.title}</p>
                  <p className="text-xs text-ink/60">{post.slug}</p>
                </div>
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
                  Xoa
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Them bai viet</h3>
        <div className="mt-4 grid gap-3">
          <input className="field" placeholder="Tieu de" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <input className="field" placeholder="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          <input className="field" placeholder="Cover image URL" value={form.cover_image} onChange={(event) => setForm({ ...form, cover_image: event.target.value })} />
          <input className="field" placeholder="Tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
          <input className="field" placeholder="Published at (YYYY-MM-DD HH:MM:SS)" value={form.published_at} onChange={(event) => setForm({ ...form, published_at: event.target.value })} />
          <textarea className="field h-20" placeholder="Excerpt" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />
          <textarea className="field h-32" placeholder="Content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
          <Button onClick={handleCreate}>Tao bai viet</Button>
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
  const [form, setForm] = useState({ question: "", answer: "", status: "published", sort_order: "0" });

  const handleCreate = async () => {
    try {
      await createAdminQnA({
        question: form.question,
        answer: form.answer,
        status: form.status,
        sort_order: Number(form.sort_order || 0)
      });
      setForm({ question: "", answer: "", status: "published", sort_order: "0" });
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create QnA");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Danh sach hoi dap</h3>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-forest/10 bg-white/80 p-4">
              <p className="text-sm font-semibold">{item.question}</p>
              <p className="mt-2 text-sm text-ink/70">{item.answer}</p>
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
                Xoa
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
        <h3 className="text-lg font-semibold">Them hoi dap</h3>
        <div className="mt-4 grid gap-3">
          <input className="field" placeholder="Cau hoi" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} />
          <textarea className="field h-24" placeholder="Tra loi" value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} />
          <Button onClick={handleCreate}>Tao hoi dap</Button>
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
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    const next: Record<number, string> = {};
    orders.forEach((order) => {
      next[order.id] = order.admin_note || "";
    });
    setNotes(next);
  }, [orders]);

  const handleUpdate = async (order: AdminOrder, status: string, paymentStatus: string) => {
    try {
      await updateAdminOrder(order.id, {
        status,
        payment_status: paymentStatus,
        admin_note: notes[order.id] || ""
      });
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-[28px] border border-forest/10 bg-white/90 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{order.order_number}</p>
              <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
            </div>
            <div className="text-sm text-ink/70">
              <p>{order.customer_name}</p>
              <p>{order.phone}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Trang thai
              <select
                className="field mt-2"
                defaultValue={order.status}
                onChange={(event) => handleUpdate(order, event.target.value, order.payment_status)}
              >
                {statusOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Thanh toan
              <select
                className="field mt-2"
                defaultValue={order.payment_status}
                onChange={(event) => handleUpdate(order, order.status, event.target.value)}
              >
                {paymentOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3">
            <label className="text-sm">
              Ghi chu noi bo
              <textarea
                className="field mt-2 h-20"
                value={notes[order.id] || ""}
                onChange={(event) => setNotes({ ...notes, [order.id]: event.target.value })}
              />
            </label>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate(order, order.status, order.payment_status)}
              >
                Luu ghi chu
              </Button>
            </div>
          </div>
          {order.payment_proof_url ? (
            <p className="mt-3 text-sm text-ink/70">Proof: {order.payment_proof_url}</p>
          ) : null}
        </div>
      ))}
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
      <h3 className="text-lg font-semibold">Cau hinh thanh toan</h3>
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
        <input className="field" placeholder="Ten ngan hang" value={form.bank_name} onChange={(event) => setForm({ ...form, bank_name: event.target.value })} />
        <input className="field" placeholder="So tai khoan" value={form.bank_account} onChange={(event) => setForm({ ...form, bank_account: event.target.value })} />
        <input className="field" placeholder="Chu tai khoan" value={form.bank_holder} onChange={(event) => setForm({ ...form, bank_holder: event.target.value })} />
        <input className="field" placeholder="QR payload" value={form.bank_qr_payload} onChange={(event) => setForm({ ...form, bank_qr_payload: event.target.value })} />
        <Button onClick={handleSave}>Luu cau hinh</Button>
      </div>
    </div>
  );
}
