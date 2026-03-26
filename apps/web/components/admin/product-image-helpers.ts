"use client";

import type { AdminProduct, AdminProductImageInput } from "@/lib/admin";

export const PRODUCT_IMAGE_LIMIT = 10;
export const PRODUCT_IMAGE_MIN = 3;
export const PRODUCT_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ProductImageItemStatus = "idle" | "uploading" | "uploaded" | "error";

export type ProductImageItem = {
  clientId: string;
  id?: number;
  url: string;
  status: ProductImageItemStatus;
  error?: string;
  isNew: boolean;
  source: "existing" | "upload" | "url";
};

export function createImageClientId(seed?: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${seed || "image"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createProductImageItem(
  input: Partial<ProductImageItem> & Pick<ProductImageItem, "url" | "source">,
): ProductImageItem {
  return {
    clientId: input.clientId || createImageClientId(input.source),
    id: input.id,
    url: input.url,
    status: input.status || "idle",
    error: input.error,
    isNew: input.isNew ?? Boolean(!input.id),
    source: input.source,
  };
}

export function mapProductImagesToItems(product: AdminProduct) {
  const sortedImages = [...(product.images || [])]
    .filter((image) => Boolean(image.url?.trim()))
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0));

  return sortedImages.map((image) =>
    createProductImageItem({
      clientId: `existing-${image.id}`,
      id: image.id,
      url: image.url.trim(),
      source: "existing",
      status: "uploaded",
      isNew: false,
    }),
  );
}

export function moveImageUp(items: ProductImageItem[], index: number) {
  if (index <= 0 || index >= items.length) {
    return items;
  }
  const next = [...items];
  [next[index - 1], next[index]] = [next[index], next[index - 1]];
  return next;
}

export function moveImageDown(items: ProductImageItem[], index: number) {
  if (index < 0 || index >= items.length - 1) {
    return items;
  }
  const next = [...items];
  [next[index], next[index + 1]] = [next[index + 1], next[index]];
  return next;
}

export function removeImage(items: ProductImageItem[], index: number) {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

export function setPrimaryImage(items: ProductImageItem[], index: number) {
  if (index <= 0 || index >= items.length) {
    return items;
  }
  const next = [...items];
  const [selected] = next.splice(index, 1);
  next.unshift(selected);
  return next;
}

export function hasImageUrl(items: ProductImageItem[], url: string) {
  const normalized = url.trim();
  return items.some((item) => item.url.trim() === normalized);
}

export function toProductImagePayload(items: ProductImageItem[]): AdminProductImageInput[] {
  return items
    .filter((item) => item.status !== "error" && item.url.trim())
    .map((item, index) => ({
      id: item.id,
      url: item.url.trim(),
      sort_order: index,
    }));
}

export function validateProductImageFile(file: File) {
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";

  if (!PRODUCT_IMAGE_TYPES.has(file.type) || ![".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    return "Chỉ hỗ trợ JPG, PNG, WEBP";
  }

  return null;
}
