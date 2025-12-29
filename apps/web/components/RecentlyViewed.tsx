"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Product } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

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
      <div className="card-surface p-6 text-sm text-ink/70">
        San pham vua xem se hien thi tai day.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {content.map((item) => (
        <Link
          key={item.id}
          href={`/products/${item.slug}`}
          className="card-surface group overflow-hidden p-4"
        >
          <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-mist">
            {item.images?.[0]?.url ? (
              <img
                src={item.images[0].url}
                alt={item.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-ink/50">
                Chua co anh
              </div>
            )}
          </div>
          <h3 className="mt-3 text-sm font-semibold">{item.name}</h3>
          <p className="mt-1 text-xs text-ink/60">
            {formatCurrency(item.price)}
          </p>
        </Link>
      ))}
    </div>
  );
}
