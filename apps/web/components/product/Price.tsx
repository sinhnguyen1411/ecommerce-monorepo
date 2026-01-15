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
    <div className="price-block">
      <span className="price">{formatCurrency(price)}</span>
      {onSale ? <span className="price-del">{formatCurrency(compareAt)}</span> : null}
    </div>
  );
}
