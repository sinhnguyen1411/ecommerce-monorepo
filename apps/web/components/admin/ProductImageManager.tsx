"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ExternalLink, FileImage, Star, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inputClass, secondaryActionClass } from "@/components/admin/AdminHelpers";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_LIMIT,
  type ProductImageItem,
} from "@/components/admin/product-image-helpers";

export default function ProductImageManager({
  items,
  urlInput,
  uploadSummary,
  canAddMore,
  onUrlInputChange,
  onAddByUrl,
  onFilesSelected,
  onRemoveImage,
  onMoveImageUp,
  onMoveImageDown,
  onSetPrimaryImage,
}: {
  items: ProductImageItem[];
  urlInput: string;
  uploadSummary: string;
  canAddMore: boolean;
  onUrlInputChange: (value: string) => void;
  onAddByUrl: () => void;
  onFilesSelected: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onMoveImageUp: (index: number) => void;
  onMoveImageDown: (index: number) => void;
  onSetPrimaryImage: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!canAddMore) {
      return;
    }
    onFilesSelected(event.dataTransfer.files);
  };

  const isBlobPreview = (url: string) => url.startsWith("blob:");

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--color-primary)]">
              <FileImage className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Hình ảnh sản phẩm</h3>
              <p className="text-sm text-slate-500">
                Ảnh đầu tiên sẽ được dùng làm ảnh chính trên danh sách và trang chi tiết sản phẩm.
              </p>
            </div>
          </div>
        </div>
        <div className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
          {items.length}/{PRODUCT_IMAGE_LIMIT}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (canAddMore) {
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          disabled={!canAddMore}
          className={`w-full rounded-[20px] border border-dashed px-4 py-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 ${
            isDragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-slate-300 bg-white hover:border-[var(--color-primary)]/40 hover:bg-slate-50"
          } ${canAddMore ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          data-testid="admin-product-image-dropzone"
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[var(--color-primary)]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Tải ảnh lên từ máy</p>
              <p className="text-sm text-slate-500">
                Kéo và thả ảnh vào đây hoặc bấm để chọn ảnh
              </p>
              <p className="text-xs text-slate-500">Chỉ hỗ trợ JPG, PNG, WEBP</p>
            </div>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={PRODUCT_IMAGE_ACCEPT}
          className="hidden"
          onChange={(event) => {
            onFilesSelected(event.target.files);
            event.target.value = "";
          }}
          data-testid="admin-product-image-input"
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Thêm bằng URL</p>
              <p className="text-xs text-slate-500">Dùng khi ảnh đã có sẵn trên CDN hoặc nguồn tin cậy.</p>
            </div>
            {uploadSummary ? (
              <span className="text-xs font-medium text-slate-500">{uploadSummary}</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className={`${inputClass} flex-1`}
              placeholder="https://..."
              value={urlInput}
              onChange={(event) => onUrlInputChange(event.target.value)}
              data-testid="admin-product-image-url"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onAddByUrl}
              disabled={!canAddMore}
              className={`${secondaryActionClass} sm:min-w-[132px]`}
              data-testid="admin-product-image-add-url"
            >
              Thêm bằng URL
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.length ? (
            items.map((item, index) => {
              const isPrimary = index === 0;

              return (
                <div
                  key={item.clientId}
                  className="overflow-hidden rounded-[20px] border border-slate-200 bg-white"
                  data-testid={`admin-product-image-tile-${index}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {item.url ? (
                      isBlobPreview(item.url) ? (
                        <img
                          src={item.url}
                          alt={isPrimary ? "Ảnh đại diện sản phẩm" : `Ảnh sản phẩm ${index + 1}`}
                          className={`h-full w-full object-cover transition ${
                            item.status === "uploading" ? "opacity-70" : "opacity-100"
                          }`}
                        />
                      ) : (
                        <Image
                          src={item.url}
                          alt={isPrimary ? "Ảnh đại diện sản phẩm" : `Ảnh sản phẩm ${index + 1}`}
                          fill
                          sizes="(min-width: 1280px) 220px, (min-width: 640px) 40vw, 100vw"
                          className={`object-cover transition ${
                            item.status === "uploading" ? "opacity-70" : "opacity-100"
                          }`}
                          unoptimized
                        />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        Ảnh đang được xử lý
                      </div>
                    )}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      {isPrimary ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                          <Star className="h-3 w-3" />
                          Ảnh đại diện
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetPrimaryImage(index)}
                          className="inline-flex min-h-8 items-center rounded-full border border-white/80 bg-white/95 px-2.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                          aria-label="Đặt làm ảnh chính"
                        >
                          Đặt làm ảnh chính
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-700 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                          aria-label="Xem ảnh"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onRemoveImage(index)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-rose-600 transition hover:border-rose-200 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                          aria-label="Xóa ảnh"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {item.status === "uploading" ? (
                      <div className="absolute inset-x-3 bottom-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white">
                        Đang tải lên...
                      </div>
                    ) : null}
                    {item.status === "error" ? (
                      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-rose-200 bg-white/95 px-3 py-2 text-xs text-rose-600">
                        {item.error || "Tải lên thất bại. Vui lòng thử lại."}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {isPrimary ? "Ảnh chính" : `Ảnh ${index + 1}`}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.source === "url" ? "Nguồn: URL" : "Nguồn: tải lên"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onMoveImageUp(index)}
                        disabled={index === 0}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Di chuyển sang trái"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveImageDown(index)}
                        disabled={index === items.length - 1}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Di chuyển sang phải"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="sm:col-span-2 xl:col-span-3 rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-900">Chưa có ảnh nào</p>
              <p className="mt-1 text-sm text-slate-500">
                Hãy tải ảnh lên hoặc thêm bằng URL để hoàn thiện phần trưng bày sản phẩm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
