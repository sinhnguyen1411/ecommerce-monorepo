import { siteConfig } from "@/lib/site";

export default function Topbar() {
  return (
    <div className="bg-forest text-white">
      <div className="section-shell flex flex-wrap items-center justify-between gap-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span>Hotline: {siteConfig.phone}</span>
          <span>Email: {siteConfig.email}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Giao hang nhanh - Dam bao tuoi sach</span>
        </div>
      </div>
    </div>
  );
}
