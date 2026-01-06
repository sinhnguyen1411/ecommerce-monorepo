"use client";

import { useEffect, useMemo, useState } from "react";

import { Product } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";

const storageKey = "ttc_recent_products";

export default function RecentlyViewed({ current }: { current: Product }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(storageKey);
    let list: Product[] = [];

    if (raw) {
      try {
        list = JSON.parse(raw) as Product[];
      } catch {
        list = [];
      }
    }

    const filtered = list.filter((item) => item.id !== current.id);
    const updated = [current, ...filtered].slice(0, 6);
    window.localStorage.setItem(storageKey, JSON.stringify(updated));
    setItems(updated.filter((item) => item.id !== current.id));
  }, [current]);

  const content = useMemo(() => items.slice(0, 3), [items]);

  if (content.length === 0) {
    return (
      <div className="rounded-[28px] border border-forest/10 bg-white/80 p-6 text-sm text-ink/70">
        San pham vua xem se hien thi tai day.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {content.map((item) => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}
