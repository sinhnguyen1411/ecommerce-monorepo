"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import { useCartStore } from "@/store/cart";

import Price from "./Price";

type ProductDetailSidebarProps = {
  product: Product;
};

export default function ProductDetailSidebar({ product }: ProductDetailSidebarProps) {
  const addItem = useCartStore((state) => state.addItem);
  const image = product.images?.[0]?.url;

  return (
    <div className="flex flex-col rounded-[32px] border border-forest/10 bg-white/90 p-8 shadow-[0_20px_40px_-28px_rgba(33,55,43,0.4)]">
      <div className="flex flex-wrap gap-2">
        {product.categories?.map((category) => (
          <span key={category.id} className="chip">
            {category.name}
          </span>
        ))}
      </div>
      <h1 className="mt-4 text-3xl font-semibold">{product.name}</h1>
      <p className="mt-4 text-sm text-ink/70">
        {product.description ||
          "San pham tu nong trai doi tac, dam bao chat luong va do tuoi moi."}
      </p>
      <div className="mt-6">
        <Price price={product.price} compareAt={product.compare_at_price} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={() =>
            addItem({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              compareAtPrice: product.compare_at_price,
              imageUrl: image
            })
          }
        >
          Them vao gio
        </Button>
        <Button variant="outline">Them vao danh sach</Button>
      </div>
      <div className="mt-8 space-y-3 text-sm text-ink/70">
        <div className="flex items-center justify-between">
          <span>Hoan tra</span>
          <Link className="text-forest" href="/pages/return-policy">
            Xem chinh sach
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <span>Dieu khoan</span>
          <Link className="text-forest" href="/pages/terms-of-service">
            Xem chi tiet
          </Link>
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-forest/10 bg-white/70 p-5 text-sm text-ink/70">
        <p className="font-semibold">Ho tro nhanh</p>
        <p className="mt-2">Hotline: {siteConfig.phone}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link className="btn-ghost" href={siteConfig.social.zalo}>
            Zalo
          </Link>
          <Link className="btn-ghost" href={siteConfig.social.messenger}>
            Messenger
          </Link>
          <Link className="btn-ghost" href={siteConfig.social.facebook}>
            Facebook
          </Link>
        </div>
      </div>
    </div>
  );
}
