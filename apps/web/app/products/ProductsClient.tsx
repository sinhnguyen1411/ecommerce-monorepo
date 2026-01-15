"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Filter } from "lucide-react";

import Pagination from "@/components/common/Pagination";
import ProductGrid from "@/components/product/ProductGrid";
import { Category, Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const sortOptions = [
  { value: "created-descending", label: "Mới nhất" },
  { value: "created-ascending", label: "Cũ nhất" },
  { value: "price-ascending", label: "Giá: Tăng dần" },
  { value: "price-descending", label: "Giá: Giảm dần" },
  { value: "title-ascending", label: "Tên: A-Z" },
  { value: "title-descending", label: "Tên: Z-A" },
  { value: "best-selling", label: "Bán chạy" },
  { value: "quantity-descending", label: "Tồn kho" }
];

type ProductsClientProps = {
  categories: Category[];
  products: Product[];
  initialCategory?: string;
  initialSort?: string;
  initialQuery?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialVendor?: string;
  initialColors?: string;
  initialSizes?: string;
};

type FilterState = {
  category: string;
  sort: string;
  query: string;
  priceMin: string;
  priceMax: string;
  vendors: string[];
  colors: string[];
  sizes: string[];
};

export default function ProductsClient({
  categories,
  products,
  initialCategory,
  initialSort,
  initialQuery,
  initialMinPrice,
  initialMaxPrice,
  initialVendor,
  initialColors,
  initialSizes
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname === "/collections/all" ? "/collections/all" : "/products";

  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");
  const [sort, setSort] = useState(initialSort || "created-descending");
  const [query, setQuery] = useState(initialQuery || "");
  const [priceMin, setPriceMin] = useState(initialMinPrice || "");
  const [priceMax, setPriceMax] = useState(initialMaxPrice || "");
  const [activeVendors, setActiveVendors] = useState(
    initialVendor ? initialVendor.split(",") : []
  );
  const [activeColors, setActiveColors] = useState(
    initialColors ? initialColors.split(",") : []
  );
  const [activeSizes, setActiveSizes] = useState(initialSizes ? initialSizes.split(",") : []);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const vendorOptions = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.vendor).filter(Boolean))
    ) as string[];
  }, [products]);

  const colorOptions = useMemo(() => {
    const values = new Set<string>();
    products.forEach((product) => {
      product.options?.forEach((option) => {
        if (option.name.toLowerCase().includes("mau") || option.name.toLowerCase().includes("color")) {
          option.values.forEach((value) => values.add(value));
        }
      });
      product.tags?.forEach((tag) => {
        if (tag.toLowerCase().startsWith("mau_")) {
          values.add(tag.replace("mau_", ""));
        }
      });
    });
    return Array.from(values);
  }, [products]);

  const sizeOptions = useMemo(() => {
    const values = new Set<string>();
    products.forEach((product) => {
      product.options?.forEach((option) => {
        if (option.name.toLowerCase().includes("size") || option.name.toLowerCase().includes("kich")) {
          option.values.forEach((value) => values.add(value));
        }
      });
      product.tags?.forEach((tag) => {
        if (tag.toLowerCase().startsWith("size_")) {
          values.add(tag.replace("size_", ""));
        }
      });
    });
    return Array.from(values);
  }, [products]);

  const buildParams = (overrides?: Partial<FilterState>) => {
    const state: FilterState = {
      category: activeCategory,
      sort,
      query,
      priceMin,
      priceMax,
      vendors: activeVendors,
      colors: activeColors,
      sizes: activeSizes,
      ...overrides
    };
    const params = new URLSearchParams();
    if (state.query) {
      params.set("q", state.query);
    }
    if (state.category && state.category !== "all") {
      params.set("category", state.category);
    }
    if (state.sort && state.sort !== "created-descending") {
      params.set("sort_by", state.sort);
    }
    if (state.priceMin) {
      params.set("price_min", state.priceMin);
    }
    if (state.priceMax) {
      params.set("price_max", state.priceMax);
    }
    if (state.vendors.length) {
      params.set("vendor", state.vendors.join(","));
    }
    if (state.colors.length) {
      params.set("color", state.colors.join(","));
    }
    if (state.sizes.length) {
      params.set("size", state.sizes.join(","));
    }
    return params;
  };

  const updateRoute = (overrides?: Partial<FilterState>) => {
    const params = buildParams(overrides);
    const queryString = params.toString();
    router.replace(queryString ? `${basePath}?${queryString}` : basePath);
  };

  const filtered = useMemo(() => {
    let list = [...products];
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;

    if (query) {
      const lower = query.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(lower) ||
          product.description?.toLowerCase().includes(lower)
      );
    }

    if (activeCategory !== "all") {
      list = list.filter((product) =>
        product.categories?.some((category) => category.slug === activeCategory)
      );
    }

    if (activeVendors.length) {
      list = list.filter((product) =>
        product.vendor ? activeVendors.includes(product.vendor) : false
      );
    }

    if (min != null && !Number.isNaN(min)) {
      list = list.filter((product) => product.price >= min);
    }
    if (max != null && !Number.isNaN(max)) {
      list = list.filter((product) => product.price <= max);
    }

    if (activeColors.length) {
      list = list.filter((product) => {
        const tags = product.tags || [];
        const options = product.options || [];
        return activeColors.some((color) => {
          return (
            tags.some((tag) => tag.toLowerCase().includes(color.toLowerCase())) ||
            options.some((option) =>
              option.values.some((value) => value.toLowerCase() === color.toLowerCase())
            )
          );
        });
      });
    }

    if (activeSizes.length) {
      list = list.filter((product) => {
        const tags = product.tags || [];
        const options = product.options || [];
        return activeSizes.some((size) => {
          return (
            tags.some((tag) => tag.toLowerCase().includes(size.toLowerCase())) ||
            options.some((option) =>
              option.values.some((value) => value.toLowerCase() === size.toLowerCase())
            )
          );
        });
      });
    }

    switch (sort) {
      case "price-ascending":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-descending":
        list.sort((a, b) => b.price - a.price);
        break;
      case "title-ascending":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "title-descending":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "created-ascending":
        list.sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        break;
      case "created-descending":
        list.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        break;
      case "quantity-descending":
        list.sort((a, b) => (b.inventory_quantity || 0) - (a.inventory_quantity || 0));
        break;
      default:
        break;
    }

    return list;
  }, [
    products,
    activeCategory,
    sort,
    query,
    priceMin,
    priceMax,
    activeVendors,
    activeColors,
    activeSizes
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const activeTags = useMemo(() => {
    const tags: { key: string; label: string; onRemove: () => void }[] = [];
    if (query) {
      tags.push({
        key: "q",
        label: `Tìm kiếm: ${query}`,
        onRemove: () => {
          setQuery("");
          setPage(1);
          updateRoute({ query: "" });
        }
      });
    }
    if (activeCategory !== "all") {
      const category = categories.find((item) => item.slug === activeCategory);
      tags.push({
        key: "category",
        label: category?.name || activeCategory,
        onRemove: () => {
          setActiveCategory("all");
          setPage(1);
          updateRoute({ category: "all" });
        }
      });
    }
    if (activeVendors.length) {
      activeVendors.forEach((vendor) =>
        tags.push({
          key: `vendor-${vendor}`,
          label: vendor,
          onRemove: () => {
            const next = activeVendors.filter((item) => item !== vendor);
            setActiveVendors(next);
            setPage(1);
            updateRoute({ vendors: next });
          }
        })
      );
    }
    if (priceMin || priceMax) {
      const minValue = Number(priceMin);
      const maxValue = Number(priceMax);
      tags.push({
        key: "price",
        label: `${priceMin ? formatCurrency(Number.isNaN(minValue) ? 0 : minValue) : "0"} - ${
          priceMax ? formatCurrency(Number.isNaN(maxValue) ? 0 : maxValue) : "..."
        }`,
        onRemove: () => {
          setPriceMin("");
          setPriceMax("");
          setPage(1);
          updateRoute({ priceMin: "", priceMax: "" });
        }
      });
    }
    if (activeColors.length) {
      activeColors.forEach((color) =>
        tags.push({
          key: `color-${color}`,
          label: color,
          onRemove: () => {
            const next = activeColors.filter((item) => item !== color);
            setActiveColors(next);
            setPage(1);
            updateRoute({ colors: next });
          }
        })
      );
    }
    if (activeSizes.length) {
      activeSizes.forEach((size) =>
        tags.push({
          key: `size-${size}`,
          label: size,
          onRemove: () => {
            const next = activeSizes.filter((item) => item !== size);
            setActiveSizes(next);
            setPage(1);
            updateRoute({ sizes: next });
          }
        })
      );
    }
    return tags;
  }, [
    query,
    activeCategory,
    activeVendors,
    priceMin,
    priceMax,
    activeColors,
    activeSizes,
    categories
  ]);

  const clearFilters = () => {
    setActiveCategory("all");
    setSort("created-descending");
    setQuery("");
    setPriceMin("");
    setPriceMax("");
    setActiveVendors([]);
    setActiveColors([]);
    setActiveSizes([]);
    setPage(1);
    updateRoute({
      category: "all",
      sort: "created-descending",
      query: "",
      priceMin: "",
      priceMax: "",
      vendors: [],
      colors: [],
      sizes: []
    });
  };

  const FilterPanel = (
    <div className="space-y-6 text-sm text-ink/70">
      <div className="rounded-2xl border border-forest/10 bg-white/90 p-4">
        <p className="text-sm font-semibold text-ink">Danh mục sản phẩm</p>
        <div className="mt-3 space-y-2">
          <button
            className={`block w-full text-left ${activeCategory === "all" ? "text-forest" : ""}`}
            onClick={() => {
              setActiveCategory("all");
              setPage(1);
              updateRoute({ category: "all" });
            }}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`block w-full text-left ${
                activeCategory === category.slug ? "text-forest" : ""
              }`}
              onClick={() => {
                setActiveCategory(category.slug);
                setPage(1);
                updateRoute({ category: category.slug });
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-forest/10 bg-white/90 p-4">
        <p className="text-sm font-semibold text-ink">Thương hiệu</p>
        <div className="mt-3 space-y-2">
          {vendorOptions.length === 0 ? (
            <p className="text-xs text-ink/60">Đang cập nhật.</p>
          ) : (
            vendorOptions.map((vendor) => (
              <label key={vendor} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={activeVendors.includes(vendor)}
                  onChange={() => {
                    const next = activeVendors.includes(vendor)
                      ? activeVendors.filter((item) => item !== vendor)
                      : [...activeVendors, vendor];
                    setActiveVendors(next);
                    setPage(1);
                    updateRoute({ vendors: next });
                  }}
                />
                {vendor}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-forest/10 bg-white/90 p-4">
        <p className="text-sm font-semibold text-ink">Khoảng giá</p>
        <div className="mt-3 grid gap-2">
          <input
            className="field"
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            placeholder="Giá từ"
          />
          <input
            className="field"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            placeholder="Giá đến"
          />
          <button
            className="btn-ghost"
            onClick={() => {
              setPage(1);
              updateRoute({ priceMin, priceMax });
            }}
          >
            Áp dụng
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-forest/10 bg-white/90 p-4">
        <p className="text-sm font-semibold text-ink">Màu sắc</p>
        <div className="mt-3 space-y-2">
          {colorOptions.length === 0 ? (
            <p className="text-xs text-ink/60">Đang cập nhật.</p>
          ) : (
            colorOptions.map((color) => (
              <label key={color} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={activeColors.includes(color)}
                  onChange={() => {
                    const next = activeColors.includes(color)
                      ? activeColors.filter((item) => item !== color)
                      : [...activeColors, color];
                    setActiveColors(next);
                    setPage(1);
                    updateRoute({ colors: next });
                  }}
                />
                {color}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-forest/10 bg-white/90 p-4">
        <p className="text-sm font-semibold text-ink">Kích cỡ</p>
        <div className="mt-3 space-y-2">
          {sizeOptions.length === 0 ? (
            <p className="text-xs text-ink/60">Đang cập nhật.</p>
          ) : (
            sizeOptions.map((size) => (
              <label key={size} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={activeSizes.includes(size)}
                  onChange={() => {
                    const next = activeSizes.includes(size)
                      ? activeSizes.filter((item) => item !== size)
                      : [...activeSizes, size];
                    setActiveSizes(next);
                    setPage(1);
                    updateRoute({ sizes: next });
                  }}
                />
                {size}
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="section-shell pb-16">
      <div className="text-xs text-ink/60">
        <Link href="/" className="hover:text-forest">
          Trang chủ
        </Link>{" "}
        / <span>Sản phẩm</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink/60">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-xs font-semibold text-forest lg:hidden">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </button>
            </SheetTrigger>
            <SheetContent className="max-w-sm">
              <SheetHeader>
                <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{FilterPanel}</div>
            </SheetContent>
          </Sheet>
          <span>Tìm thấy {filtered.length} sản phẩm</span>
          {activeTags.length ? (
            <button
              className="rounded-full border border-forest/20 px-3 py-1 text-forest"
              onClick={clearFilters}
            >
              Xóa lọc
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <input
            className="field w-56"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm sản phẩm"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setPage(1);
                updateRoute({ query });
              }
            }}
          />
          <select
            className="field w-44"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
              updateRoute({ sort: event.target.value });
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">{FilterPanel}</aside>
        <div>
          {activeTags.length ? (
            <div className="flex flex-wrap gap-2">
              {activeTags.map((tag) => (
                <button
                  key={tag.key}
                  className="rounded-full border border-forest/20 px-3 py-1 text-xs text-forest"
                  onClick={tag.onRemove}
                >
                  {tag.label} x
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            <ProductGrid products={pageItems} />
          </div>
          <div className="mt-10">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(value) => setPage(value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
