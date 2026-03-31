"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ShoppingBag, User } from "lucide-react";

import BrandSignature from "@/components/brand/BrandSignature";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { clearAuthTokens } from "@/lib/auth";
import { getProfile } from "@/lib/account";
import { isAuthOnlyPath } from "@/lib/auth-route";
import { siteConfig } from "@/lib/site";
import { logout } from "@/lib/user-auth";
import { getCartCount, useCartStore } from "@/store/cart";

import LocationDropdown from "./LocationDropdown";
import MobileMenu from "./MobileMenu";
import SearchDialog from "./SearchDialog";

const navLinks = [
  { href: "/pages/about-us", label: "Giới thiệu" },
  { href: "/collections/all", label: "Sản phẩm" },
  { href: "/blogs/news", label: "Kiến thức nhà nông" },
  { href: "/pages/hoi-dap-cung-nha-nong", label: "Hỏi đáp cùng nhà nông" },
  { href: "/pages/lien-he", label: "Liên hệ" }
];

export default function Header() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const open = useCartStore((state) => state.open);
  const count = getCartCount(items);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile()
      .then(() => {
        if (active) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (active) {
          setIsAuthenticated(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      void err;
    } finally {
      clearAuthTokens();
      window.location.reload();
    }
  };

  if (isAuthOnlyPath(pathname)) {
    return null;
  }

  const homeBrand = (
    <Link href="/" className="header-brand" data-testid="site-header-brand" aria-label={siteConfig.name}>
      <BrandSignature
        mode="header"
        priority
        logoSizes="(max-width: 640px) 44px, 52px"
        className="header-brand__signature"
      />
    </Link>
  );

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
                  {pathname === "/" ? <h1>{homeBrand}</h1> : homeBrand}
                </div>
              </div>

              <div className="header-wrap-menu hidden lg:flex">
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
                    {isAuthenticated ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/account">Tài khoản của tôi</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleLogout}>Đăng xuất</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/forgot-password">Quên mật khẩu</Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/login">Đăng nhập</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/signup">Tạo tài khoản</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button onClick={open} className="header-action-btn relative" aria-label="Giỏ hàng">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="badge-count">{count}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
