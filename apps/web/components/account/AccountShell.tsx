"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LucideIcon, MapPin, PackageCheck } from "lucide-react";
import { ReactNode } from "react";

import SectionTitle from "@/components/common/SectionTitle";
import { cn } from "@/lib/utils";

export type AccountTabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AccountShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  showTabs?: boolean;
  tabs?: AccountTabItem[];
  children: ReactNode;
};

const defaultTabs: AccountTabItem[] = [
  {
    href: "/account",
    label: "Tổng quan",
    icon: LayoutDashboard
  },
  {
    href: "/account/orders",
    label: "Đơn hàng",
    icon: PackageCheck
  },
  {
    href: "/account/addresses",
    label: "Sổ địa chỉ",
    icon: MapPin
  }
];

function isTabActive(pathname: string, href: string) {
  if (href === "/account") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountShell({
  title,
  description,
  eyebrow = "Tài khoản",
  showTabs = true,
  tabs = defaultTabs,
  children
}: AccountShellProps) {
  const pathname = usePathname();

  return (
    <div className="account-shell">
      <section className="section-shell pb-6 pt-14">
        <SectionTitle eyebrow={eyebrow} title={title} description={description} />
      </section>

      {showTabs ? (
        <section className="account-shell__tabs-wrap" aria-label="Điều hướng tài khoản">
          <div className="section-shell">
            <nav className="account-shell__tabs" aria-label="Tab tài khoản">
              {tabs.map((tab) => {
                const isActive = isTabActive(pathname, tab.href);
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    data-account-tab={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn("account-shell__tab", isActive && "is-active")}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>
      ) : null}

      <section className="section-shell pb-16">{children}</section>
    </div>
  );
}
