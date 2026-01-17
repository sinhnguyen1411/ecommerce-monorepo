"use client";

import { useEffect, useMemo, useState } from "react";

import { Product } from "@/lib/api";
import ProductGrid from "@/components/product/ProductGrid";

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

  const content = useMemo(() => items.slice(0, 5), [items]);

  if (content.length === 0) {
    return (
      <div className="border border-forest/10 bg-white p-6 text-sm text-ink/70">
        Sản phẩm vừa xem sẽ hiển thị tại đây.
      </div>
    );
  }

  return <ProductGrid products={content} />;
}
