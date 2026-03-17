"use client";

import { FocusEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  LogOut,
  Menu,
  Pin,
  RotateCcw,
  Save,
  Search
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AdminDensityMode, AdminProfile } from "@/lib/admin";

export type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type AdminNavSortState = {
  enabled: boolean;
  dirty: boolean;
  saving: boolean;
  onToggle: () => void;
  onSave: () => void;
  onReset: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onReorder: (fromId: string, toId: string) => void;
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
  navSort: AdminNavSortState;
  density: AdminDensityMode;
  onDensityChange: (mode: AdminDensityMode) => void;
  preferencesSaving?: boolean;
  children: React.ReactNode;
};

const reorderableNavIds = (navItems: AdminNavItem[]) =>
  navItems.filter((item) => item.id !== "overview").map((item) => item.id);

const NavSortActions = ({
  navSort,
  variant = "desktop"
}: {
  navSort: AdminNavSortState;
  variant?: "desktop" | "mobile";
}) => {
  const compact = variant === "mobile";

  if (!navSort.enabled) {
    return (
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "sm"}
        onClick={navSort.onToggle}
        data-testid="admin-nav-sort-toggle"
        className="normal-case border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
      >
        <GripVertical className="h-4 w-4" />
        Sắp xếp menu
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "sm"}
        onClick={navSort.onReset}
        disabled={!navSort.dirty || navSort.saving}
        data-testid="admin-nav-sort-reset"
        className="normal-case border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
      >
        <RotateCcw className="h-4 w-4" />
        Khôi phục
      </Button>
      <Button
        type="button"
        size={compact ? "sm" : "sm"}
        onClick={navSort.onSave}
        disabled={!navSort.dirty || navSort.saving}
        data-testid="admin-nav-sort-save"
        className="bg-[var(--color-primary)] text-white hover:brightness-110 normal-case cursor-pointer"
      >
        <Save className="h-4 w-4" />
        {navSort.saving ? "Đang lưu..." : "Lưu thứ tự"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "sm" : "sm"}
        onClick={navSort.onToggle}
        className="normal-case text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        Thoát sắp xếp
      </Button>
    </div>
  );
};

