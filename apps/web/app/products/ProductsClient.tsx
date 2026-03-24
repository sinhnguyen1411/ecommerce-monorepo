"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Pagination from "@/components/common/Pagination";
import ProductGrid from "@/components/product/ProductGrid";
import { Category, Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const sortOptions = [
  { value: "price-ascending", label: "Giá: Tăng dần" },
  { value: "price-descending", label: "Giá: Giảm dần" },
  { value: "title-ascending", label: "Tên: A-Z" },
  { value: "title-descending", label: "Tên: Z-A" },
  { value: "created-ascending", label: "Cũ nhất" },
  { value: "created-descending", label: "Mới nhất" },
  { value: "best-selling", label: "Bán chạy nhất" },
  { value: "quantity-descending", label: "Tồn kho giảm dần" }
];

const HOT_PROMOTION_TAGS = ["hot", "sale", "flash-sale", "khuyen-mai", "khuyenmai", "giam-gia"];

function getDiscountPercent(product: Product) {
  if (typeof product.compare_at_price !== "number" || product.compare_at_price <= product.price) {
    return 0;
  }
  return Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
}

function isHotPromotionProduct(product: Product) {
  const discountPercent = getDiscountPercent(product);
  if (discountPercent <= 0) {
    return false;
  }
  const normalizedTags = (product.tags || []).map((tag) => tag.toLowerCase());
  const hasHotTag = normalizedTags.some((tag) =>
    HOT_PROMOTION_TAGS.some((keyword) => tag.includes(keyword))
  );
  return discountPercent >= 10 || Boolean(product.featured) || hasHotTag;
}

type ProductsClientProps = {
  categories: Category[];
  products: Product[];
  initialCategory?: string;
  initialSort?: string;
  initialQuery?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialVendor?: string;
  initialPromotion?: string;
};

type FilterState = {
  category: string;
  sort: string;
  query: string;
  priceMin: string;
  priceMax: string;
  vendors: string[];
  promotionOnly: boolean;
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
  initialPromotion
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname === "/collections/all" ? "/collections/all" : "/products";

  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");
  const [sort, setSort] = useState(initialSort || "created-descending");
  const [query, setQuery] = useState(initialQuery || "");
  const [queryInput, setQueryInput] = useState(initialQuery || "");
  const [priceMin, setPriceMin] = useState(initialMinPrice || "");
  const [priceMax, setPriceMax] = useState(initialMaxPrice || "");
  const [priceMinInput, setPriceMinInput] = useState(initialMinPrice || "");
  const [priceMaxInput, setPriceMaxInput] = useState(initialMaxPrice || "");
  const [activeVendors, setActiveVendors] = useState(
    initialVendor ? initialVendor.split(",") : []
  );
  const [promotionOnly, setPromotionOnly] = useState(
    ["1", "true", "hot"].includes((initialPromotion || "").toLowerCase())
  );
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 9;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!sortRef.current || sortRef.current.contains(event.target as Node)) {
        return;
      }
      setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const vendorOptions = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.vendor).filter(Boolean))
    ) as string[];
  }, [products]);

  const buildParams = useCallback((overrides?: Partial<FilterState>) => {
    const state: FilterState = {
      category: activeCategory,
      sort,
      query,
      priceMin,
      priceMax,
      vendors: activeVendors,
      promotionOnly,
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
    if (state.promotionOnly) {
      params.set("promo", "hot");
    }
    return params;
  }, [activeCategory, sort, query, priceMin, priceMax, activeVendors, promotionOnly]);

  const updateRoute = useCallback((overrides?: Partial<FilterState>) => {
    const params = buildParams(overrides);
    const queryString = params.toString();
    router.replace(queryString ? `${basePath}?${queryString}` : basePath);
  }, [basePath, buildParams, router]);

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

    if (promotionOnly) {
      list = list.filter(isHotPromotionProduct);
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
    promotionOnly
  ]);

  const hotPromotionCount = useMemo(
    () => products.filter((product) => isHotPromotionProduct(product)).length,
    [products]
  );
  const hasActiveFilters = useMemo(
    () =>
      Boolean(query) ||
      activeCategory !== "all" ||
      activeVendors.length > 0 ||
      Boolean(priceMin) ||
      Boolean(priceMax) ||
      promotionOnly,
    [query, activeCategory, activeVendors, priceMin, priceMax, promotionOnly]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const activeTags = useMemo(() => {
    const tags: { key: string; label: string; value: string; onRemove: () => void }[] = [];
    if (query) {
      tags.push({
        key: "q",
        label: "Từ khóa",
        value: query,
        onRemove: () => {
          setQuery("");
          setQueryInput("");
          setPage(1);
          updateRoute({ query: "" });
        }
      });
    }
    if (activeCategory !== "all") {
      const category = categories.find((item) => item.slug === activeCategory);
      tags.push({
        key: "category",
        label: "Danh mục",
        value: category?.name || activeCategory,
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
          label: "Thương hiệu",
          value: vendor,
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
        label: "Khoảng giá",
        value: `${priceMin ? formatCurrency(Number.isNaN(minValue) ? 0 : minValue) : "0"} - ${
          priceMax ? formatCurrency(Number.isNaN(maxValue) ? 0 : maxValue) : "..."
        }`,
        onRemove: () => {
          setPriceMin("");
          setPriceMax("");
          setPriceMinInput("");
          setPriceMaxInput("");
          setPage(1);
          updateRoute({ priceMin: "", priceMax: "" });
        }
      });
    }
    if (promotionOnly) {
      tags.push({
        key: "promo",
        label: "Khuyến mãi",
        value: "Giảm sâu",
        onRemove: () => {
          setPromotionOnly(false);
          setPage(1);
          updateRoute({ promotionOnly: false });
        }
      });
    }
    return tags;
  }, [
    query,
    activeCategory,
    activeVendors,
    priceMin,
    priceMax,
    promotionOnly,
    categories,
    updateRoute
  ]);

  const clearFilters = () => {
    setActiveCategory("all");
    setSort("created-descending");
    setQuery("");
    setQueryInput("");
    setPriceMin("");
    setPriceMax("");
    setPriceMinInput("");
    setPriceMaxInput("");
    setActiveVendors([]);
    setPromotionOnly(false);
    setPage(1);
    updateRoute({
      category: "all",
      sort: "created-descending",
      query: "",
      priceMin: "",
      priceMax: "",
      vendors: [],
      promotionOnly: false
    });
  };

  const applyPriceFilter = useCallback(() => {
    const min = priceMinInput.trim();
    const max = priceMaxInput.trim();
    if (min !== priceMinInput) {
      setPriceMinInput(min);
    }
    if (max !== priceMaxInput) {
      setPriceMaxInput(max);
    }
    if (min === priceMin && max === priceMax) {
      return;
    }
    setPriceMin(min);
    setPriceMax(max);
    setPage(1);
    updateRoute({ priceMin: min, priceMax: max });
  }, [priceMinInput, priceMaxInput, priceMin, priceMax, updateRoute]);

  const applyQueryFilter = useCallback(() => {
    const normalizedQuery = queryInput.trim();
    if (normalizedQuery !== queryInput) {
      setQueryInput(normalizedQuery);
    }
    if (normalizedQuery === query) {
      return;
    }
    setQuery(normalizedQuery);
    setPage(1);
    updateRoute({ query: normalizedQuery });
  }, [queryInput, query, updateRoute]);

  const FilterPanel = (
    <div className="filter-inner">
      <div className="filter-head">
        <p>Bộ lọc</p>
      </div>
      <div className="filter-options">
        <div className="filter_group filter_group_block filter_group-search">
          <div className="filter_group-subtitle">
            <span>Tìm kiếm</span>
          </div>
          <div className="filter_group-content">
            <div className="filter-search">
              <input
                className="field"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Tìm sản phẩm..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyQueryFilter();
                  }
                }}
              />
              <p className="filter-note">Nhấn Enter để tìm sản phẩm.</p>
            </div>
          </div>
        </div>

        <div className="filter_group filter_group_block">
          <div className="filter_group-subtitle">
            <span>Khuyến mãi nổi bật</span>
          </div>
          <div className="filter_group-content">
            <button
              type="button"
              className={`promo-highlight ${promotionOnly ? "active" : ""}`}
              onClick={() => {
                if (hotPromotionCount === 0) {
                  return;
                }
                const next = !promotionOnly;
                setPromotionOnly(next);
                setPage(1);
                updateRoute({ promotionOnly: next });
              }}
              disabled={hotPromotionCount === 0}
            >
              <span className="promo-highlight__badge">HOT</span>
              <span className="promo-highlight__status">
                {promotionOnly ? "Đang áp dụng" : "Chưa áp dụng"}
              </span>
              <span className="promo-highlight__title">Khuyến mãi giảm sâu</span>
              <span className="promo-highlight__meta">
                {hotPromotionCount === 0
                  ? "Chưa có sản phẩm giảm giá nổi bật"
                  : `${hotPromotionCount} sản phẩm đang ưu đãi`}
              </span>
            </button>
            <p className="promo-highlight__note">
              Xem nhanh các sản phẩm đang giảm giá tốt hôm nay.
            </p>
          </div>
        </div>

        <div className="filter_group filter_group_block">
          <div className="filter_group-subtitle">
            <span>Danh mục sản phẩm</span>
          </div>
          <div className="filter_group-content layered-category">
            <ul className="tree-menu">
              <li>
                <button
                  type="button"
                  className={`filter-link ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory("all");
                    setPage(1);
                    updateRoute({ category: "all" });
                  }}
                >
                  Tất cả
                </button>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className={`filter-link ${
                      activeCategory === category.slug ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveCategory(category.slug);
                      setPage(1);
                      updateRoute({ category: category.slug });
                    }}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="filter_group filter_group_block">
          <div className="filter_group-subtitle">
            <span>Thương hiệu</span>
          </div>
          <div className="filter_group-content">
            {vendorOptions.length === 0 ? (
              <p className="filter-empty">Đang cập nhật.</p>
            ) : (
              <ul className="filter-list">
                {vendorOptions.map((vendor) => (
                  <li key={vendor}>
                    <label className="filter-checkbox">
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
                      <span>{vendor}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="filter_group filter_group_block">
          <div className="filter_group-subtitle">
            <span>Khoảng giá</span>
          </div>
          <div className="filter_group-content">
            <div className="filter-price">
              <input
                className="field"
                value={priceMinInput}
                inputMode="numeric"
                onChange={(event) => setPriceMinInput(event.target.value.replace(/[^\d]/g, ""))}
                placeholder="Giá từ"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyPriceFilter();
                  }
                }}
              />
              <input
                className="field"
                value={priceMaxInput}
                inputMode="numeric"
                onChange={(event) => setPriceMaxInput(event.target.value.replace(/[^\d]/g, ""))}
                placeholder="Giá đến"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyPriceFilter();
                  }
                }}
              />
              <button
                className="btn-filter btn-filter-apply"
                type="button"
                onClick={applyPriceFilter}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>

      </div>
      <div className="filter-footer">
        <button type="button" className="btn-filter btn-filter-clear btn-filter-reset" onClick={clearFilters}>
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );

  const currentSortLabel =
    sortOptions.find((option) => option.value === sort)?.label || "Mới nhất";

  return (
    <div className="container">
      <div className="section-collection">
        <div className="row">
          <div className="col-lg-3 col-md-12 col-12 sidebar sidebar-left">
            <div className="filter-wrapper">
              {hasActiveFilters ? (
                <div className="filter-current">
                  <div className="widget-title">
                    <div className="filter-subtitle">Bạn đang xem</div>
                  </div>
                  <div className="list-tags">
                    {activeTags.map((tag) => (
                      <div key={tag.key} className="filter_tags">
                        {tag.label}: <b>{tag.value}</b>
                        <button
                          type="button"
                          className="filter_tags_remove"
                          onClick={tag.onRemove}
                          aria-label={`Xóa ${tag.label}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 50 50"
                          >
                            <path
                              fill="#333"
                              d="M9.016 40.837a1.001 1.001 0 0 0 1.415-.001l14.292-14.309 14.292 14.309a1 1 0 1 0 1.416-1.413L26.153 25.129 40.43 10.836a1 1 0 1 0-1.415-1.413L24.722 23.732 10.43 9.423a1 1 0 1 0-1.415 1.413l14.276 14.293L9.015 39.423a1 1 0 0 0 .001 1.414z"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="filter_tags filter_tags_remove_all"
                      onClick={clearFilters}
                    >
                      <span>Xóa hết</span>
                    </button>
                  </div>
                </div>
              ) : null}
              <div className={`filter-content ${hasActiveFilters ? "with-current" : "without-current"}`}>
                {FilterPanel}
              </div>
            </div>
          </div>

          <div className="col-lg-9 col-md-12 col-12 collection main-container">
            <div className="toolbar-products">
              <div className="head-title">
                <h1 className="title">Tất cả sản phẩm</h1>
                <div className="product-count">
                  <div className="count">
                    <b>{filtered.length}</b> sản phẩm
                  </div>
                </div>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <button type="button" className="product-filter-mb">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 459 459">
                      <path d="M178.5 382.5h102v-51h-102v51zM0 76.5v51h459v-51H0zm76.5 178.5h306v-51h-306v51z" />
                    </svg>
                    <span>Bộ lọc</span>
                  </button>
                </SheetTrigger>
                <SheetContent className="filter-sheet">
                  <SheetHeader>
                    <SheetTitle>Bộ lọc</SheetTitle>
                  </SheetHeader>
                  <div className="filter-content">{FilterPanel}</div>
                </SheetContent>
              </Sheet>
              <div className="product-sort" ref={sortRef}>
                <button
                  className="title"
                  type="button"
                  onClick={() => setSortOpen((prev) => !prev)}
                  aria-expanded={sortOpen}
                >
                  <span>Sắp xếp theo</span>
                  <span className="text">{currentSortLabel}</span>
                  <span className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 128 128">
                      <path d="m64 88c-1.023 0-2.047-.391-2.828-1.172l-40-40c-1.563-1.563-1.563-4.094 0-5.656s4.094-1.563 5.656 0l37.172 37.172 37.172-37.172c1.563-1.563 4.094-1.563 5.656 0s1.563 4.094 0 5.656l-40 40c-.781.781-1.805 1.172-2.828 1.172z"></path>
                    </svg>
                  </span>
                </button>
                <ul className={`sort-by sort-by-content ${sortOpen ? "open" : ""}`}>
                  {sortOptions.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setSort(option.value);
                          setPage(1);
                          setSortOpen(false);
                          updateRoute({ sort: option.value });
                        }}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ProductGrid products={pageItems} />

            <div className="pagination-wrapper">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(value) => setPage(value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
