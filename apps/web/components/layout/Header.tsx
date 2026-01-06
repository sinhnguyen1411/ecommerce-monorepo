"use client";

import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";

import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/site";
import { getCartCount, useCartStore } from "@/store/cart";

import MobileMenu from "./MobileMenu";

export default function Header() {
  const items = useCartStore((state) => state.items);
  const open = useCartStore((state) => state.open);
  const count = getCartCount(items);

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-white/90 backdrop-blur">
      <div className="section-shell flex items-center gap-6 py-4">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-clay" />
          <span className="text-lg">{siteConfig.name}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink/70 lg:flex">
          <Link href="/products" className="hover:text-ink">San pham</Link>
          <Link href="/blog" className="hover:text-ink">Tin tuc</Link>
          <Link href="/pages/about-us" className="hover:text-ink">Gioi thieu</Link>
          <Link href="/pages/hoi-dap-cung-nha-nong" className="hover:text-ink">Hoi dap</Link>
          <Link href="/locations" className="hover:text-ink">Cua hang</Link>
          <Link href="/account" className="hover:text-ink">Tai khoan</Link>
        </nav>
        <div className="ml-auto hidden w-full max-w-md items-center gap-2 rounded-full border border-forest/20 bg-white px-3 py-1 text-sm lg:flex">
          <Search className="h-4 w-4 text-ink/50" />
          <Input className="h-8 border-none p-0 text-sm shadow-none focus-visible:ring-0" placeholder="Tim san pham" />
        </div>
        <button
          onClick={open}
          className="relative ml-auto flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest transition hover:border-clay hover:text-clay lg:ml-0"
        >
          <ShoppingBag className="h-4 w-4" />
          Gio hang
          <span className="rounded-full bg-forest/10 px-2 text-xs font-semibold text-forest">
            {count}
          </span>
        </button>
        <MobileMenu />
      </div>
    </header>
  );
}