const NavList = ({
  navItems,
  activeSection,
  onNavigate,
  navMeta,
  navSort,
  collapsed = false
}: {
  navItems: AdminNavItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  navMeta?: Record<string, number>;
  navSort: AdminNavSortState;
  collapsed?: boolean;
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const reorderables = reorderableNavIds(navItems);

  const clearDragState = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  if (!navSort.enabled) {
    return (
      <div className="space-y-1" data-testid={collapsed ? "admin-nav-rail" : "admin-nav-full"}>
        {navItems.map((item) => {
          const isActive = item.id === activeSection;
          const Icon = item.icon;
          const badge = navMeta?.[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              data-testid={`admin-nav-${item.id}`}
              title={collapsed ? item.label : undefined}
              className={`relative flex min-h-[44px] w-full items-center rounded-lg py-2.5 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 cursor-pointer md:text-sm ${
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              } ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
              {badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-base font-semibold md:text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  } ${collapsed ? "absolute right-1 top-1 text-[10px] leading-none" : "ml-auto"}`}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const badge = navMeta?.[item.id];

        if (item.id === "overview") {
          return (
            <div
              key={item.id}
              className="flex min-h-[44px] items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
              data-testid={`admin-nav-sort-item-${item.id}`}
            >
              <div className="flex items-center gap-3">
                <Pin className="h-4 w-4 text-slate-400" />
                <Icon className="h-4 w-4" />
                <span className="text-base font-semibold md:text-sm">{item.label}</span>
              </div>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                Cố định
              </span>
            </div>
          );
        }

        const orderIndex = reorderables.indexOf(item.id);
        const canMoveUp = orderIndex > 0;
        const canMoveDown = orderIndex >= 0 && orderIndex < reorderables.length - 1;

        return (
          <div
            key={item.id}
            className={`flex min-h-[44px] items-center justify-between rounded-lg border bg-white px-3 py-2 transition ${
              dragOverId === item.id ? "border-[var(--color-primary)]" : "border-slate-200"
            } ${draggingId === item.id ? "opacity-70" : ""}`}
            onDragOver={(event) => {
              if (!draggingId || draggingId === item.id) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dragOverId !== item.id) {
                setDragOverId(item.id);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const fromId = draggingId || event.dataTransfer.getData("text/plain");
              if (fromId && fromId !== item.id) {
                navSort.onReorder(fromId, item.id);
              }
              clearDragState();
            }}
            onDragLeave={() => {
              if (dragOverId === item.id) {
                setDragOverId(null);
              }
            }}
            data-testid={`admin-nav-sort-item-${item.id}`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  setDraggingId(item.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }}
                onDragEnd={clearDragState}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-grab active:cursor-grabbing"
                aria-label={`Kéo thả mục ${item.label}`}
                data-testid={`admin-nav-sort-drag-${item.id}`}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <Icon className="h-4 w-4 text-slate-500" />
              <span className="text-base font-semibold text-slate-800 md:text-sm">{item.label}</span>
              {badge ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {badge}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navSort.onMove(item.id, -1)}
                disabled={!canMoveUp}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label={`Đưa mục ${item.label} lên`}
                data-testid={`admin-nav-sort-move-up-${item.id}`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navSort.onMove(item.id, 1)}
                disabled={!canMoveDown}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label={`Đưa mục ${item.label} xuống`}
                data-testid={`admin-nav-sort-move-down-${item.id}`}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-slate-500">Kéo thả hoặc dùng nút lên/xuống để thay đổi thứ tự menu.</p>
    </div>
  );
};

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
  navSort,
  density,
  onDensityChange,
  preferencesSaving = false,
  children
}: AdminShellProps) {
  const profileName = useMemo(() => {
    if (!profile?.name?.trim()) return "Quản trị viên";
    return profile.name;
  }, [profile]);

  const profileRole = profile?.role ? profile.role.toUpperCase() : "ADMIN";
  const [isRailHoverExpanded, setIsRailHoverExpanded] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openDelayMs = 120;
  const closeDelayMs = 160;
  const showFullSidebar = navSort.enabled || isRailHoverExpanded;
  const compactSidebar = !showFullSidebar;

  const clearOpenTimer = () => {
    if (!openTimerRef.current) {
      return;
    }
    clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  };

  const clearCloseTimer = () => {
    if (!closeTimerRef.current) {
      return;
    }
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const closeHoverSidebarImmediately = () => {
    clearOpenTimer();
    clearCloseTimer();
    setIsRailHoverExpanded(false);
  };

  const scheduleOpenHoverSidebar = () => {
    if (navSort.enabled) {
      return;
    }
    clearCloseTimer();
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      setIsRailHoverExpanded(true);
      openTimerRef.current = null;
    }, openDelayMs);
  };

  const scheduleCloseHoverSidebar = () => {
    if (navSort.enabled) {
      return;
    }
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsRailHoverExpanded(false);
      closeTimerRef.current = null;
    }, closeDelayMs);
  };

  const handleAsideBlurCapture = (event: FocusEvent<HTMLElement>) => {
    if (navSort.enabled) {
      return;
    }
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }
    scheduleCloseHoverSidebar();
  };

  const handleAsideFocusCapture = (event: FocusEvent<HTMLElement>) => {
    if (navSort.enabled) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && typeof target.matches === "function" && !target.matches(":focus-visible")) {
      return;
    }
    clearCloseTimer();
    clearOpenTimer();
    setIsRailHoverExpanded(true);
  };

  const handleNavigate = (id: string, context: "desktop" | "mobile") => {
    onNavigate(id);
    if (context === "mobile") {
      setIsMobileSheetOpen(false);
    }
  };

  useEffect(() => {
    if (navSort.enabled) {
      clearOpenTimer();
      clearCloseTimer();
      setIsRailHoverExpanded(false);
    }
  }, [navSort.enabled]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const toggleDensity = () => {
    onDensityChange(density === "compact" ? "comfortable" : "compact");
  };

  return (
    <div className="relative flex min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {isRailHoverExpanded && !navSort.enabled ? (
        <button
          type="button"
          className="fixed inset-0 z-20 hidden bg-slate-900/25 backdrop-blur-[1px] lg:block"
          aria-label="Thu gọn bảng điều hướng"
          data-testid="admin-sidebar-overlay"
          onClick={closeHoverSidebarImmediately}
        />
      ) : null}

      <aside
        className={`relative z-30 hidden flex-col border-r border-slate-200 bg-white/95 py-6 transition-[width,padding] duration-200 lg:flex ${
          compactSidebar ? "w-24 px-3" : "w-72 px-4"
        }`}
        onMouseEnter={scheduleOpenHoverSidebar}
        onMouseLeave={scheduleCloseHoverSidebar}
        onFocusCapture={handleAsideFocusCapture}
        onBlurCapture={handleAsideBlurCapture}
      >
        <div className={`mb-4 ${compactSidebar ? "text-center" : ""}`}>
          <h1
            className={`font-semibold uppercase tracking-[0.16em] text-slate-900 ${
              compactSidebar ? "text-sm" : "text-base"
            }`}
          >
            ADMIN
          </h1>
        </div>

        <div className="mt-4">
          <NavList
            navItems={navItems}
            activeSection={activeSection}
            onNavigate={(id) => handleNavigate(id, "desktop")}
            navMeta={navMeta}
            navSort={navSort}
            collapsed={compactSidebar}
          />
        </div>

        {compactSidebar ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={navSort.onToggle}
              data-testid="admin-nav-sort-toggle"
              className="w-full normal-case border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              title="Mở chế độ sắp xếp menu"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <NavSortActions navSort={navSort} />
          </div>
        )}

        <div
          className={`mt-auto rounded-xl border border-slate-200 bg-white ${compactSidebar ? "px-2 py-3 text-center" : "p-4"}`}
          title={compactSidebar ? `${profileName} (${profileRole})` : undefined}
        >
          <p className={`font-semibold text-slate-900 ${compactSidebar ? "text-xs" : "text-base md:text-sm"}`}>
            {compactSidebar ? profileName.charAt(0).toUpperCase() : profileName}
          </p>
          <p
            className={`mt-1 font-semibold text-[var(--color-primary)] ${compactSidebar ? "text-[10px]" : "text-base md:text-xs"}`}
          >
            {profileRole}
          </p>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
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
                  <SheetTitle className="text-base font-semibold text-slate-900">Điều hướng</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <NavList
                    navItems={navItems}
                    activeSection={activeSection}
                    onNavigate={(id) => handleNavigate(id, "mobile")}
                    navMeta={navMeta}
                    navSort={navSort}
                  />
                </div>
                <div className="mt-4">
                  <NavSortActions navSort={navSort} variant="mobile" />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-[220px]">
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-xs">
                NÔNG DƯỢC TAM BỐ
              </p>
              <h2 className="text-lg font-semibold text-slate-900">{title || "Tổng quan"}</h2>
            </div>

            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 md:text-sm"
                placeholder="Tìm nhanh sản phẩm, đơn hàng, bài viết..."
                aria-label="Tìm kiếm nhanh"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDensity}
                disabled={preferencesSaving}
                data-testid="admin-density-toggle"
                className="normal-case border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-base md:text-sm cursor-pointer"
              >
                {density === "compact" ? "Mật độ: Gọn" : "Mật độ: Thoáng"}
              </Button>
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

        <main className={`flex-1 ${density === "compact" ? "p-4 lg:p-5" : "p-4 lg:p-6"}`}>{children}</main>
      </div>
    </div>
  );
}
