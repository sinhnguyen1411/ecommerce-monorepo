"use client";

import type { AdminDensityMode } from "@/lib/admin";

type AdminContentProps = {
  density: AdminDensityMode;
  children: React.ReactNode;
};

export default function AdminContent({ density, children }: AdminContentProps) {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden" role="main">
      <div
        className={`min-h-full ${density === "compact" ? "p-4 lg:p-5" : "p-4 lg:p-6"} pb-24`}
      >
        {children}
      </div>
    </main>
  );
}
