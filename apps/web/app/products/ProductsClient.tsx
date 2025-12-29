"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ProductCard from "@/components/ProductCard";
import { Category, Product } from "@/lib/api";

const sortOptions = [
  { value: "latest", label: "Moi nhat" },
  { value: "price_asc", label: "Gia tang" },
  { value: "price_desc", label: "Gia giam" }
];

type ProductsClientProps = {
  categories: Category[];
  products: Product[];
  initialCategory?: string;
  initialSort?: string;
};

export default function ProductsClient({
  categories,
  products,
  initialCategory,
  initialSort
}: ProductsClientProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");
  const [sort, setSort] = useState(initialSort || "latest");

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== "all") {
      list = list.filter((product) =>
        product.categories?.some((category) => category.slug === activeCategory)
      );
    }

    if (sort === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    }
    if (sort === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, activeCategory, sort]);

  const updateRoute = (nextCategory: string, nextSort: string) => {
    const params = new URLSearchParams();
    if (nextCategory && nextCategory !== "all") {
      params.set("category", nextCategory);
    }
    if (nextSort && nextSort !== "latest") {
      params.set("sort", nextSort);
    }
    const query = params.toString();
    router.replace(query ? `/products?${query}` : "/products");
  };

  return (
    <div className="section-shell pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-5 text-sm shadow-lg">
        <div className="flex flex-wrap gap-2">
          <button
            className={
              activeCategory === "all"
                ? "chip bg-forest text-cream"
                : "chip"
            }
            onClick={() => {
              setActiveCategory("all");
              updateRoute("all", sort);
            }}
          >
            Tat ca
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={
                activeCategory === category.slug
                  ? "chip bg-forest text-cream"
                  : "chip"
              }
              onClick={() => {
                setActiveCategory(category.slug);
                updateRoute(category.slug, sort);
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
            Sap xep
          </span>
          <select
            className="field w-44"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              updateRoute(activeCategory, event.target.value);
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

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="card-surface col-span-full p-10 text-center text-sm text-ink/70">
            Khong tim thay san pham phu hop.
          </div>
        ) : (
          filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}
