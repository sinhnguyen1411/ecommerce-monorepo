"use client";

import Link from "next/link";
import { Mail, Menu, Phone } from "lucide-react";

import BrandSignature from "@/components/brand/BrandSignature";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { href: "/pages/about-us", label: "Giới thiệu" },
  { href: "/collections/all", label: "Sản phẩm" },
  { href: "/blogs/news", label: "Kiến thức nhà nông" },
  { href: "/pages/hoi-dap-cung-nha-nong", label: "Hỏi đáp cùng nhà nông" },
  { href: "/pages/lien-he", label: "Liên hệ" },
  { href: "/cart", label: "Giỏ hàng" }
];

export default function MobileMenu() {
  const phoneDigits = siteConfig.phone.replace(/[^0-9]/g, "");

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button className="header-action-btn" aria-label="Menu" data-testid="mobile-menu-trigger">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent className="max-w-xs" data-testid="mobile-menu-sheet">
          <SheetHeader>
            <SheetTitle>Danh mục</SheetTitle>
          </SheetHeader>
          <div className="mobile-menu-brand" data-testid="mobile-menu-brand">
            <Link href="/" className="mobile-menu-brand__home" aria-label={siteConfig.name}>
              <BrandSignature mode="mobile" priority logoSizes="40px" className="w-full" />
            </Link>
          </div>
          <nav className="mt-6 flex flex-col gap-3 text-sm font-semibold text-ink/80">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 border border-forest/10 bg-white p-4 text-xs text-ink/70">
            <p className="text-sm font-semibold text-ink">Thông tin liên hệ</p>
            <div className="mt-3 space-y-2">
              <a className="flex items-center gap-2" href={`tel:${phoneDigits}`}>
                <Phone className="h-4 w-4 text-forest" />
                {siteConfig.phone}
              </a>
              <a className="flex items-center gap-2" href={`mailto:${siteConfig.email}`}>
                <Mail className="h-4 w-4 text-forest" />
                {siteConfig.email}
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
