"use client";

import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/lib/site";
import { getCartCount, useCartStore } from "@/store/cart";

import LocationDropdown from "./LocationDropdown";
import MobileMenu from "./MobileMenu";
import SearchDialog from "./SearchDialog";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/pages/about-us", label: "Giới thiệu" },
  { href: "/collections/all", label: "Sản phẩm" },
  { href: "/blogs/news", label: "Kiến thức nông nghiệp" },
  { href: "/pages/hoi-dap-cung-nha-nong", label: "Hỏi đáp cùng nhà nông" },
  { href: "/pages/lien-he", label: "Liên hệ" }
];

export default function Header() {
  const items = useCartStore((state) => state.items);
  const open = useCartStore((state) => state.open);
  const count = getCartCount(items);

  return (
    <header className="mainHeader--height">
      <div className="mainHeader mainHeader_temp01" id="main-header">
        <div className="mainHeader-middle">
          <div className="container-fluid">
            <div className="flex-container-header">
              <div className="header-wrap-iconav header-wrap-actions">
                <div className="header-action">
                  <MobileMenu />
                </div>
              </div>
              <div className="header-wrap-logo">
                <div className="wrap-logo">
                  <h1>
                    <Link href="/">{siteConfig.name}</Link>
                  </h1>
                </div>
              </div>
              <div className="header-wrap-menu">
                <nav className="navbar-mainmenu">
                  <ul className="menuList-main">
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              <div className="header-actions">
                <LocationDropdown />
                <SearchDialog />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="header-action-btn" aria-label="Tài khoản">
                      <User className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <div className="px-2 py-2 text-xs text-ink/60">Tài khoản của bạn</div>
                    <DropdownMenuItem asChild>
                      <Link href="/login">Đăng nhập</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account">Tài khoản của tôi</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/login">Quên mật khẩu</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button onClick={open} className="header-action-cart">
                  <ShoppingBag className="h-4 w-4" />
                  Giỏ hàng
                  <span>({count})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
