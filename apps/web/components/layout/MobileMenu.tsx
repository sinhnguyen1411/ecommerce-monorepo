"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function MobileMenu() {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button className="rounded-full border border-forest/20 p-2 text-forest">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent className="max-w-xs">
          <SheetHeader>
            <SheetTitle>Danh muc</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-4 text-sm font-semibold text-ink/70">
            <Link href="/products" className="hover:text-ink">San pham</Link>
            <Link href="/blog" className="hover:text-ink">Tin tuc</Link>
            <Link href="/pages/about-us" className="hover:text-ink">Gioi thieu</Link>
            <Link href="/pages/hoi-dap-cung-nha-nong" className="hover:text-ink">Hoi dap</Link>
            <Link href="/locations" className="hover:text-ink">Cua hang</Link>
            <Link href="/cart" className="hover:text-ink">Gio hang</Link>
            <Link href="/account" className="hover:text-ink">Tai khoan</Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
