"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ShoppingBag, User } from "lucide-react";

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
  { href: "/pages/about-us", label: "Gi\u1EDBi thi\u1EC7u" },
  { href: "/collections/all", label: "S\u1EA3n ph\u1EA9m" },
  { href: "/blogs/news", label: "Ki\u1EBFn th\u1EE9c nh\u00E0 n\u00F4ng" },
  { href: "/pages/hoi-dap-cung-nha-nong", label: "H\u1ECFi \u0111\u00E1p c\u00F9ng nh\u00E0 n\u00F4ng" },
  { href: "/pages/lien-he", label: "Li\u00EAn h\u1EC7" }
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
                    <button className="header-action-btn" aria-label="T\u00E0i kho\u1EA3n">
                      <User className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <div className="px-2 py-2 text-xs text-ink/60">
                      {"T\u00E0i kho\u1EA3n c\u1EE7a b\u1EA1n"}
                    </div>
                    {isAuthenticated ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/account">{"T\u00E0i kho\u1EA3n c\u1EE7a t\u00F4i"}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleLogout}>
                          {"\u0110\u0103ng xu\u1EA5t"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/forgot-password">{"Qu\u00EAn m\u1EADt kh\u1EA9u"}</Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/login">{"\u0110\u0103ng nh\u1EADp"}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/signup">{"T\u1EA1o t\u00E0i kho\u1EA3n"}</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  onClick={open}
                  className="header-action-btn relative"
                  aria-label="Gi\u1ECF h\u00E0ng"
                >
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
