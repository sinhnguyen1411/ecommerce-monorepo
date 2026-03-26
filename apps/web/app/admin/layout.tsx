"use client";

import { useEffect } from "react";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);

  return <div className="admin-root min-h-screen bg-neutral-50 text-[var(--color-text)]">{children}</div>;
}
