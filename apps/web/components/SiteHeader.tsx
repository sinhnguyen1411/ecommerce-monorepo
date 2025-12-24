"use client";

import Link from "next/link";

import { useCart } from "./cart/CartContext";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Harvest & Hearth";

export default function SiteHeader() {
  const { itemCount, open } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-moss/10 bg-sand/80 backdrop-blur">
      <div className="section-shell flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-ember" />
          <span className="text-lg font-semibold tracking-tight">
            {siteName}
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink/70 md:flex">
          <Link href="/products" className="transition hover:text-ink">
            Products
          </Link>
          <Link href="/blog" className="transition hover:text-ink">
            Journal
          </Link>
          <Link href="/#about" className="transition hover:text-ink">
            Our story
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button className="btn-ghost hidden md:inline-flex">Subscribe</button>
          <button
            onClick={open}
            className="btn-primary relative"
            aria-label="Open cart"
          >
            Cart
            <span className="rounded-full bg-cream/20 px-2 text-xs font-semibold">
              {itemCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

