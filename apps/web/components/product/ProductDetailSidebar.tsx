"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Facebook, Link2, MessageCircle, Minus, Plus, Twitter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import { useCartStore } from "@/store/cart";

import Price from "./Price";

type ProductDetailSidebarProps = {
  product: Product;
};

export default function ProductDetailSidebar({ product }: ProductDetailSidebarProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const image = product.images?.[0]?.url;
  const [quantity, setQuantity] = useState(1);
  const [shareUrl, setShareUrl] = useState("");
  const available =
    typeof product.available === "boolean"
      ? product.available
      : product.inventory_quantity == null
        ? true
        : product.inventory_quantity > 0;

  const percent = useMemo(() => {
    if (!product.compare_at_price || product.compare_at_price <= product.price) {
      return null;
    }
    return Math.round(
      ((product.compare_at_price - product.price) / product.compare_at_price) * 100
    );
  }, [product.compare_at_price, product.price]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compare_at_price,
      imageUrl: image,
      quantity
    });
  };

  const handleBuyNow = () => {
    handleAdd();
    router.push("/checkout");
  };

  const handleCopy = async () => {
    if (!shareUrl || typeof navigator === "undefined") {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      return;
    }
  };

  const shareEncoded = encodeURIComponent(shareUrl);

  return (
    <div className="flex flex-col border border-forest/10 bg-white p-8">
      <div className="flex flex-wrap gap-2 text-xs">
        {product.vendor ? (
          <span className="border border-forest/10 bg-white px-3 py-1 font-semibold text-ink">
            {product.vendor}
          </span>
        ) : null}
        <span
          className={`px-3 py-1 font-semibold ${
            available ? "bg-forest/10 text-forest" : "bg-clay/20 text-clay"
          }`}
        >
          {available ? "Còn hàng" : "Hết hàng"}
        </span>
      </div>
      <h1 className="mt-4 text-2xl font-semibold">{product.name}</h1>
      <p className="mt-4 text-sm text-ink/70">
        {product.description ||
          "Sản phẩm từ nông trại đối tác, đảm bảo chất lượng và độ tươi mới."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Price price={product.price} compareAt={product.compare_at_price} />
        {percent ? (
          <span className="rounded-full bg-clay/20 px-3 py-1 text-xs font-semibold text-clay">
            -{percent}%
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">Số lượng</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            className="h-10 w-10 border border-forest/20"
            disabled={!available}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2ch] text-center text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity((prev) => prev + 1)}
            className="h-10 w-10 border border-forest/20"
            disabled={!available}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={handleAdd} disabled={!available}>
          Thêm vào giỏ
        </Button>
        <Button variant="outline" onClick={handleBuyNow} disabled={!available}>
          Mua ngay
        </Button>
      </div>

      <div className="mt-5 border border-forest/10 bg-white p-4 text-sm text-ink/70">
        <p className="font-semibold text-ink">Voucher TTC</p>
        <p className="mt-2">Nhận ưu đãi và tư vấn nhanh qua Messenger.</p>
        <Link className="mt-3 inline-flex text-forest" href={siteConfig.social.messenger}>
          Nhận voucher
        </Link>
      </div>

      <div className="mt-6 space-y-3 text-sm text-ink/70">
        <div className="flex items-center justify-between">
          <span>Hoàn trả</span>
          <Link className="text-forest" href={siteConfig.policies.returnPolicy}>
            Xem chính sách
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <span>Điều khoản</span>
          <Link className="text-forest" href={siteConfig.policies.termsOfService}>
            Xem chi tiết
          </Link>
        </div>
      </div>

      <div className="mt-6 border border-forest/10 bg-white p-5 text-sm text-ink/70">
        <p className="font-semibold">Chia sẻ</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            className="button btnlight"
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareEncoded}`}
            target="_blank"
            rel="noreferrer"
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </Link>
          <Link
            className="button btnlight"
            href={`https://twitter.com/intent/tweet?url=${shareEncoded}`}
            target="_blank"
            rel="noreferrer"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Link>
          <button className="button btnlight" onClick={handleCopy}>
            <Link2 className="h-4 w-4" />
            Sao chép url
          </button>
        </div>
      </div>

      <div className="mt-6 border border-forest/10 bg-white p-5 text-sm text-ink/70">
        <p className="font-semibold">Hỗ trợ nhanh</p>
        <p className="mt-2">Hotline: {siteConfig.phone}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link className="button btnlight" href={siteConfig.social.zalo}>
            Zalo
          </Link>
          <Link className="button btnlight" href={siteConfig.social.messenger}>
            Messenger
          </Link>
          <Link className="button btnlight" href={siteConfig.social.facebook}>
            Facebook
          </Link>
        </div>
      </div>
    </div>
  );
}
