"use client";

import { KeyboardEvent, MouseEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Facebook, MessageCircle, MessageSquare } from "lucide-react";

import BrandSignature from "@/components/brand/BrandSignature";
import { isAuthOnlyPath } from "@/lib/auth-route";
import { useContactSettings } from "@/lib/client-content";
import type { ContactSettings } from "@/lib/content";
import { siteConfig } from "@/lib/site";

type FooterProps = {
  editorMode?: boolean;
  disableNavigation?: boolean;
  contactSettings?: ContactSettings;
  onContactChange?: (patch: Partial<ContactSettings>) => void;
  onContactBlur?: () => void;
};

function InlineEditableFooterField({
  value,
  multiline = false,
  placeholder,
  editorMode,
  onCommit,
  onBlur,
  testId
}: {
  value: string;
  multiline?: boolean;
  placeholder?: string;
  editorMode?: boolean;
  onCommit?: (value: string) => void;
  onBlur?: () => void;
  testId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  const commit = () => {
    if (draft.trim() !== value.trim()) {
      onCommit?.(draft.trim());
    }
    setEditing(false);
    onBlur?.();
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  };

  if (!editorMode) {
    return <span>{value}</span>;
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          data-testid={testId ? `${testId}-input` : undefined}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-emerald-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none ring-2 ring-emerald-200"
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        data-testid={testId ? `${testId}-input` : undefined}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-emerald-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none ring-2 ring-emerald-200"
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => setEditing(true)}
      className="inline-flex min-h-11 items-center gap-1 rounded-md border border-emerald-300 bg-white/95 px-2 py-1 text-left text-sm font-semibold text-slate-800 transition hover:bg-emerald-50"
      title="Bấm để chỉnh sửa"
    >
      <span>{value || placeholder || "Chưa có nội dung"}</span>
    </button>
  );
}

