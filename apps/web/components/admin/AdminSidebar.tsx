"use client";

import { FocusEvent, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Pin,
  RotateCcw,
  Save
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavSortState = {
  enabled: boolean;
  dirty: boolean;
  saving: boolean;
  onToggle: () => void;
  onSave: () => void;
  onReset: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onReorder: (fromId: string, toId: string) => void;
};

type NavSortActionsProps = {
  navSort: AdminNavSortState;
  variant?: "desktop" | "mobile";
};

type NavListProps = {
  navItems: AdminNavItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  navMeta?: Record<string, number>;
  navSort: AdminNavSortState;
  collapsed?: boolean;
};

type AdminSidebarProps = {
  navItems: AdminNavItem[];
  activeSection: string;
  onNavigate: (id: string) => void;
  navMeta?: Record<string, number>;
  navSort: AdminNavSortState;
  compact?: boolean;
  profileName: string;
  profileRole: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocusCapture?: (event: FocusEvent<HTMLElement>) => void;
  onBlurCapture?: (event: FocusEvent<HTMLElement>) => void;
};

const reorderableNavIds = (navItems: AdminNavItem[]) =>
  navItems.filter((item) => item.id !== "overview").map((item) => item.id);

export const NavSortActions = ({
  navSort,
  variant = "desktop"
}: NavSortActionsProps) => {
  const compact = variant === "mobile";

  if (!navSort.enabled) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={navSort.onToggle}
        data-testid="admin-nav-sort-toggle"
        className="cursor-pointer border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
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
        size="sm"
        onClick={navSort.onReset}
        disabled={!navSort.dirty || navSort.saving}
        data-testid="admin-nav-sort-reset"
        className="cursor-pointer border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <RotateCcw className="h-4 w-4" />
        Khôi phục
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={navSort.onSave}
        disabled={!navSort.dirty || navSort.saving}
        data-testid="admin-nav-sort-save"
        className="cursor-pointer bg-[var(--color-primary)] text-white hover:brightness-110"
      >
        <Save className="h-4 w-4" />
        {navSort.saving ? "Đang lưu..." : "Lưu thứ tự"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "sm" : "sm"}
        onClick={navSort.onToggle}
        className="cursor-pointer text-slate-600 hover:text-slate-900"
      >
        Thoát sắp xếp
      </Button>
    </div>
  );
};

export const NavList = ({
  navItems,
  activeSection,
  onNavigate,
  navMeta,
  navSort,
  collapsed = false
}: NavListProps) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const reorderables = reorderableNavIds(navItems);

  const clearDragState = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const commitPointerReorder = (toId: string) => {
    if (!draggingId || draggingId === toId) {
      clearDragState();
      return;
    }
    navSort.onReorder(draggingId, toId);
    clearDragState();
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
              className={`relative flex min-h-[44px] w-full items-center rounded-xl py-2.5 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 md:text-sm ${
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center px-2" : "gap-3 px-3.5"} cursor-pointer`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate whitespace-nowrap"}>
                {item.label}
              </span>
              {badge && !collapsed ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-base font-semibold md:text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  } ml-auto`}
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
              className="flex min-h-[44px] items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
              data-testid={`admin-nav-sort-item-${item.id}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Pin className="h-4 w-4 text-slate-400" />
                <Icon className="h-4 w-4" />
                <span className="truncate whitespace-nowrap text-base font-semibold md:text-sm">
                  {item.label}
                </span>
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
            className={`scroll-mb-24 flex min-h-[44px] items-center justify-between rounded-xl border bg-white px-3 py-2 transition ${
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
            onPointerEnter={() => {
              if (!draggingId || draggingId === item.id) {
                return;
              }
              if (dragOverId !== item.id) {
                setDragOverId(item.id);
              }
            }}
            onPointerUp={() => commitPointerReorder(item.id)}
            data-testid={`admin-nav-sort-item-${item.id}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                draggable
                onPointerDown={() => {
                  setDraggingId(item.id);
                  setDragOverId(null);
                }}
                onDragStart={(event) => {
                  setDraggingId(item.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }}
                onDragEnd={clearDragState}
                className="scroll-mb-24 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-grab active:cursor-grabbing"
                aria-label={`Kéo thả mục ${item.label}`}
                data-testid={`admin-nav-sort-drag-${item.id}`}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <Icon className="h-4 w-4 text-slate-500" />
              <span className="truncate whitespace-nowrap text-base font-semibold text-slate-800 md:text-sm">
                {item.label}
              </span>
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label={`Đưa mục ${item.label} lên`}
                data-testid={`admin-nav-sort-move-up-${item.id}`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navSort.onMove(item.id, 1)}
                disabled={!canMoveDown}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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

export default function AdminSidebar({
  navItems,
  activeSection,
  onNavigate,
  navMeta,
  navSort,
  compact = false,
  profileName,
  profileRole,
  onMouseEnter,
  onMouseLeave,
  onFocusCapture,
  onBlurCapture
}: AdminSidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white lg:flex lg:flex-col ${
        compact ? "w-20 px-2.5 py-5" : "w-72 px-4 py-6"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
    >
      <div className={`border-b border-slate-100 pb-4 ${compact ? "text-center" : ""}`}>
        <h1
          className={`font-semibold uppercase tracking-[0.16em] text-slate-900 ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          ADMIN
        </h1>
      </div>

      <div
        className={`mt-5 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 ${
          compact ? "pb-4" : "pb-24"
        }`}
      >
        <NavList
          navItems={navItems}
          activeSection={activeSection}
          onNavigate={onNavigate}
          navMeta={navMeta}
          navSort={navSort}
          collapsed={compact}
        />
      </div>

      {compact ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={navSort.onToggle}
            data-testid="admin-nav-sort-toggle"
            className="w-full cursor-pointer border-slate-200 text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            title="Mở chế độ sắp xếp menu"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <NavSortActions navSort={navSort} />
        </div>
      )}

      <div
        className={`mt-4 rounded-2xl border border-slate-200 bg-slate-50 ${
          compact ? "px-2 py-3 text-center" : "p-4"
        }`}
        title={compact ? `${profileName} (${profileRole})` : undefined}
      >
        <p className={`font-semibold text-slate-900 ${compact ? "text-xs" : "text-base md:text-sm"}`}>
          {compact ? profileName.charAt(0).toUpperCase() : profileName}
        </p>
        <p
          className={`mt-1 font-semibold text-[var(--color-primary)] ${
            compact ? "text-xs" : "text-base md:text-xs"
          }`}
        >
          {profileRole}
        </p>
      </div>
    </aside>
  );
}
