"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Loader2,
  Megaphone,
  Phone,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Save
} from "lucide-react";

import AdminLinkPicker, { type AdminLinkOption } from "@/components/admin/AdminLinkPicker";
import HomeContentSections, { HomeEditorSectionKey } from "@/components/home/HomeContentSections";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Topbar from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { uploadAdminFile, type AdminDensityMode } from "@/lib/admin";
import type {
  ContactSettings,
  HomeBanner,
  HomePageContent,
  NotificationSettings,
  PromoPopupSettings
} from "@/lib/content";
import {
  AdminField,
  AdminSectionHeader,
  inputClass,
  panelByDensity,
  selectClass,
  textareaClass
} from "./AdminHelpers";

type SaveState = "idle" | "saving" | "saved" | "error";
type EditorSection =
  | "banner"
  | "intro"
  | "spotlightContent"
  | "spotlightImage"
  | "features"
  | "aboutTeaser"
  | "contact"
  | "promoPopup"
  | "notifications";

function MediaField({
  label,
  value,
  onChange,
  onBlur,
  helper,
  testId
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  helper?: string;
  testId?: string;
}) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadAdminFile(files[0] as File);
      onChange(uploaded.url);
      onBlur();
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminField label={label} helper={helper}>
      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        {value ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src={value} alt="Preview" className="h-36 w-full object-cover" />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-xs text-slate-500">
            Chưa có ảnh.
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {(["upload", "url"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`min-h-11 rounded-full px-3 py-1 text-xs font-semibold ${
                tab === item ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-600"
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto min-h-11 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            onClick={() => {
              onChange("");
              onBlur();
            }}
          >
            Xóa ảnh
          </button>
        </div>
        {tab === "upload" ? (
          <div className="space-y-1">
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              disabled={uploading}
              onChange={(event) => void handleUpload(event.target.files)}
              data-testid={testId ? `${testId}-file` : undefined}
            />
            {uploading ? <p className="text-xs text-slate-500">Đang tải ảnh...</p> : null}
          </div>
        ) : null}
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            className={`${inputClass} flex-1`}
            placeholder="https://..."
            data-testid={testId ? `${testId}-url` : undefined}
          />
          <Button
            type="button"
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => {
              const next = urlInput.trim();
              if (!next) return;
              onChange(next);
              setUrlInput("");
              onBlur();
            }}
            data-testid={testId ? `${testId}-apply-url` : undefined}
          >
            Dùng
          </Button>
        </div>
      </div>
    </AdminField>
  );
}

export default function AdminHomeVisualEditor(props: {
  density: AdminDensityMode;
  content: HomePageContent;
  saveState: SaveState;
  saveError: string;
  savedAt: string | null;
  hasUnpublishedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  linkOptions: AdminLinkOption[];
  onUndo: () => void;
  onRedo: () => void;
  onRevert: () => void;
  onPublish: () => void;
  onFlushDraft: () => void;
  onBannersChange: (next: HomeBanner[]) => void;
  onIntroChange: (patch: Partial<HomePageContent["intro"]>) => void;
  onSpotlightChange: (index: number, patch: Partial<HomePageContent["spotlights"][number]>) => void;
  onSpotlightBulletsChange: (index: number, value: string) => void;
  onSpotlightAdd: () => void;
  onSpotlightDelete: (index: number) => void;
  onSpotlightMove: (index: number, direction: -1 | 1) => void;
  onFeatureChange: (index: number, patch: Partial<HomePageContent["features"][number]>) => void;
  onAboutTeaserChange: (patch: Partial<HomePageContent["aboutTeaser"]>) => void;
  onPopupChange: (patch: Partial<PromoPopupSettings>) => void;
  onNotificationChange: (next: NotificationSettings) => void;
  onContactChange: (patch: Partial<ContactSettings>) => void;
}) {
  const {
    density,
    content,
    saveState,
    saveError,
    savedAt,
    hasUnpublishedChanges,
    canUndo,
    canRedo,
    linkOptions,
    onUndo,
    onRedo,
    onRevert,
    onPublish,
    onFlushDraft,
    onBannersChange,
    onIntroChange,
    onSpotlightChange,
    onSpotlightBulletsChange,
    onSpotlightAdd,
    onSpotlightDelete,
    onSpotlightMove,
    onFeatureChange,
    onAboutTeaserChange,
    onPopupChange,
    onNotificationChange,
    onContactChange
  } = props;

  const [selectedSection, setSelectedSection] = useState<HomeEditorSectionKey>("intro");
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0);
  const [selectedSpotlightIndex, setSelectedSpotlightIndex] = useState(0);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);
  const [selectedNotificationIndex, setSelectedNotificationIndex] = useState(0);
  const [activeEditor, setActiveEditor] = useState<EditorSection | null>(null);
  const [isBannerPreviewLocked, setIsBannerPreviewLocked] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const panelClass = panelByDensity(density);
  const currentBanner = content.banners[selectedBannerIndex];
  const currentSpotlight = content.spotlights[selectedSpotlightIndex];
  const currentFeature = content.features[selectedFeatureIndex];
  const currentNotification = content.notifications.items[selectedNotificationIndex];
  const bannerEyebrowTrimmed = currentBanner?.eyebrow.trim() || "";
  const bannerBadgeTrimmed = currentBanner?.badge.trim() || "";
  const isBannerIdentityDuplicate =
    bannerEyebrowTrimmed.length > 0 &&
    bannerBadgeTrimmed.length > 0 &&
    bannerEyebrowTrimmed.toLocaleLowerCase() === bannerBadgeTrimmed.toLocaleLowerCase();

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 1024);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    setSelectedBannerIndex((prev) => Math.min(prev, Math.max(content.banners.length - 1, 0)));
  }, [content.banners.length]);

  useEffect(() => {
    setSelectedSpotlightIndex((prev) =>
      Math.min(prev, Math.max(content.spotlights.length - 1, 0))
    );
  }, [content.spotlights.length]);

  useEffect(() => {
    setSelectedFeatureIndex((prev) => Math.min(prev, Math.max(content.features.length - 1, 0)));
  }, [content.features.length]);

  useEffect(() => {
    setSelectedNotificationIndex((prev) =>
      Math.min(prev, Math.max(content.notifications.items.length - 1, 0))
    );
  }, [content.notifications.items.length]);

  const saveLabel = useMemo(() => {
    if (saveState === "saving") return "Đang lưu nháp...";
    if (saveState === "saved") return "Đã lưu nháp";
    if (saveState === "error") return "Lưu nháp lỗi";
    return hasUnpublishedChanges ? "Có thay đổi chưa publish" : "Đang đồng bộ";
  }, [hasUnpublishedChanges, saveState]);

  const updateBanner = (index: number, patch: Partial<HomeBanner>) => {
    if (!content.banners[index]) return;
    onBannersChange(content.banners.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateNotification = (
    index: number,
    patch: Partial<HomePageContent["notifications"]["items"][number]>
  ) => {
    if (!content.notifications.items[index]) return;
    onNotificationChange({
      items: content.notifications.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    });
  };

  const handleSectionSelect = (section: HomeEditorSectionKey) => {
    setSelectedSection(section);
    if (section !== "banners") {
      setIsBannerPreviewLocked(false);
    }
  };

  const handleBannerSelect = (index: number) => {
    setSelectedSection("banners");
    setSelectedBannerIndex(index);
    setIsBannerPreviewLocked(true);
  };

  const openEditor = (section: EditorSection, index?: number) => {
    setActiveEditor(section);
    if (section !== "banner") {
      setIsBannerPreviewLocked(false);
    }
    if (section === "banner") {
      setSelectedSection("banners");
      setIsBannerPreviewLocked(true);
      if (typeof index === "number") setSelectedBannerIndex(index);
      return;
    }
    if (section === "spotlightContent" || section === "spotlightImage") {
      setSelectedSection("spotlights");
      if (typeof index === "number") setSelectedSpotlightIndex(index);
      return;
    }
    if (section === "features") {
      setSelectedSection("features");
      if (typeof index === "number") setSelectedFeatureIndex(index);
      return;
    }
    if (section === "intro") {
      setSelectedSection("intro");
      return;
    }
    if (section === "aboutTeaser") {
      setSelectedSection("aboutTeaser");
    }
  };

  const editorTitle: Record<EditorSection, string> = {
    banner: "Sửa banner",
    intro: "Nội dung định hướng",
    spotlightContent: "Nội dung spotlight",
    spotlightImage: "Ảnh spotlight",
    features: "Nội dung ưu điểm",
    aboutTeaser: "Nội dung giới thiệu",
    contact: "Topbar & Liên hệ",
    promoPopup: "Cài đặt popup",
    notifications: "Cài đặt thông báo"
  };

  const dockBaseClass =
    "min-h-11 rounded-lg px-3 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45";
  const dockSecondaryClass = `${dockBaseClass} border border-slate-400 bg-white text-slate-900 hover:bg-slate-100`;
  const dockPrimaryClass = `${dockBaseClass} bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-slate-400`;

  return (
    <div className="space-y-5 pb-24">
      <div className={panelClass}>
        <AdminSectionHeader
          title="Trình chỉnh sửa trang chủ trực quan"
          description="Chỉnh nội dung theo block, tự động lưu nháp và xuất bản thủ công."
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {saveState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saveState === "saved" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
            {saveState === "error" ? <Bell className="h-3.5 w-3.5 text-rose-600" /> : null}
            {saveLabel}
          </span>
          {savedAt ? <span className="text-xs text-slate-500">Lần lưu: {savedAt}</span> : null}
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="admin-home-edit-contact"
              onClick={() => openEditor("contact")}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              <Phone className="h-3.5 w-3.5" />
              Topbar & Liên hệ
            </button>
            <button
              type="button"
              data-testid="admin-home-edit-popup"
              onClick={() => openEditor("promoPopup")}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              <Megaphone className="h-3.5 w-3.5" />
              Popup ưu đãi
            </button>
            <button
              type="button"
              data-testid="admin-home-edit-notifications"
              onClick={() => openEditor("notifications")}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              <Bell className="h-3.5 w-3.5" />
              Thông báo
            </button>
          </div>
        </div>
        {saveError ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {saveError}
          </div>
        ) : null}
        {!isDesktop ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Chỉ hỗ trợ chỉnh sửa trên desktop. Mobile/tablet ở chế độ xem.
          </div>
        ) : null}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <div className="admin-home-canvas-shell relative overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="admin-home-canvas-chrome pointer-events-none">
              <Topbar
                promoSettings={content.promoPopup}
                notificationSettings={content.notifications}
                contactSettings={content.contactSettings}
              />
              <Header />
            </div>
            <div className="home-main" role="presentation">
              <HomeContentSections
                content={content}
                editable={isDesktop}
                disableNavigation={isDesktop}
                selectedSection={selectedSection}
                onSelectSection={handleSectionSelect}
                selectedBannerIndex={selectedSection === "banners" ? selectedBannerIndex : null}
                onSelectBanner={handleBannerSelect}
                lockBannerPreview={isBannerPreviewLocked}
                onOpenEditor={(section, index, mode) => {
                  if (section === "banners") {
                    return openEditor("banner", index);
                  }
                  if (section === "spotlights") {
                    return openEditor(
                      mode === "content" ? "spotlightContent" : "spotlightImage",
                      index
                    );
                  }
                  if (section === "features") return openEditor("features", index);
                  if (section === "intro") return openEditor("intro");
                  return openEditor("aboutTeaser");
                }}
                onBannerAdd={() => {
                  const base = content.banners[content.banners.length - 1] || content.banners[0];
                  if (!base) return;
                  onBannersChange([
                    ...content.banners,
                    {
                      ...base,
                      id: `banner-${Date.now()}`,
                      title: `${base.title} (Bản sao)`,
                      order: content.banners.length + 1
                    }
                  ]);
                }}
                onBannerDuplicate={(index) => {
                  const target = content.banners[index];
                  if (!target) return;
                  onBannersChange([
                    ...content.banners,
                    {
                      ...target,
                      id: `banner-${Date.now()}`,
                      title: `${target.title} (Bản sao)`,
                      order: content.banners.length + 1
                    }
                  ]);
                }}
                onBannerDelete={(index) => {
                  if (content.banners.length <= 1) return;
                  onBannersChange(content.banners.filter((_, i) => i !== index));
                }}
                onBannerMove={(index, direction) => {
                  const nextIndex = index + direction;
                  if (nextIndex < 0 || nextIndex >= content.banners.length) return;
                  const next = [...content.banners];
                  const moved = next[index];
                  if (!moved) return;
                  next.splice(index, 1);
                  next.splice(nextIndex, 0, moved);
                  onBannersChange(next.map((item, order) => ({ ...item, order: order + 1 })));
                }}
                onSpotlightAdd={onSpotlightAdd}
                onSpotlightDuplicate={(index) => {
                  const target = content.spotlights[index];
                  if (!target) return;
                  onSpotlightAdd();
                  onSpotlightChange(content.spotlights.length, {
                    ...target,
                    id: `spot-${Date.now()}`,
                    title: `${target.title} (Bản sao)`
                  });
                }}
                onSpotlightDelete={onSpotlightDelete}
                onSpotlightMove={onSpotlightMove}
              />
            </div>
            <div className="admin-home-canvas-chrome">
              <Footer
                editorMode={isDesktop}
                disableNavigation={isDesktop}
                contactSettings={content.contactSettings}
                onContactChange={(patch) => {
                  onContactChange(patch);
                  onFlushDraft();
                }}
                onContactBlur={onFlushDraft}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDesktop && Boolean(activeEditor)} onOpenChange={(open) => !open && setActiveEditor(null)}>
        <DialogContent data-testid="admin-home-editor-modal" className="max-h-[88vh] max-w-2xl rounded-2xl p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle>{activeEditor ? editorTitle[activeEditor] : ""}</DialogTitle>
            <DialogDescription>Chỉnh nội dung theo block và lưu nháp tự động.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {activeEditor === "banner" && currentBanner ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Banner {selectedBannerIndex + 1}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {currentBanner.title || `Banner ${selectedBannerIndex + 1}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Chỉnh nội dung và hình ảnh cho banner này. Muốn đổi banner, hãy đóng cửa sổ
                    và chọn card khác trong canvas.
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Nội dung
                  </p>
                  <AdminField label="Eyebrow">
                    <input
                      className={inputClass}
                      value={currentBanner.eyebrow}
                      onChange={(e) => updateBanner(selectedBannerIndex, { eyebrow: e.target.value })}
                      onBlur={onFlushDraft}
                      data-testid="admin-banner-eyebrow-input"
                    />
                  </AdminField>
                  <AdminField
                    label="Badge"
                    helper={
                      isBannerIdentityDuplicate
                        ? "Eyebrow đang trùng Badge. Nên dùng Eyebrow như thông điệp ngắn khác với định danh công ty."
                        : undefined
                    }
                  >
                    <input
                      className={inputClass}
                      value={currentBanner.badge}
                      onChange={(e) => updateBanner(selectedBannerIndex, { badge: e.target.value })}
                      onBlur={onFlushDraft}
                      data-testid="admin-banner-badge-input"
                    />
                  </AdminField>
                  <AdminField label="Tiêu đề">
                    <input
                      className={inputClass}
                      value={currentBanner.title}
                      onChange={(e) => updateBanner(selectedBannerIndex, { title: e.target.value })}
                      onBlur={onFlushDraft}
                      data-testid="admin-banner-title-input"
                    />
                  </AdminField>
                  <AdminField label="Mô tả">
                    <textarea
                      className={textareaClass}
                      value={currentBanner.description}
                      onChange={(e) =>
                        updateBanner(selectedBannerIndex, { description: e.target.value })
                      }
                      onBlur={onFlushDraft}
                    />
                  </AdminField>
                  <AdminField label="Nhãn CTA">
                    <input
                      className={inputClass}
                      value={currentBanner.ctaLabel}
                      onChange={(e) =>
                        updateBanner(selectedBannerIndex, { ctaLabel: e.target.value })
                      }
                      onBlur={onFlushDraft}
                    />
                  </AdminField>
                  <AdminLinkPicker
                    label="Liên kết CTA"
                    value={currentBanner.ctaHref}
                    options={linkOptions}
                    onChange={(value) => updateBanner(selectedBannerIndex, { ctaHref: value })}
                    onBlur={onFlushDraft}
                    testId="admin-banner-cta-link-picker"
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Hình ảnh
                  </p>
                  <MediaField
                    label="Ảnh desktop"
                    value={currentBanner.desktopSrc}
                    onChange={(value) => updateBanner(selectedBannerIndex, { desktopSrc: value })}
                    onBlur={onFlushDraft}
                    testId="admin-banner-image-desktop"
                  />
                  <MediaField
                    label="Ảnh mobile"
                    value={currentBanner.mobileSrc || currentBanner.desktopSrc}
                    helper="Để trống sẽ fallback về ảnh desktop."
                    onChange={(value) => updateBanner(selectedBannerIndex, { mobileSrc: value })}
                    onBlur={onFlushDraft}
                    testId="admin-banner-image-mobile"
                  />
                  <AdminField label="Alt ảnh">
                    <input
                      className={inputClass}
                      value={currentBanner.alt}
                      onChange={(e) => updateBanner(selectedBannerIndex, { alt: e.target.value })}
                      onBlur={onFlushDraft}
                    />
                  </AdminField>
                </div>
              </div>
            ) : null}

            {activeEditor === "intro" ? (
              <div className="space-y-3">
                <AdminField label="Eyebrow"><input className={inputClass} value={content.intro.eyebrow} onChange={(e) => onIntroChange({ eyebrow: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Tiêu đề phần"><input className={inputClass} value={content.intro.title} onChange={(e) => onIntroChange({ title: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Headline"><input className={inputClass} value={content.intro.headline} onChange={(e) => onIntroChange({ headline: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Mô tả"><textarea className={textareaClass} value={content.intro.description} onChange={(e) => onIntroChange({ description: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <MediaField label="Ảnh định hướng" value={content.intro.imageSrc} onChange={(value) => onIntroChange({ imageSrc: value })} onBlur={onFlushDraft} testId="admin-intro-image" />
                <AdminField label="Alt ảnh định hướng"><input className={inputClass} value={content.intro.imageAlt} onChange={(e) => onIntroChange({ imageAlt: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Nhãn CTA phụ"><input className={inputClass} data-testid="admin-intro-secondary-cta-label" value={content.intro.secondaryCtaLabel} onChange={(e) => onIntroChange({ secondaryCtaLabel: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminLinkPicker label="Liên kết CTA phụ" value={content.intro.secondaryCtaHref} options={linkOptions} onChange={(value) => onIntroChange({ secondaryCtaHref: value })} onBlur={onFlushDraft} testId="admin-intro-secondary-cta-link" />
                <AdminField label="Nhãn CTA chính"><input className={inputClass} data-testid="admin-intro-primary-cta-label" value={content.intro.primaryCtaLabel} onChange={(e) => onIntroChange({ primaryCtaLabel: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminLinkPicker label="Liên kết CTA chính" value={content.intro.primaryCtaHref} options={linkOptions} onChange={(value) => onIntroChange({ primaryCtaHref: value })} onBlur={onFlushDraft} testId="admin-intro-primary-cta-link" />
              </div>
            ) : null}

            {activeEditor === "spotlightContent" && currentSpotlight ? (
              <div className="space-y-3">
                <AdminField label="Spotlight đang chỉnh"><select data-testid="admin-spotlight-select" className={selectClass} value={String(selectedSpotlightIndex)} onChange={(e) => setSelectedSpotlightIndex(Number(e.target.value))}>{content.spotlights.map((item, index) => <option key={item.id} value={index}>{`Block ${index + 1}: ${item.title}`}</option>)}</select></AdminField>
                <AdminField label="Tiêu đề"><input data-testid="admin-spotlight-title-input" className={inputClass} value={currentSpotlight.title} onChange={(e) => onSpotlightChange(selectedSpotlightIndex, { title: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Mô tả"><textarea className={textareaClass} value={currentSpotlight.description} onChange={(e) => onSpotlightChange(selectedSpotlightIndex, { description: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Bullets (mỗi dòng một bullet)"><textarea className={textareaClass} value={currentSpotlight.bullets.join("\n")} onChange={(e) => onSpotlightBulletsChange(selectedSpotlightIndex, e.target.value)} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Nhãn CTA"><input className={inputClass} value={currentSpotlight.ctaLabel} onChange={(e) => onSpotlightChange(selectedSpotlightIndex, { ctaLabel: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminLinkPicker label="Liên kết CTA" value={currentSpotlight.ctaHref} options={linkOptions} onChange={(value) => onSpotlightChange(selectedSpotlightIndex, { ctaHref: value })} onBlur={onFlushDraft} testId="admin-spotlight-cta-link-picker" />
              </div>
            ) : null}

            {activeEditor === "spotlightImage" && currentSpotlight ? (
              <div className="space-y-3">
                <AdminField label="Spotlight đang chỉnh"><select className={selectClass} value={String(selectedSpotlightIndex)} onChange={(e) => setSelectedSpotlightIndex(Number(e.target.value))}>{content.spotlights.map((item, index) => <option key={item.id} value={index}>{`Block ${index + 1}: ${item.title}`}</option>)}</select></AdminField>
                <MediaField label="Ảnh nền" value={currentSpotlight.imageSrc} onChange={(value) => onSpotlightChange(selectedSpotlightIndex, { imageSrc: value })} onBlur={onFlushDraft} testId="admin-spotlight-bg-image" />
                <AdminField label="Alt ảnh nền"><input className={inputClass} value={currentSpotlight.imageAlt} onChange={(e) => onSpotlightChange(selectedSpotlightIndex, { imageAlt: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <MediaField label="Ảnh foreground" value={currentSpotlight.foregroundImageSrc || ""} helper="Có thể để trống nếu không dùng lớp ảnh nổi." onChange={(value) => onSpotlightChange(selectedSpotlightIndex, { foregroundImageSrc: value })} onBlur={onFlushDraft} testId="admin-spotlight-fg-image" />
                <AdminField label="Alt ảnh foreground"><input className={inputClass} value={currentSpotlight.foregroundImageAlt || ""} onChange={(e) => onSpotlightChange(selectedSpotlightIndex, { foregroundImageAlt: e.target.value })} onBlur={onFlushDraft} /></AdminField>
              </div>
            ) : null}

            {activeEditor === "features" && currentFeature ? (
              <div className="space-y-3">
                <AdminField label="Ưu điểm"><select className={selectClass} value={String(selectedFeatureIndex)} onChange={(e) => setSelectedFeatureIndex(Number(e.target.value))}>{content.features.map((item, index) => <option key={item.id} value={index}>{`Feature ${index + 1}: ${item.title}`}</option>)}</select></AdminField>
                <AdminField label="Tiêu đề"><input className={inputClass} value={currentFeature.title} onChange={(e) => onFeatureChange(selectedFeatureIndex, { title: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Mô tả"><textarea className={textareaClass} value={currentFeature.description} onChange={(e) => onFeatureChange(selectedFeatureIndex, { description: e.target.value })} onBlur={onFlushDraft} /></AdminField>
              </div>
            ) : null}

            {activeEditor === "aboutTeaser" ? (
              <div className="space-y-3">
                <AdminField label="Eyebrow"><input className={inputClass} value={content.aboutTeaser.eyebrow} onChange={(e) => onAboutTeaserChange({ eyebrow: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Tiêu đề"><input className={inputClass} value={content.aboutTeaser.title} onChange={(e) => onAboutTeaserChange({ title: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Phụ đề"><textarea className={textareaClass} value={content.aboutTeaser.subtitle} onChange={(e) => onAboutTeaserChange({ subtitle: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Nhãn CTA chính"><input className={inputClass} value={content.aboutTeaser.primaryCtaLabel} onChange={(e) => onAboutTeaserChange({ primaryCtaLabel: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminLinkPicker label="Liên kết CTA chính" value={content.aboutTeaser.primaryCtaHref} options={linkOptions} onChange={(value) => onAboutTeaserChange({ primaryCtaHref: value })} onBlur={onFlushDraft} testId="admin-about-primary-cta-link" />
                <AdminField label="Nhãn CTA phụ"><input className={inputClass} value={content.aboutTeaser.secondaryCtaLabel} onChange={(e) => onAboutTeaserChange({ secondaryCtaLabel: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminLinkPicker label="Liên kết CTA phụ" value={content.aboutTeaser.secondaryCtaHref} options={linkOptions} onChange={(value) => onAboutTeaserChange({ secondaryCtaHref: value })} onBlur={onFlushDraft} testId="admin-about-secondary-cta-link" />
              </div>
            ) : null}

            {activeEditor === "contact" ? (
              <div className="space-y-3">
                <AdminField label="Hotline"><input className={inputClass} value={content.contactSettings.phone} onChange={(e) => onContactChange({ phone: e.target.value })} onBlur={onFlushDraft} data-testid="admin-home-contact-phone" /></AdminField>
                <AdminField label="Số di động"><input className={inputClass} value={content.contactSettings.mobilePhone} onChange={(e) => onContactChange({ mobilePhone: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Fax"><input className={inputClass} value={content.contactSettings.fax} onChange={(e) => onContactChange({ fax: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Email"><input className={inputClass} value={content.contactSettings.email} onChange={(e) => onContactChange({ email: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Địa chỉ"><textarea className={textareaClass} value={content.contactSettings.address} onChange={(e) => onContactChange({ address: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Giờ làm việc"><input className={inputClass} value={content.contactSettings.businessHours} onChange={(e) => onContactChange({ businessHours: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Map URL"><textarea className={textareaClass} value={content.contactSettings.mapUrl} onChange={(e) => onContactChange({ mapUrl: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Facebook URL"><input className={inputClass} value={content.contactSettings.facebookUrl} onChange={(e) => onContactChange({ facebookUrl: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Zalo URL"><input className={inputClass} value={content.contactSettings.zaloUrl} onChange={(e) => onContactChange({ zaloUrl: e.target.value })} onBlur={onFlushDraft} /></AdminField>
              </div>
            ) : null}

            {activeEditor === "promoPopup" ? (
              <div className="space-y-3">
                <AdminField label="Bật popup"><label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={content.promoPopup.isActive} onChange={(e) => onPopupChange({ isActive: e.target.checked })} onBlur={onFlushDraft} />Hiển thị popup</label></AdminField>
                <AdminField label="Tiêu đề"><input className={inputClass} value={content.promoPopup.title} onChange={(e) => onPopupChange({ title: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Phụ đề"><input className={inputClass} value={content.promoPopup.subtitle} onChange={(e) => onPopupChange({ subtitle: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <MediaField label="Ảnh popup" value={content.promoPopup.imageSrc} onChange={(value) => onPopupChange({ imageSrc: value })} onBlur={onFlushDraft} testId="admin-popup-image" />
                <AdminField label="Alt ảnh popup"><input className={inputClass} value={content.promoPopup.imageAlt} onChange={(e) => onPopupChange({ imageAlt: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Nhãn CTA"><input className={inputClass} value={content.promoPopup.ctaLabel} onChange={(e) => onPopupChange({ ctaLabel: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminLinkPicker label="Liên kết CTA" value={content.promoPopup.ctaHref} options={linkOptions} onChange={(value) => onPopupChange({ ctaHref: value })} onBlur={onFlushDraft} testId="admin-popup-cta-link" />
                <AdminField label="Độ trễ mở popup (giây)"><input type="number" min={0} className={inputClass} value={content.promoPopup.delaySeconds} onChange={(e) => onPopupChange({ delaySeconds: Number(e.target.value || 0) })} onBlur={onFlushDraft} /></AdminField>
              </div>
            ) : null}

            {activeEditor === "notifications" && currentNotification ? (
              <div className="space-y-3">
                <AdminField label="Thông báo"><select className={selectClass} value={String(selectedNotificationIndex)} onChange={(e) => setSelectedNotificationIndex(Number(e.target.value))}>{content.notifications.items.map((item, index) => <option key={item.id} value={index}>{`Thông báo ${index + 1}: ${item.title}`}</option>)}</select></AdminField>
                <AdminField label="Kích hoạt"><label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={currentNotification.isActive !== false} onChange={(e) => updateNotification(selectedNotificationIndex, { isActive: e.target.checked })} onBlur={onFlushDraft} />Hiển thị thông báo này</label></AdminField>
                <AdminField label="Tiêu đề"><input className={inputClass} value={currentNotification.title} onChange={(e) => updateNotification(selectedNotificationIndex, { title: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminField label="Mô tả"><textarea className={textareaClass} value={currentNotification.description} onChange={(e) => updateNotification(selectedNotificationIndex, { description: e.target.value })} onBlur={onFlushDraft} /></AdminField>
                <AdminLinkPicker label="Liên kết" value={currentNotification.href} options={linkOptions} onChange={(value) => updateNotification(selectedNotificationIndex, { href: value })} onBlur={onFlushDraft} testId="admin-notification-link" />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <div data-testid="admin-home-action-dock" className="admin-home-action-dock fixed inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm lg:inset-x-auto lg:right-6">
        <Button onClick={onUndo} disabled={!canUndo} className={dockSecondaryClass} data-testid="admin-home-undo"><RotateCcw className="mr-1 h-4 w-4" />Hoàn tác</Button>
        <Button onClick={onRedo} disabled={!canRedo} className={dockSecondaryClass} data-testid="admin-home-redo"><RotateCw className="mr-1 h-4 w-4" />Làm lại</Button>
        <Button onClick={onRevert} className={dockSecondaryClass} data-testid="admin-home-revert"><RefreshCcw className="mr-1 h-4 w-4" />Khôi phục</Button>
        <Button onClick={onPublish} disabled={!hasUnpublishedChanges} className={dockPrimaryClass} data-testid="admin-home-publish"><Save className="mr-1 h-4 w-4" />Xuất bản</Button>
      </div>
    </div>
  );
}