export default function Footer({
  editorMode = false,
  disableNavigation = false,
  contactSettings,
  onContactChange,
  onContactBlur
}: FooterProps) {
  const pathname = usePathname();
  const liveSettings = useContactSettings();
  const settings = contactSettings || liveSettings;

  if (isAuthOnlyPath(pathname)) {
    return null;
  }

  const handleLinkClick = (event: MouseEvent<HTMLElement>) => {
    if (!disableNavigation) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const handleCaptureClick = (event: MouseEvent<HTMLElement>) => {
    if (!disableNavigation) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target?.closest("a")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <footer className="footer-main" onClickCapture={handleCaptureClick}>
      <div className="footer-top">
        <div className="section-shell py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="footer-widget-title">{"Bản tin"}</p>
              <h3 className="text-lg font-semibold">
                {"Đăng ký nhận thông tin ưu đãi từ Tam Bố"}
              </h3>
              <p className="mt-2 text-sm text-white/70">
                {"Nhập email để nhận tin về sản phẩm và khuyến mãi mới."}
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                className="h-10 flex-1 border border-white/20 bg-white px-3 text-sm text-ink"
                placeholder={"Email của bạn"}
              />
              <button className="button">{"Đăng ký"}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-shell grid gap-10 py-10 lg:grid-cols-[1.2fr_1fr_0.8fr_1fr]">
        <div>
          <Link href="/" className="footer-brand" data-testid="site-footer-brand" onClick={handleLinkClick}>
            <BrandSignature mode="footer" priority logoSizes="(max-width: 640px) 56px, 64px" />
          </Link>
          <p className="mt-3 text-sm text-white/70">
            {"Kết nối nông sản sạch và người tiêu dùng. Hỗ trợ tư vấn và giao hàng nhanh."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Link
              href={siteConfig.social.facebook}
              target="_blank"
              rel="noreferrer"
              onClick={handleLinkClick}
            >
              <span className="flex h-8 w-8 items-center justify-center border border-white/20">
                <Facebook className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href={siteConfig.social.messenger}
              target="_blank"
              rel="noreferrer"
              onClick={handleLinkClick}
            >
              <span className="flex h-8 w-8 items-center justify-center border border-white/20">
                <MessageSquare className="h-4 w-4" />
              </span>
            </Link>
            <Link href={siteConfig.social.zalo} target="_blank" rel="noreferrer" onClick={handleLinkClick}>
              <span className="flex h-8 w-8 items-center justify-center border border-white/20">
                <MessageCircle className="h-4 w-4" />
              </span>
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Image src="/tam-bo/footer/payment_1_img.png" alt="payment" width={80} height={28} className="h-7 w-auto" sizes="80px" />
            <Image src="/tam-bo/footer/payment_2_img.png" alt="payment" width={80} height={28} className="h-7 w-auto" sizes="80px" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/70" data-testid="admin-home-footer-contact">
          <p className="footer-widget-title">{"Liên hệ"}</p>
          <InlineEditableFooterField
            multiline
            value={settings.address}
            editorMode={editorMode}
            onCommit={(next) => onContactChange?.({ address: next })}
            onBlur={onContactBlur}
            placeholder="Địa chỉ"
            testId="admin-home-footer-address"
          />
          <p>
            Hotline:{" "}
            <InlineEditableFooterField
              value={settings.phone}
              editorMode={editorMode}
              onCommit={(next) => onContactChange?.({ phone: next })}
              onBlur={onContactBlur}
              placeholder="Số điện thoại"
              testId="admin-home-footer-phone"
            />
          </p>
          <p>
            KTV:{" "}
            <InlineEditableFooterField
              value={settings.fax}
              editorMode={editorMode}
              onCommit={(next) => onContactChange?.({ fax: next })}
              onBlur={onContactBlur}
              placeholder="Số fax"
              testId="admin-home-footer-fax"
            />
          </p>
          <p>
            Email:{" "}
            <InlineEditableFooterField
              value={settings.email}
              editorMode={editorMode}
              onCommit={(next) => onContactChange?.({ email: next })}
              onBlur={onContactBlur}
              placeholder="Email"
              testId="admin-home-footer-email"
            />
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Image src="/tam-bo/footer/shipment_1_img.png" alt="shipping" width={90} height={32} className="h-8 w-auto" sizes="90px" />
            <Image src="/tam-bo/footer/shipment_2_img.png" alt="shipping" width={90} height={32} className="h-8 w-auto" sizes="90px" />
            <Image src="/tam-bo/footer/shipment_4_img.png" alt="shipping" width={90} height={32} className="h-8 w-auto" sizes="90px" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">{"Nhóm liên kết"}</p>
          <p>{"Đang cập nhật."}</p>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">{"Hỗ trợ"}</p>
          <Link href="/search" className="block text-white/70 hover:text-white" onClick={handleLinkClick}>
            {"Tìm kiếm"}
          </Link>
          <Link href="/pages/about-us" className="block text-white/70 hover:text-white" onClick={handleLinkClick}>
            {"Giới thiệu"}
          </Link>
          <Link href="/pages/chinh-sach-doi-tra" className="block text-white/70 hover:text-white" onClick={handleLinkClick}>
            {"Chính sách đổi trả"}
          </Link>
          <Link href="/pages/chinh-sach-bao-mat" className="block text-white/70 hover:text-white" onClick={handleLinkClick}>
            {"Chính sách bảo mật"}
          </Link>
          <Link href="/pages/dieu-khoan-dich-vu" className="block text-white/70 hover:text-white" onClick={handleLinkClick}>
            {"Điều khoản dịch vụ"}
          </Link>
          <Link href="/pages/lien-he" className="block text-white/70 hover:text-white" onClick={handleLinkClick}>
            {"Liên hệ"}
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        {"Tam Bố Ecommerce. Bảo lưu mọi quyền."}
      </div>
    </footer>
  );
}
