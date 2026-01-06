"use client";

import { Toaster } from "sonner";

export function Sonner() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "rounded-2xl border border-forest/10 bg-white text-ink"
      }}
    />
  );
}
