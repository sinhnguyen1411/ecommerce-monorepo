"use client";

import { useMemo } from "react";
import { LogOut, Menu, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AdminProfile } from "@/lib/admin";

export type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type AdminShellProps = {
  navItems: AdminNavItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  title?: string;
  navMeta?: Record<string, number>;
  profile?: AdminProfile | null;
  onLogout?: () => void;
  loggingOut?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
};

const NavList = ({
  navItems,
  activeSection,
  onNavigate,
  navMeta
}: {
  navItems: AdminNavItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  navMeta?: Record<string, number>;
}) => (
  <div className="space-y-1">
    {navItems.map((item) => {
      const isActive = item.id === activeSection;
      const Icon = item.icon;
      const badge = navMeta?.[item.id];
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 cursor-pointer md:text-sm ${
            isActive
              ? "bg-[var(--color-primary)] text-white"
              : "text-slate-600 hover:bg-white hover:text-slate-900"
          }`}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
          {badge ? (
            <span className={`ml-auto rounded-full px-2 py-0.5 text-base font-semibold md:text-xs ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {badge}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);

export default function AdminShell({
  navItems,
  activeSection,
  onNavigate,
  title,
  navMeta,
  profile,
  onLogout,
  loggingOut,
  onRefresh,
  children
}: AdminShellProps) {
  const profileName = useMemo(() => {
    if (!profile?.name) return "Quản trị viên";
    return profile.name;
  }, [profile]);

  const profileRole = profile?.role ? profile.role.toUpperCase() : "ADMIN";

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/80 px-4 py-6 lg:flex">
        <div className="mb-6">
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-xs">
            Bảng điều khiển
          </p>
          <h1 className="mt-2 text-lg font-semibold text-slate-900">Admin Tam Bố</h1>
        </div>
        <NavList
          navItems={navItems}
          activeSection={activeSection}
          onNavigate={onNavigate}
          navMeta={navMeta}
        />
        <div className="mt-auto rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-base font-semibold text-slate-900 md:text-sm">{profileName}</p>
          <p className="mt-1 text-base font-semibold text-[var(--color-primary)] md:text-xs">
            {profileRole}
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 lg:hidden cursor-pointer"
                  aria-label="Mở menu admin"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent className="max-w-xs border-slate-200 bg-white p-5">
                <SheetHeader>
                  <SheetTitle className="text-base font-semibold text-slate-900">
                    Điều hướng
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <NavList
                    navItems={navItems}
                    activeSection={activeSection}
                    onNavigate={onNavigate}
                    navMeta={navMeta}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-[180px]">
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-xs">
                Khu vực quản trị
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                {title || "Tổng quan"}
              </h2>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm"
                placeholder="Tìm nhanh sản phẩm, đơn hàng, bài viết..."
                aria-label="Tìm kiếm nhanh"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onRefresh ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="normal-case border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
                >
                  Làm mới dữ liệu
                </Button>
              ) : null}
              {onLogout ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  disabled={loggingOut}
                  className="normal-case text-slate-600 hover:text-slate-900 text-base md:text-sm cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Đang đăng xuất" : "Đăng xuất"}
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
