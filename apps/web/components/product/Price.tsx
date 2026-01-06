"use client";

import { formatCurrency } from "@/lib/format";

export default function Price({
  price,
  compareAt
}: {
  price: number;
  compareAt?: number | null;
}) {
  const onSale = typeof compareAt === "number" && compareAt > price;

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold text-forest">{formatCurrency(price)}</span>
      {onSale ? (
        <span className="text-sm text-ink/50 line-through">
          {formatCurrency(compareAt)}
        </span>
      ) : null}
    </div>
  );
}
