"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isAuthOnlyPath } from "@/lib/auth-route";
import { PROMO_POPUP_OPEN_EVENT, useContactSettings } from "@/lib/client-content";
import {
  ContactSettings,
  NotificationSettings,
  PromoPopupSettings,
  defaultContactSettings,
  defaultNotificationSettings,
  defaultPromoPopupSettings
} from "@/lib/content";

type TopbarProps = {
  promoSettings?: PromoPopupSettings;
  notificationSettings?: NotificationSettings;
  contactSettings?: ContactSettings;
};

export default function Topbar({
  promoSettings = defaultPromoPopupSettings,
  notificationSettings = defaultNotificationSettings,
  contactSettings
}: TopbarProps) {
  const pathname = usePathname();
  type TopbarNotification =
    | {
        id: string;
        title: string;
        description: string;
        type: "popup";
      }
    | {
        id: string;
        title: string;
        description: string;
        href: string;
        type: "link";
      };

  const liveSettings = useContactSettings();
  const settings = contactSettings || liveSettings || defaultContactSettings;
  if (isAuthOnlyPath(pathname)) {
    return null;
  }

  const phoneDigits = settings.phone.replace(/[^0-9]/g, "");
  const promoNotification: TopbarNotification | null = promoSettings.isActive
    ? {
        id: "promo-popup",
        title: promoSettings.title || "Ưu đãi hôm nay",
        description: promoSettings.subtitle || "Xem lại ưu đãi và mã giảm giá",
        type: "popup"
      }
    : null;
  const customNotifications: TopbarNotification[] = notificationSettings.items
    .filter((item) => item.isActive)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      type: "link"
    }));
  const notifications: TopbarNotification[] = promoNotification
    ? [promoNotification, ...customNotifications]
    : customNotifications;
  const notificationCount = notifications.length;

  const handleOpenPopup = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(PROMO_POPUP_OPEN_EVENT));
  };

  return (
    <div className="topbar" role="region" aria-label="Thanh thông tin">
      <div className="topbar-bottom">
        <div className="container-fluid">
          <div className="box-content">
            <div className="box-left">
              <div className="topbar-item hotline">
                <span className="topbar-label">Hotline</span>
                <a className="topbar-link topbar-phone" href={`tel:${phoneDigits}`}>
                  {settings.phone}
                </a>
              </div>
              <span className="topbar-divider" aria-hidden="true" />
              <Link className="topbar-item topbar-link" href="/pages/lien-he">
                Liên hệ
              </Link>
            </div>

            <div className="box-right">
              <div className="topbar-item notify">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="notify-title" aria-label="Thông báo">
                      <span className="relative inline-flex">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 32 32"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="m29.39355 22.24194c0-1.85809-1.32587-3.40649-3.07745-3.76453v-7.15167c0-5.70001-4.62579-10.32574-10.3161-10.32574s-10.3161 4.62573-10.3161 10.32574v7.15167c-1.75159.35803-3.07745 1.90643-3.07745 3.76453 0 2.10968 1.7226 3.83221 3.84192 3.83221h19.10327c2.11932.00001 3.84191-1.72253 3.84191-3.83221z"></path>
                          <path d="m16 31c2.32263 0 4.32581-1.43231 5.15808-3.47424h-10.31616c.83227 2.04193 2.83545 3.47424 5.15808 3.47424z"></path>
                        </svg>
                        {notificationCount > 0 ? (
                          <span className="badge-count">{notificationCount}</span>
                        ) : null}
                      </span>
                      <span>Thông báo</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[320px] p-3">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">
                        Thông báo
                      </p>
                      <span className="text-xs font-semibold text-ink/60">
                        {notificationCount}
                      </span>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="rounded-lg border border-forest/10 bg-forest/5 px-3 py-2 text-xs text-ink/70">
                          Chưa có thông báo.
                        </div>
                      ) : (
                        notifications.map((item) => {
                          if (item.type === "popup") {
                            return (
                              <DropdownMenuItem
                                key={item.id}
                                onSelect={handleOpenPopup}
                                className="cursor-pointer rounded-lg border border-forest/10 bg-white px-3 py-2"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                                  <p className="text-xs text-ink/70">{item.description}</p>
                                </div>
                              </DropdownMenuItem>
                            );
                          }

                          return (
                            <DropdownMenuItem
                              key={item.id}
                              asChild
                              className="cursor-pointer rounded-lg border border-forest/10 bg-white px-3 py-2"
                            >
                              <Link href={item.href} className="space-y-1">
                                <p className="text-sm font-semibold text-ink">{item.title}</p>
                                <p className="text-xs text-ink/70">{item.description}</p>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <span className="topbar-divider hidden md:inline" aria-hidden="true" />
              <span className="topbar-meta hidden md:inline">
                <span>Giao hàng tận nhà</span>
                <span className="topbar-dot" aria-hidden="true">
                  •
                </span>
                <span>Đổi trả trong 24h</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
