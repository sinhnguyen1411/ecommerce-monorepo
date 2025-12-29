import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-forest/10 bg-white/70">
      <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
        <div>
          <p className="pill">Lien he</p>
          <h2 className="mt-4 text-2xl font-semibold">{siteConfig.name}</h2>
          <p className="mt-3 text-sm text-ink/70">
            Ket noi voi nguon nong san tin cay, giao hang nhanh, ho tro nguoi mua va
            nguoi trong troi.
          </p>
          <div className="mt-4 space-y-1 text-sm text-ink/70">
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            Danh muc
          </p>
          <Link className="block hover:text-clay" href="/products">
            San pham
          </Link>
          <Link className="block hover:text-clay" href="/blog">
            Tin tuc
          </Link>
          <Link className="block hover:text-clay" href="/pages/about-us">
            Gioi thieu
          </Link>
          <Link className="block hover:text-clay" href="/pages/return-policy">
            Chinh sach doi tra
          </Link>
          <Link className="block hover:text-clay" href="/pages/terms-of-service">
            Dieu khoan
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            Dang ky ban tin
          </p>
          <p className="text-ink/70">
            Nhan thong tin ve mua vu moi va uu dai tu TTC.
          </p>
          <div className="flex flex-col gap-3">
            <input className="field" placeholder="Email cua ban" />
            <button className="btn-secondary">Dang ky</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
