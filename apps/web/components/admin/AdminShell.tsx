"use client";

import { FocusEvent, useEffect, useMemo, useRef, useState } from "react";
import { Menu } from "lucide-react";

import BrandSignature from "@/components/brand/BrandSignature";
import AdminContent from "@/components/admin/AdminContent";
import AdminSidebar, {
  AdminNavItem,
  AdminNavSortState,
  NavList,
  NavSortActions
} from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AdminDensityMode, AdminProfile } from "@/lib/admin";

type AdminShellProps = {
  navItems: AdminNavItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  title?: string;
  navMeta?: Record<string, number>;
  profile?: AdminProfile | null;
  onLogout?: () => void;
  loggingOut?: boolean;
  navSort: AdminNavSortState;
  density: AdminDensityMode;
  children: React.ReactNode;
};

const RAIL_PADDING_CLASS = "lg:pl-20";
const FULL_PADDING_CLASS = "lg:pl-72";

export type { AdminNavItem } from "@/components/admin/AdminSidebar";

export default function AdminShell({
  navItems,
  activeSection,
  onNavigate,
  title,
  navMeta,
  profile,
  onLogout,
  loggingOut,
  navSort,
  density,
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
  const desktopContentOffsetClass = showFullSidebar ? FULL_PADDING_CLASS : RAIL_PADDING_CLASS;

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

  const mobileNavigation = (
    <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 lg:hidden cursor-pointer"
          aria-label="Mở menu admin"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="max-w-xs border-slate-200 bg-white p-5">
        <SheetHeader className="space-y-3">
          <BrandSignature
            mode="admin"
            priority
            logoSizes="44px"
            data-testid="admin-mobile-sheet-brand"
          />
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
        <div className="mt-4 border-t border-slate-100 pt-4">
          <NavSortActions navSort={navSort} variant="mobile" />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="relative h-screen overflow-hidden bg-neutral-50 text-[var(--color-text)]">
      {isRailHoverExpanded && !navSort.enabled ? (
        <button
          type="button"
          className="fixed inset-0 z-30 hidden bg-slate-900/10 lg:block"
          aria-label="Thu gọn bảng điều hướng"
          data-testid="admin-sidebar-overlay"
          onClick={closeHoverSidebarImmediately}
        />
      ) : null}

      <AdminSidebar
        navItems={navItems}
        activeSection={activeSection}
        onNavigate={(id) => handleNavigate(id, "desktop")}
        navMeta={navMeta}
        navSort={navSort}
        compact={compactSidebar}
        profileName={profileName}
        profileRole={profileRole}
        onMouseEnter={scheduleOpenHoverSidebar}
        onMouseLeave={scheduleCloseHoverSidebar}
        onFocusCapture={handleAsideFocusCapture}
        onBlurCapture={handleAsideBlurCapture}
      />

      <div className={`relative flex h-full min-w-0 flex-col transition-[padding] duration-200 ${desktopContentOffsetClass}`}>
        <div className="flex h-full min-w-0 flex-col overflow-hidden">
          <AdminTopbar
            title={title}
            loggingOut={loggingOut}
            onLogout={onLogout}
            mobileNavigation={mobileNavigation}
          />
          <AdminContent density={density}>{children}</AdminContent>
        </div>
      </div>
    </div>
  );
}
