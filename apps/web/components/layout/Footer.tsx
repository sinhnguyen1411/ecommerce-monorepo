import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-forest/10 bg-forest text-white">
      <div className="section-shell grid gap-10 py-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold">{siteConfig.name}</h2>
          <p className="mt-3 text-sm text-white/70">
            Ket noi nong san sach va nguoi tieu dung. Van chuyen nhanh, ho tro tan tinh.
          </p>
          <div className="mt-4 space-y-1 text-sm text-white/70">
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Mua sam</p>
          <Link href="/products" className="block hover:text-white">San pham</Link>
          <Link href="/cart" className="block hover:text-white">Gio hang</Link>
          <Link href="/checkout" className="block hover:text-white">Thanh toan</Link>
          <Link href="/locations" className="block hover:text-white">Cua hang</Link>
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Ho tro</p>
          <Link href="/pages/return-policy" className="block hover:text-white">Chinh sach doi tra</Link>
          <Link href="/pages/terms-of-service" className="block hover:text-white">Dieu khoan</Link>
          <Link href="/pages/hoi-dap-cung-nha-nong" className="block hover:text-white">Hoi dap</Link>
          <Link href="/pages/about-us" className="block hover:text-white">Gioi thieu</Link>
        </div>
        <div className="space-y-3 text-sm text-white/70">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Ban tin</p>
          <p>Dang ky nhan thong tin uu dai moi nhat tu TTC.</p>
          <div className="flex flex-col gap-3">
            <input className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60" placeholder="Email cua ban" />
            <button className="h-10 rounded-full bg-sun text-sm font-semibold text-ink">Dang ky</button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        TTC Ecommerce. All rights reserved.
      </div>
    </footer>
  );
}
