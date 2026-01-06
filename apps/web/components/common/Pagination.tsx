"use client";

import { cn } from "@/lib/utils";

export default function Pagination({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {pages.map((value) => (
        <button
          key={value}
          onClick={() => onPageChange?.(value)}
          className={cn(
            "h-9 w-9 rounded-full border border-forest/20 text-sm font-semibold",
            value === page ? "bg-forest text-white" : "text-forest"
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
