"use client";

import { LogOut, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminTopbarProps = {
  title?: string;
  loggingOut?: boolean;
  onLogout?: () => void;
  mobileNavigation?: React.ReactNode;
};

export default function AdminTopbar({
  title,
  loggingOut,
  onLogout,
  mobileNavigation
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-[72px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        {mobileNavigation}

        <div className="min-w-[200px]">
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-xs">
            NÔNG DƯỢC TAM BỐ
          </p>
          <h2 className="text-lg font-semibold text-slate-900">{title || "Tổng quan"}</h2>
        </div>

        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm"
            placeholder="Tìm nhanh sản phẩm, đơn hàng, bài viết..."
            aria-label="Tìm kiếm nhanh"
          />
        </div>

        {onLogout ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            disabled={loggingOut}
            className="cursor-pointer text-base text-slate-600 hover:text-slate-900 md:text-sm"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Đang đăng xuất" : "Đăng xuất"}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
