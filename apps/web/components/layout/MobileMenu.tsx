"use client";

import Link from "next/link";
import { Mail, Menu, Phone } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Trang ch\u1EE7" },
  { href: "/pages/about-us", label: "Gi\u1EDBi thi\u1EC7u" },
  { href: "/collections/all", label: "S\u1EA3n ph\u1EA9m" },
  { href: "/blogs/news", label: "Ki\u1EBFn th\u1EE9c nh\u00E0 n\u00F4ng" },
  { href: "/pages/hoi-dap-cung-nha-nong", label: "H\u1ECFi \u0111\u00E1p c\u00F9ng nh\u00E0 n\u00F4ng" },
  { href: "/pages/lien-he", label: "Li\u00EAn h\u1EC7" },
  { href: "/cart", label: "Gi\u1ECF h\u00E0ng" }
];

export default function MobileMenu() {
  const phoneDigits = siteConfig.phone.replace(/[^0-9]/g, "");

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button className="header-action-btn" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent className="max-w-xs">
          <SheetHeader>
            <SheetTitle>{"Danh m\u1EE5c"}</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-3 text-sm font-semibold text-ink/80">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 border border-forest/10 bg-white p-4 text-xs text-ink/70">
            <p className="text-sm font-semibold text-ink">
              {"Th\u00F4ng tin li\u00EAn h\u1EC7"}
            </p>
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
