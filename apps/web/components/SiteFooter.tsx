import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-forest/10 bg-white/70">
      <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
        <div>
          <p className="pill">Liên hệ</p>
          <h2 className="mt-4 text-2xl font-semibold">{siteConfig.name}</h2>
          <p className="mt-3 text-sm text-ink/70">
            Kết nối với nguồn nông sản tin cậy, giao hàng nhanh, hỗ trợ người mua và
            người trồng trọt.
          </p>
          <div className="mt-4 space-y-1 text-sm text-ink/70">
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            Danh mục
          </p>
          <Link className="block hover:text-clay" href="/products">
            Sản phẩm
          </Link>
          <Link className="block hover:text-clay" href="/blog">
            Tin tức
          </Link>
          <Link className="block hover:text-clay" href="/pages/about-us">
            Giới thiệu
          </Link>
          <Link className="block hover:text-clay" href="/pages/return-policy">
            Chính sách đổi trả
          </Link>
          <Link className="block hover:text-clay" href="/pages/terms-of-service">
            Điều khoản
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            Đăng ký bản tin
          </p>
          <p className="text-ink/70">
            Nhận thông tin về mùa vụ mới và ưu đãi từ Tam Bố.
          </p>
          <div className="flex flex-col gap-3">
            <input className="field" placeholder="Email của bạn" />
            <button className="btn-secondary">Đăng ký</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
