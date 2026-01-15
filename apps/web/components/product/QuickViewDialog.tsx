"use client";

import { ReactNode } from "react";

import { Product } from "@/lib/api";
import { useCartStore } from "@/store/cart";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import Price from "./Price";

export default function QuickViewDialog({
  product,
  trigger
}: {
  product: Product;
  trigger?: ReactNode;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const image = product.images?.[0]?.url;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Xem nhanh
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-mist">
            {image ? (
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-ink/50">
                Đang cập nhật ảnh
              </div>
            )}
          </div>
          <div>
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>
                {product.description || "Sản phẩm được chọn từ các nhà vườn đối tác."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
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
                Thêm vào giỏ
              </Button>
              <Button variant="outline">Thêm vào danh sách</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}