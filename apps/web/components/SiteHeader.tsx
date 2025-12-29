"use client";

import Link from "next/link";

import { siteConfig } from "@/lib/site";

import { useCart } from "./cart/CartContext";

export default function SiteHeader() {
  const { itemCount, open } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/80 backdrop-blur">
      <div className="section-shell flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-clay" />
          <span className="text-lg font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink/70 lg:flex">
          <Link href="/products" className="transition hover:text-ink">
            San pham
          </Link>
          <Link href="/blog" className="transition hover:text-ink">
            Tin tuc
          </Link>
          <Link href="/pages/about-us" className="transition hover:text-ink">
            Gioi thieu
          </Link>
          <Link href="/pages/hoi-dap-cung-nha-nong" className="transition hover:text-ink">
            Hoi dap
          </Link>
          <Link href="/pages/locations" className="transition hover:text-ink">
            Cua hang
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-forest/80 md:inline">
            Hotline: {siteConfig.phone}
          </span>
          <button
            onClick={open}
            className="btn-primary relative"
            aria-label="Open cart"
          >
            Gio hang
            <span className="rounded-full bg-cream/20 px-2 text-xs font-semibold">
              {itemCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
